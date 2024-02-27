import { tiny } from '../tiny-graphics.js'

const { Shader, Matrix } = tiny
class BackgroundShader extends Shader {
  shared_glsl_code() {
    // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    return `precision mediump float;
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

      vec3 aces_tonemap(vec3 color) {
        mat3 m1 = mat3(
          0.59719, 0.07600, 0.02840,
          0.35458, 0.90834, 0.13383,
          0.04823, 0.01566, 0.83777
        );
        mat3 m2 = mat3(
          1.60475, -0.10208, -0.00327,
          -0.53108,  1.10813, -0.07276,
          -0.07367, -0.00605,  1.07602
        );
        vec3 v = m1 * color;
        vec3 a = v * (v + 0.0245786) - 0.000090537;
        vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
        return pow(clamp(m2 * (a / b), 0.0, 1.0), vec3(1.0 / 2.2));
      }

      void main(){
        vec2 uv = f_tex_coord;
        vec3 color = texture2D( texture, uv ).xyz;
        // color = aces_tonemap(color);
        gl_FragColor = vec4( color, 1.0 );
      }
      `
    )
  }
}

export default PostProcessingShader
