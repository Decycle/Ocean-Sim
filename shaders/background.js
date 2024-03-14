import {tiny} from '../tiny-graphics.js'

const {Shader, Matrix, Mat4} = tiny
class BackgroundShader extends Shader {
	update_GPU(
		context,
		gpu_addresses,
		graphics_state,
		model_transform,
		material,
	) {
		const P = Mat4.inverse(graphics_state.projection_transform)
		const C = graphics_state.camera_transform
		context.uniformMatrix4fv(
			gpu_addresses.projection_inverse,
			false,
			Matrix.flatten_2D_to_1D(P.transposed()),
		)
		context.uniformMatrix4fv(
			gpu_addresses.camera_transform,
			false,
			Matrix.flatten_2D_to_1D(C.transposed()),
		)
		// color
		context.uniform4fv(gpu_addresses.color, material.color)
	}

	shared_glsl_code() {
		// ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
		return `precision mediump float;
				varying vec2 f_tex_coord;
				varying vec3 world_pos;
    `
	}

	vertex_glsl_code() {
		// ********* VERTEX SHADER *********
		return (
			this.shared_glsl_code() +
			`
        attribute vec3 position;
        attribute vec2 texture_coord;

		uniform mat4 camera_transform;
		uniform mat4 projection_inverse;

        void main(){
            f_tex_coord = texture_coord;
            gl_Position = vec4((texture_coord - 0.5) * 2., 0., 1);
			world_pos = position;
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
        // gl_FragColor = color;
		float y = world_pos.y * 2. - 1.3;
		vec3 col = vec3(0.3,0.5,0.85) - y * y * 0.5;
        col = mix( col, 0.85*vec3(0.7,0.75,0.85), pow( 1.0-max(y,0.0), 4.0 ) );

        // horizon
        col = mix( col, 0.68*vec3(0.4,0.65,1.0), pow( 1.0-max(y,0.0), 16.0 ) );
        gl_FragColor = vec4(col, 1.);
      }
      `
		)
	}
}

export default BackgroundShader
