import {tiny} from '../tiny-graphics.js'

const {Shader, Matrix} = tiny
export class OceanMapDisplay extends Shader {
	update_GPU(
		context,
		gpu_addresses,
		graphics_state,
		model_transform,
		material,
	) {
		context.uniform1f(gpu_addresses.theta, material.theta)
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
                if (d > 0.95)
                {
                    //173, 116, 54
                    color = vec4(173. / 255., 116. / 255., 54. / 255., 1.);
                }
				color = mix(vec4(1.), color, smoothstep(0., 0.1, d));
                gl_FragColor = color;
            }
      `
		)
	}
}
