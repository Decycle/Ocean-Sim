import {tiny} from '../tiny-graphics.js'

const {Shader, Matrix} = tiny
class BackgroundShader extends Shader {
	update_GPU(
		context,
		gpu_addresses,
		graphics_state,
		model_transform,
		material,
	) {
		// color
		context.uniform4fv(gpu_addresses.color, material.color)
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
      uniform vec4 color;

      void main(){
        // vec2 uv = f_tex_coord;
        gl_FragColor = color;
      }
      `
		)
	}
}

export default BackgroundShader
