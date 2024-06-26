import {tiny} from '../tiny-graphics.js'

const {Shader, Matrix} = tiny
class OceanShader extends Shader {
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
			model_transform
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
			gpu_addresses.camera_transform,
			false,
			Matrix.flatten_2D_to_1D(graphics_state.camera_transform.transposed())
		)

		context.uniformMatrix4fv(
			gpu_addresses.model_transform,
			false,
			Matrix.flatten_2D_to_1D(model_transform.transposed())
		)

		context.uniform1f(gpu_addresses.animation_time, material.time)

		context.uniform1f(gpu_addresses.amplitude, material.amplitude)
		context.uniform1f(gpu_addresses.wave_mut, material.waveMut)
		context.uniform1f(gpu_addresses.seed, material.seed)

		context.uniform1f(
			gpu_addresses.amplitude_multiplier,
			material.amplitudeMultiplier
		)
		context.uniform1f(gpu_addresses.wave_multiplier, material.waveMultiplier)
		context.uniform1f(gpu_addresses.seed_offset, material.seedOffset)

		context.uniform1f(gpu_addresses.size, material.boundary)
		context.uniform2fv(gpu_addresses.targets, material.targets)

		if (material.map && material.map.ready) {
			context.uniform1i(gpu_addresses.map, 0)
			material.map.activate(context, 0)
		}
	}
	shared_glsl_code() {
		// ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
		return `precision mediump float;
            varying vec3 OLD_VERTEX_POS;
            varying vec3 VERTEX_POS;
            varying vec3 VERTEX_NORMAL;
            varying vec3 VIEW_DIR;
            varying float Z;
            varying vec2 uv;
      `
	}

	vertex_glsl_code() {
		// ********* VERTEX SHADER *********
		return (
			this.shared_glsl_code() +
			`
        uniform float animation_time;
        attribute vec3 position;
        attribute vec3 texture_coord;
        // Position is expressed in object coordinates.

        uniform mat4 projection_transform;
        uniform mat4 camera_inverse;
        uniform mat4 model_transform;
        uniform mat4 camera_transform;

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
          float y = 0.;
          float z = p.y;

          vec3 vx = vec3(1., 0., 0.);
          vec3 vz = vec3(0., 0., 1.);

          float amplitude = amplitude;
          float wave_mut = wave_mut;
          float seed = seed;

          for (int i = 0; i < ITERATIONS; i++) {
            vec2 k = vec2(sin(seed), cos(seed));
            float omega = sqrt(g * wave_mut);
            float theta = k.x * wave_mut * p.x + k.y * wave_mut * p.y - omega * t - seed;

            x -= k.x * amplitude * sin(theta);
            z -= k.y * amplitude * sin(theta);
            y += amplitude * cos(theta);

            vec3 dv = amplitude * vec3(k.x * cos(theta), sin(theta), k.y * cos(theta));

            vx -= k.x * dv;
            vz -= k.y * dv;

            amplitude *= amplitude_multiplier;
            wave_mut *= wave_multiplier;
            seed += seed_offset;
          }

          normal = normalize(cross(vx, vz));
          return vec3(x, y, z);
        }

        void main(){

          vec3 normal;
          vec4 world_pos = model_transform * vec4(position, 1.0);
          vec3 new_position = gerstner_wave(world_pos.xz, animation_time, normal);

          mat4 projection_camera_model_transform = projection_transform * camera_inverse;
          gl_Position = projection_camera_model_transform * vec4( new_position, 1.0 );

          vec4 camera_pos = camera_transform * vec4(0., 0., 0., 1.);

          VIEW_DIR = normalize((world_pos - camera_pos).xyz);

          VERTEX_POS = world_pos.xyz;
          VERTEX_NORMAL = normal;
          OLD_VERTEX_POS = position;
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
      uniform float animation_time;
      uniform sampler2D map;
      uniform float size;

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


    vec3 sky(vec3 rd, vec3 lightDir)
    {
        vec3 col = vec3(82.,122.,212.) / 255. - rd.y * rd.y * 0.5;
        col = mix( col, 0.83*vec3(173., 189., 214.) / 255., pow( 1.0-max(rd.y,0.0), 4.0 ) );

        // horizon
        col = mix( col, 0.69*vec3(100., 166, 255.) / 255., pow( 1.0-max(rd.y,0.0), 16.0 ) );

        return col;
    }

    float fresnel(vec3 normal, vec3 viewDir)
    {
        float F0 = 0.04; // water
        return F0 + (1. - F0) * pow(1. - dot(viewDir, normal), 5.);
    }

    vec3 lighting(vec3 normal, vec3 lightDir, vec3 viewDir, vec3 oceanColor)
    {

        vec3 reflectDir = normalize(reflect(-lightDir, normal));

        float fresnel = fresnel(normal, viewDir);
        fresnel = clamp(fresnel, 0., 1.);

        vec3 reflected = sky(reflect(-viewDir, normal), lightDir);
        vec3 col = mix(oceanColor, reflected, fresnel);

        float spec = max(dot(reflectDir, viewDir), 0.);
        spec = pow(spec, 30.);
        spec = clamp(spec, 0., 1.);
        col += vec3(spec);

        return clamp(col, 0., 1.);
    }

				float draw_circle(vec2 uv, vec2 c, float r) {
					return smoothstep(r + 0.005, r, length(uv - c));
				}

      void main(){

        vec3 normal = VERTEX_NORMAL;

        float noiseFrequency = 20.;
        float noiseFactor = 0.03;

        float noise1 = (smoothNoise(OLD_VERTEX_POS.xz * noiseFrequency) - 0.5) * noiseFactor;
        float noise2 = (smoothNoise((OLD_VERTEX_POS.xz - 10000.637) * noiseFrequency) - 0.5) * noiseFactor;
        float noise3 = (smoothNoise((OLD_VERTEX_POS.xz - 20000.253) * noiseFrequency) - 0.5) * noiseFactor;

        normal = normalize(normal + vec3(noise1, noise2, noise3));

        vec3 lightDir = normalize(vec3(1., 1., 1.));
        vec3 blue = vec3(.109,.109, .435) * 0.3;
        vec3 red = vec3(1.0, 0.0, 0.0);
        vec3 oceanColor = texture2D(map, OLD_VERTEX_POS.zx / size).xyz;

        vec3 color = lighting(normal, lightDir, VIEW_DIR, oceanColor);

        gl_FragColor = vec4( color, 1.0 );
      }
      `
		)
	}
}

export default OceanShader
