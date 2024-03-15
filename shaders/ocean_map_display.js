import {tiny} from '../tiny-graphics.js'

const {Shader, Matrix} = tiny
export class OceanMapDisplay extends Shader {
	update_GPU(
		context,
		gpu_addresses,
		graphics_state,
		model_transform,
		material
	) {
		context.uniform1f(gpu_addresses.theta, material.theta)
		context.uniform2fv(gpu_addresses.targets, material.targets)

		if (material.texture && material.texture.ready) {
			context.uniform1i(gpu_addresses.texture, 0)
			material.texture.activate(context)
		}
	}

	shared_glsl_code() {
		// ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
		return `precision mediump float;
            varying vec2 f_tex_coord;
    `
	}

	vertex_glsl_code() {
		// ********* VERTEX SHADER *********
		return (
			this.shared_glsl_code() +
			`
        attribute vec3 position;
        attribute vec2 texture_coord;

        void main(){
            f_tex_coord = texture_coord;
            const float size = 0.4;

            gl_Position = vec4(texture_coord * vec2(size, size * 16. / 9.) + vec2(0.5, 0.2), 0., 1);
        }
        `
		)
	}

	fragment_glsl_code() {
		// ********* FRAGMENT SHADER *********
		return (
			this.shared_glsl_code() +
			`
				uniform sampler2D texture;
				uniform float theta;

				uniform vec2 targets[100];

				float draw_circle(vec2 uv, vec2 c, float r) {
					return smoothstep(r + 0.005, r, length(uv - c));
				}

				void main(){
					vec2 uv = f_tex_coord * 2. - 1.;
					uv = vec2(
						uv.x * cos(theta) - uv.y * sin(theta),
						uv.x * sin(theta) + uv.y * cos(theta)
					);
					float d = length(uv);
					if (d > 1.)
							discard;
					vec4 color = texture2D( texture, uv * 0.5 + 0.5);
					color = mix(vec4(0.3, 1., 0., 1.), color, smoothstep(0., 0.1, d));
					for (int i = 0; i < 100; i++) {
						color += vec4(1.) * draw_circle(uv.yx, targets[i], 0.01);
					}
					color = mix(color, vec4(173. / 255., 116. / 255., 54. / 255., 1.), smoothstep(0.95, 1., d));
					gl_FragColor = color;
				}
      `
		)
	}
}
