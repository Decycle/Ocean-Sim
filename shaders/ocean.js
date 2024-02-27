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
      graphics_state.animation_time / 1000
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

        #define PI 3.1415926535897932384626433832795

        // gerstner wave implementation
        // https://en.wikipedia.org/wiki/Trochoidal_wave

        vec3 gerstner_wave(vec2 p, float t, float dir, float wave_multiplier, float a, float phase, float g) {

          float kx = sin(dir);
          float ky = cos(dir);
          float omega = sqrt(g); // angular frequency

          float theta = kx * wave_multiplier * p.x + ky * wave_multiplier * p.y - omega * t - phase;

          float x = p.x - kx * a * sin(theta);
          float y = p.y - ky * a * sin(theta);
          float z = cos(theta) * a;

          return vec3(x, y, z);
        }

        vec3 gerstner_wave_normal(vec2 p, float t, float dir, float wave_multiplier, float a, float phase, float g) {

          float kx = sin(dir);
          float ky = cos(dir);

          float omega = sqrt(g); // angular frequency
          float theta = kx * wave_multiplier * p.x + ky * wave_multiplier * p.y - omega * t - phase;

          float vx = a * cos(theta) * kx;
          float vy = a * cos(theta) * ky;

          vec3 gradient_x = vec3(1. - kx * vx, - ky * vx, -a * sin(theta) * kx);
          vec3 gradient_y = vec3(-kx * vy, 1. - ky * vy, -a * sin(theta) * ky);

          return normalize(cross(gradient_x, gradient_y));
        }

        void main(){
          float g = 9.81;
          float alpha = 0.3;
          float phase = 0.;

          vec3 new_position = gerstner_wave(position.xy, animation_time, 1.0, 3.,  alpha, phase, g);
          vec3 normal = gerstner_wave_normal(position.xy, animation_time, 1.0, 3., alpha, phase, g);

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

      void main(){
        // gl_FragColor = vec4(VERTEX_NORMAL, 1.0);
        vec3 light_direction = normalize(vec3(1, 1, 1));
        vec3 normal = normalize(VERTEX_NORMAL);
        float diffuse = max(dot(normal, light_direction), 0.0);
        float specular = 0.0;
        vec3 view_direction = normalize(-VERTEX_POS);
        vec3 reflection = reflect(-light_direction, normal);
        specular = pow(max(dot(reflection, view_direction), 0.0), 16.0);
        vec3 color = vec3(0.7, 0.7, 1.0);
        gl_FragColor = vec4(0.5 * color * diffuse + 0.5 * specular, 1.0);
      }
      `
    )
  }
}

export default Ocean_Shader
