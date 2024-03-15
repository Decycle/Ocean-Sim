import {tiny} from '../tiny-graphics.js'

const {Shader, Matrix} = tiny
class PostProcessingShader extends Shader {
	// **Basic_Shader** is nearly the simplest example of a subclass of Shader, which stores and
	// maanges a GPU program.  Basic_Shader is a trivial pass-through shader that applies a
	// shape's matrices and then simply samples literal colors stored at each vertex.
	update_GPU(
		context,
		gpu_addresses,
		graphics_state,
		model_transform,
		material
	) {
		if (material.texture && material.texture.ready) {
			context.uniform1i(gpu_addresses.texture, 0)
			material.texture.activate(context, 0)
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
            // f_tex_coord.y = f_tex_coord.y;
            gl_Position = vec4((texture_coord - 0.5) * 2., 0, 1);
        }
        `
		)
	}

	fragment_glsl_code() {
		// ********* FRAGMENT SHADER *********
		return (
			this.shared_glsl_code() +
			`
      uniform float animation_time;
      uniform sampler2D texture;

      // Lottes 2016, "Advanced Techniques and Optimization of HDR Color Pipelines"
      // https://github.com/dmnsgn/glsl-tone-map/blob/main/lottes.glsl
      vec3 aces(vec3 x) {
        const float a = 2.51;
        const float b = 0.03;
        const float c = 2.43;
        const float d = 0.59;
        const float e = 0.14;
        return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
      }

      void main(){
        vec2 uv = f_tex_coord;

        float d = length(uv - vec2(0.5));
        float vignette = 1.0 - smoothstep(0.1, 1.1, d);

        float redOffset = 0.0025;
        float greenOffset = 0.0015;
        float blueOffset = -0.0015;

        float r = texture2D(texture, uv + vec2(redOffset)).r;
        float g = texture2D(texture, uv + vec2(greenOffset)).g;
        float b = texture2D(texture, uv + vec2(blueOffset)).b;

        vec3 color = vec3(r, g, b);
        color = aces(color);
        color *= vignette;

        gl_FragColor = vec4( color, 1.0 );
      }
      `
		)
	}
}

export default PostProcessingShader
