import { tiny } from '../tiny-graphics.js'

const { Shader, Matrix } = tiny
class Ocean_Shader extends Shader {
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

    context.uniform1f(
      gpu_addresses.animation_time,
      material.time
    )
  }
  shared_glsl_code() {
    // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
    return `precision mediump float;
            varying vec3 VERTEX_POS;
            varying vec3 VERTEX_NORMAL;
            varying float Z;
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
        // Position is expressed in object coordinates.

        uniform mat4 projection_transform;
        uniform mat4 camera_inverse;
        uniform mat4 model_transform;

        void main(){

          mat4 projection_camera_model_transform = projection_transform * camera_inverse * model_transform;
          gl_Position = projection_camera_model_transform * vec4( position, 1.0 );

          VERTEX_POS = new_position;
          VERTEX_NORMAL = normal;
          OLD_VERTEX_POS = position;
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
      uniform vec4 sea_color;

      float random (vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }


      float smoothNoise(vec2 st)
      {
        vec2 i = floor(st);
        vec2 f = fract(st);

        // four corners
        float a = random(i);
        float b = random(i + vec2(1., 0.));
        float c = random(i + vec2(0., 1.));
        float d = random(i + vec2(1., 1.));

        // smooth interpolation of four corners
        vec2 u = f * f * (3. - 2. * f);

        return mix(a, b, u.x) + (c - a) * u.y * (1. - u.x) + (d - b) * u.x * u.y;
      }

      void main(){

        vec3 normal = VERTEX_NORMAL;

        float noiseFrequency = 20.;
        float noiseFactor = 0.05;

        float noise1 = (smoothNoise(OLD_VERTEX_POS.xy * noiseFrequency) - 0.5) * noiseFactor;
        float noise2 = (smoothNoise((OLD_VERTEX_POS.xy - 100000.) * noiseFrequency) - 0.5) * noiseFactor;
        float noise3 = (smoothNoise((OLD_VERTEX_POS.xy - 200000.) * noiseFrequency) - 0.5) * noiseFactor;

        normal = normalize(normal + vec3(noise1, noise2, noise3));

        // diffuse
        vec3 light_direction = normalize(vec3(1., 1., 1.));
        float diffuse = max(0.0, dot(normal, light_direction));

        vec3 color = sea_color.xyz * diffuse;

        // reflection
        vec3 eye = vec3(0., 0., 1.);
        vec3 reflected = reflect(-light_direction, normal);
        float spec = pow(max(dot(reflected, eye), 0.), 20.);

        color = color + vec3(1., 1., 1.) * spec;

        gl_FragColor = vec4( color, 1.0 );
      }
      `
    )
  }
}

export default Ocean_Shader
