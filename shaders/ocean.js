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
      Matrix.flatten_2D_to_1D(model_transform.transposed())
    )

    context.uniform1f(
      gpu_addresses.animation_time,
      material.time
    )

    context.uniform1f(
      gpu_addresses.amplitude,
      material.amplitude
    )
    context.uniform1f(
      gpu_addresses.wave_mut,
      material.waveMut
    )
    context.uniform1f(gpu_addresses.seed, material.seed)

    context.uniform1f(
      gpu_addresses.amplitude_multiplier,
      material.amplitudeMultiplier
    )
    context.uniform1f(
      gpu_addresses.wave_multiplier,
      material.waveMultiplier
    )
    context.uniform1f(
      gpu_addresses.seed_offset,
      material.seedOffset
    )

    context.uniform4fv(
      gpu_addresses.sea_color,
      material.sea_color
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

        uniform float amplitude;
        uniform float wave_mut;
        uniform float seed;
        uniform float amplitude_multiplier;
        uniform float wave_multiplier;
        uniform float seed_offset;

        #define PI 3.1415926535897932384626433832795

        // gerstner wave
        // math source: https://en.wikipedia.org/wiki/Trochoidal_wave
        vec3 gerstner_wave(vec2 p, float t, inout vec3 normal) {
          const float g = 9.81;
          const int ITERATIONS = 40;

          float x = p.x;
          float y = p.y;
          float z = 0.;

          vec3 vx = vec3(1., 0., 0.);
          vec3 vy = vec3(0., 1., 0.);

          float amplitude = amplitude;
          float wave_mut = wave_mut;
          float seed = seed;

          for (int i = 0; i < ITERATIONS; i++) {
            vec2 k = vec2(sin(seed), cos(seed));
            float omega = sqrt(g * wave_mut);
            float theta = k.x * wave_mut * p.x + k.y * wave_mut * p.y - omega * t - seed;

            x -= k.x * amplitude * sin(theta);
            y -= k.y * amplitude * sin(theta);
            z += amplitude * cos(theta);

            vec3 dv = amplitude * vec3(k.x * cos(theta), k.y * cos(theta), sin(theta));

            vx -= k.x * dv;
            vy -= k.y * dv;

            amplitude *= amplitude_multiplier;
            wave_mut *= wave_multiplier;
            seed += seed_offset;
          }

          normal = normalize(cross(vx, vy));
          return vec3(x, y, z);
        }

        void main(){

          vec3 normal;
          vec3 new_position = gerstner_wave(position.xy, animation_time, normal);

          mat4 projection_camera_model_transform = projection_transform * camera_inverse * model_transform;
          gl_Position = projection_camera_model_transform * vec4( new_position, 1.0 );

          VERTEX_POS = new_position;
          VERTEX_NORMAL = normal;
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

      void main(){
        // diffuse
        vec3 light_direction = normalize(vec3(1., 1., 1.));
        vec3 normal = normalize(VERTEX_NORMAL);
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
