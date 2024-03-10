import { tiny } from '../tiny-graphics.js'

const { Shader, Matrix } = tiny
export class SplashShader extends Shader {
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
    // update_GPU():  Defining how to synchronize our JavaScript's variables to the GPU's:
    const [P, C, M] = [
      graphics_state.projection_transform,
      graphics_state.camera_inverse,
      model_transform,
    ]

    context.uniformMatrix4fv(
      gpu_addresses.projection_transform,
      false,
      Matrix.flatten_2D_to_1D(P.transposed())
    )

    context.uniformMatrix4fv(
      gpu_addresses.camera_inverse,
      false,
      Matrix.flatten_2D_to_1D(C.transposed())
    )

    context.uniformMatrix4fv(
      gpu_addresses.model_transform,
      false,
      Matrix.flatten_2D_to_1D(M.transposed())
    )

    if (material.texture && material.texture.ready) {
      context.uniform1i(gpu_addresses.texture, 0)
      material.texture.activate(context)
    }
  }
  shared_glsl_code() {
    // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    return `precision mediump float;
            varying vec2 uv;
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
        attribute vec3 texture_coord;

        uniform mat4 projection_transform;
        uniform mat4 camera_inverse;
        uniform mat4 model_transform;

        void main(){
            gl_Position = projection_transform * camera_inverse * model_transform * vec4(position, 1.0);
            uv = texture_coord.xy;
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
      uniform float animation_time;

      void main(){
        vec2 new_texture_coord = vec2(
            uv.x,
            uv.y * 0.5 + 0.5
        );
        vec4 tex_color = texture2D( texture, new_texture_coord );
        // tex_color.a *= 0.5;
        if (tex_color.a < 0.01) discard;
        gl_FragColor = tex_color;
      }
      `
    )
  }
}
