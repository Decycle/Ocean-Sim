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

		context.uniform1f(gpu_addresses.health, material.health)

		//texture
		if (material.texture && material.texture.ready) {
			context.uniform1i(gpu_addresses.texture, 0)
			material.texture.activate(context)
		}
	}
	shared_glsl_code() {
		// ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
		return `precision mediump float;
            varying vec2 uv;
            varying vec3 VERTEX_NORMAL;
            varying vec3 VERTEX_POS;
      `
	}

	vertex_glsl_code() {
		// ********* VERTEX SHADER *********
		return (
			this.shared_glsl_code() +
			`
        uniform float animation_time;
        attribute vec3 position;
        attribute vec3 normal;
        attribute vec2 texture_coord;
        // Position is expressed in object coordinates.

        uniform mat4 projection_transform;
        uniform mat4 camera_inverse;
        uniform mat4 model_transform;

        void main(){

          mat4 projection_camera_model_transform = projection_transform * camera_inverse * model_transform;
          gl_Position = projection_camera_model_transform * vec4( position, 1.0 );

          uv = texture_coord;
          VERTEX_NORMAL = normal;
          VERTEX_POS = position;
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
      uniform float health;

      float rand(vec2 n) {
        return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
      }

      float noise(vec2 p){
        vec2 ip = floor(p);
        vec2 u = fract(p);
        u = u*u*(3.0-2.0*u);

        float res = mix(
          mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
          mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
        return res*res;
      }

      void main(){

        vec3 normal = VERTEX_NORMAL;
        vec3 boat_color = texture2D(texture, vec2(uv.x, uv.y)).xyz;
        float is_black = step(health, noise(VERTEX_POS.xy * 30.0));
        boat_color = mix(boat_color, vec3(0.0, 0.0, 0.0), is_black);
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
