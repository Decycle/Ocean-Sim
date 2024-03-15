import {tiny} from '../tiny-graphics.js'

const {Shader, Matrix} = tiny
export class ShopMenuShader extends Shader {
	update_GPU(
		context,
		gpu_addresses,
		graphics_state,
		model_transform,
		material
	) {
		context.uniform1f(gpu_addresses.money, material.money)
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

		uniform float money;
		uniform sampler2D texture;

      	void main(){
			gl_FragColor = texture2D(texture, f_tex_coord);
      	}
      `
		)
	}
}
