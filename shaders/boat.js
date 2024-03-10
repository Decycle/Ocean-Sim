import {tiny} from '../tiny-graphics.js'

const {Shader, Matrix} = tiny
class BoatShader extends Shader {
	// **Basic_Shader** is nearly the simplest example of a subclass of Shader, which stores and
	// maanges a GPU program.  Basic_Shader is a trivial pass-through shader that applies a
	// shape's matrices and then simply samples literal colors stored at each vertex.
	update_GPU(
		context,
		gpu_addresses,
		graphics_state,
		model_transform,
		material,
	) {
		// update_GPU():  Defining how to synchronize our JavaScript's variables to the GPU's:
		const [P, C, M] = [
			graphics_state.projection_transform,
			graphics_state.camera_inverse,
			model_transform,
		]

		context.uniformMatrix4fv(
			gpu_addresses.projection_transform,
			false,
			Matrix.flatten_2D_to_1D(P.transposed()),
		)

		context.uniformMatrix4fv(
			gpu_addresses.camera_inverse,
			false,
			Matrix.flatten_2D_to_1D(C.transposed()),
		)

		context.uniformMatrix4fv(
			gpu_addresses.model_transform,
			false,
			Matrix.flatten_2D_to_1D(M.transposed()),
		)

		context.uniform1f(gpu_addresses.animation_time, material.time)
	}
	shared_glsl_code() {
		// ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
		return `precision mediump float;
            varying vec3 VERTEX_POS;
            varying vec3 VERTEX_NORMAL;
      `
	}

	vertex_glsl_code() {
		// ********* VERTEX SHADER *********
		return (
			this.shared_glsl_code() +
			`
        uniform float animation_time;
        attribute vec4 color;
        attribute vec3 position;
        attribute vec3 normal;
        // Position is expressed in object coordinates.

        uniform mat4 projection_transform;
        uniform mat4 camera_inverse;
        uniform mat4 model_transform;

        void main(){

          mat4 projection_camera_model_transform = projection_transform * camera_inverse * model_transform;
          gl_Position = projection_camera_model_transform * vec4( position, 1.0 );

          VERTEX_POS = position;
          VERTEX_NORMAL = (model_transform * vec4(normal, 0.0)).xyz;
        }
        `
		)
	}

	fragment_glsl_code() {
		// ********* FRAGMENT SHADER *********
		return (
			this.shared_glsl_code() +
			`
      void main(){

        vec3 normal = VERTEX_NORMAL;
        vec3 boat_color = vec3(1.);
        vec3 ambient = vec3(0.2, 0.2, 0.2);
        vec3 light = normalize(vec3(1, 1, 1));

        float diffuse = max( 0.0, dot( normalize( normal ), light));

        gl_FragColor = vec4( boat_color * (ambient + diffuse), 1.0 );
      }
      `
		)
	}
}

export default BoatShader
