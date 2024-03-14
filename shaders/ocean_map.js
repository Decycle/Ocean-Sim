import {tiny} from '../tiny-graphics.js'

const {Shader, Matrix} = tiny
export class OceanMapShader extends Shader {
	update_GPU(
		context,
		gpu_addresses,
		graphics_state,
		model_transform,
		material,
	) {
		context.uniform4fv(gpu_addresses.seaColor, material.seaColor)
		context.uniform4fv(gpu_addresses.badSeaColor, material.badSeaColor)

		context.uniform1f(gpu_addresses.x, material.x)
		context.uniform1f(gpu_addresses.z, material.z)
		context.uniform1f(gpu_addresses.scale, material.scale)
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
            gl_Position = vec4((texture_coord - 0.5) * 2., 0., 1);
        }
        `
		)
	}

	fragment_glsl_code() {
		// ********* FRAGMENT SHADER *********
		return (
			this.shared_glsl_code() +
			`
      	uniform vec4 seaColor;
    	uniform vec4 badSeaColor;

		uniform float x;
		uniform float z;
		uniform float scale;

      	void main(){
			vec2 uv = f_tex_coord * 2. - 1.;
			vec2 pos = uv * scale;
			pos += vec2(z, x);
			vec4 color = mix(seaColor, badSeaColor, sin(pos.x * 0.5) * sin(pos.y * 0.5));
			gl_FragColor = color;
      	}
      `
		)
	}
}
