import { tiny } from './tiny-graphics.js'

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
      ],
      PCM = P.times(C).times(M)
    context.uniformMatrix4fv(
      gpu_addresses.projection_camera_model_transform,
      false,
      Matrix.flatten_2D_to_1D(PCM.transposed())
    )

    context.uniform1f(
      gpu_addresses.animation_time,
      graphics_state.animation_time / 1000
    )
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
        // Position is expressed in object coordinates.
        uniform mat4 projection_camera_model_transform;

        #define PI 3.1415926535897932384626433832795
        #define DRAG_MULT 0.1

        vec2 wavedx(vec2 position, vec2 direction, float frequency, float timeShift) {
            float x = dot(position, direction) * frequency + timeShift;
            float wave = exp(sin(x) - 1.0);
            float dx = wave * cos(x);
            return vec2(wave, -dx);
        }

        float octaveWaves(vec2 position) {
          const int iterations = 10;
          float seed = 0.0;
          float frequency = 10.0;
          float timeMultiplier = 0.5;
          float weight = 1.0;
          float sumOfValues = 0.0;
          float sumOfWeights = 0.0;

          const float weightFactor = 0.82;
          const float frequencyFactor = 1.18;
          const float timeFactor = 1.07;
          const float seedNoise = 9134.12;

          for (int i = 0; i < iterations; i++) {
            vec2 direction = vec2(sin(seed), cos(seed));
            vec2 res = wavedx(position, direction, frequency, animation_time * timeMultiplier);

            position += direction * res.y * weight * DRAG_MULT;
            sumOfValues += res.x * weight;
            sumOfWeights += weight;

            weight *= weightFactor;
            frequency *= frequencyFactor;
            timeMultiplier *= timeFactor;

            seed += seedNoise;
          }

          return sumOfValues / sumOfWeights;
        }

        void main(){
            vec2 uv = position.xy;
            float wave = octaveWaves(uv);
            vec3 new_position = vec3(uv, wave * 0.2);

            gl_Position = projection_camera_model_transform * vec4( new_position, 1.0 );
            VERTEX_POS = new_position;

            float eps = 0.05;
            vec2 uv_dx = uv + vec2(eps, 0.0);
            vec2 uv_dy = uv + vec2(0.0, eps);

            float dx = octaveWaves(uv_dx) - wave;
            float dy = octaveWaves(uv_dy) - wave;
            vec3 normal = normalize(vec3(-dx, -dy, eps));

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
        vec3 seaColor = vec3(0.0, 0.5, 0.8);
        // if z > 0.09, change to white
        seaColor = mix(seaColor, vec3(1.0), smoothstep(0.09, 0.2, VERTEX_POS.z));
        // if z < 0.09, change to dark blue
        seaColor = mix(seaColor, vec3(0.0, 0.3, 0.6), smoothstep(0.07, 0., VERTEX_POS.z));
        // highlight
        // float diffuse = dot(VERTEX_NORMAL, normalize(vec3(1, 0, 1)));
        // float highlight = pow(diffuse, 3.0);
        // seaColor = mix(seaColor, vec3(1.0), highlight * 0.1);
        // diffuse
        // seaColor *= mix(0.9, 1.0, diffuse);

        gl_FragColor = vec4(aces_tonemap(seaColor), 0.7);
      }
      `
    )
  }
}

export default Ocean_Shader
