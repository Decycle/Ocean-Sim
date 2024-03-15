import {tiny} from '../tiny-graphics.js'

const {Shader, Matrix} = tiny
export class OceanMapShader extends Shader {
	update_GPU(
		context,
		gpu_addresses,
		graphics_state,
		model_transform,
		material
	) {
		context.uniform4fv(gpu_addresses.seaColor, material.seaColor)
		context.uniform4fv(gpu_addresses.badSeaColor, material.badSeaColor)

		context.uniform1f(gpu_addresses.x, material.x)
		context.uniform1f(gpu_addresses.z, material.z)
		context.uniform1f(gpu_addresses.scale, material.scale)
		context.uniform1f(gpu_addresses.seed, material.seed)
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
            gl_Position = vec4((texture_coord - 0.5) * 2., 0., 1);
        }
        `
		)
	}

	fragment_glsl_code() {
		// ********* FRAGMENT SHADER *********
		return (
			this.shared_glsl_code() +
			`

      			uniform vec4 seaColor;
    			uniform vec4 badSeaColor;

				uniform float x;
				uniform float z;
				uniform float scale;
				uniform float seed;

				#define PI 3.14159265359

				// source: https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
				float rand(vec2 c){
					return fract(sin(dot(c.xy + seed * 100. ,vec2(12.9898,78.233))) * 43758.5453);
				}

				float noise(vec2 p, float freq ){
					float unit = 256./freq;
					vec2 ij = floor(p/unit);
					vec2 xy = mod(p,unit)/unit;
					xy = .5*(1.-cos(PI*xy));
					float a = rand((ij+vec2(0.,0.)));
					float b = rand((ij+vec2(1.,0.)));
					float c = rand((ij+vec2(0.,1.)));
					float d = rand((ij+vec2(1.,1.)));
					float x1 = mix(a, b, xy.x);
					float x2 = mix(c, d, xy.x);
					return mix(x1, x2, xy.y);
				}

				float pNoise(vec2 p, int res){
					float persistance = .5;
					float n = 0.;
					float normK = 0.;
					float f = 4.;
					float amp = 1.;
					int iCount = 0;
					for (int i = 0; i<50; i++){
						n+=amp*noise(p, f);
						f*=2.;
						normK+=amp;
						amp*=persistance;
						if (iCount == res) break;
						iCount++;
					}
					float nf = n/normK;
					return nf*nf*nf*nf;
				}

				void main(){
					vec2 uv = f_tex_coord * 2. - 1.;
					vec2 pos = uv * scale;
					pos += vec2(z, x);
					vec4 color = mix(seaColor, badSeaColor, pNoise(pos, 5) * 4.);

					// black circle around each target
					// float dist = length(uv);
					// color = mix(color, vec4(0.), smoothstep(0.05, 0.0, dist));
					gl_FragColor = color;
      	}
      `
		)
	}
}
