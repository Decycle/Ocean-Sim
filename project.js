import { defs, tiny } from './examples/common.js'
import Ocean_Shader from './shaders/ocean.js'
import PostProcessingShader from './shaders/post_processing.js'
import BackgroundShader from './shaders/background.js'

// Pull these names into this module's scope for convenience:
const {
  vec3,
  vec4,
  Mat4,
  color,
  hex_color,
  Material,
  Scene,
  Light,
  Texture,
} = tiny

const { Phong_Shader, Basic_Shader, Cube } = defs

const Ocean = class Ocean extends tiny.Vertex_Buffer {
  // **Minimal_Shape** an even more minimal triangle, with three
  // vertices each holding a 3D position and a color.
  constructor() {
    super('position')

    const boundary = 20
    const subdivision = 100
    const step = (2 * boundary) / subdivision
    const position = []

    for (let i = 0; i < subdivision; i++) {
      for (let j = 0; j < subdivision; j++) {
        const x = -boundary + step * i
        const y = -boundary + step * j

        const x2 = x + step
        const y2 = y + step

        const new_position = [
          vec3(x, y, 0),
          vec3(x, y2, 0),
          vec3(x2, y, 0),
          vec3(x2, y, 0),
          vec3(x, y2, 0),
          vec3(x2, y2, 0),
        ]
        position.push(...new_position)
      }
    }

    this.arrays.position = position
  }
}

export class Project_Scene extends Scene {
  // **Minimal_Webgl_Demo** is an extremely simple example of a Scene class.
  constructor(webgl_manager, control_panel) {
    super(webgl_manager, control_panel)

    this.scratchpad = document.createElement('canvas')
    // A hidden canvas for re-sizing the real canvas to be square:
    this.scratchpad_context =
      this.scratchpad.getContext('2d')
    this.scratchpad.width = 1024
    this.scratchpad.height = 1024 // Initial image source: Blank gif file:
    this.texture = new Texture(
      'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    )

    this.widget_options = {
      make_controls: true,
      show_explanation: false,
    }
    // Send a Triangle's vertices to the GPU buffers:
    this.shapes = {
      ocean: new Ocean(),
      screen_quad: new defs.Square(),
      box: new Cube(),
    }

    this.amplitude = 0.06
    this.waveMut = 0.26
    this.seed = 2887.776396078172

    this.amplitudeMultiplier = 0.95
    this.waveMultiplier = 1.1
    this.seedOffset = 7250.531321143898

    this.materials = {
      ocean: new Material(new Ocean_Shader(), {
        amplitude: this.amplitude,
        waveMut: this.waveMut,
        seed: this.seed,
        amplitudeMultiplier: this.amplitudeMultiplier,
        waveMultiplier: this.waveMultiplier,
        seedOffset: this.seedOffset,
        sea_color: hex_color('#3b5998'),
      }),
      box: new Material(new Basic_Shader()),
      postprocess: new Material(
        new PostProcessingShader(),
        {
          texture: this.texture,
        }
      ),
      background: new Material(new BackgroundShader(), {
        color: hex_color('#3b5998'),
      }),
    }
    this.skipped_first_frame = false

    this.boat_position = vec3(0, 0, 0)
    this.boat_velocity = vec3(0, 0, 0)

    this.show_advanced_controls = false
  }

  make_control_panel() {
    this.control_panel.innerHTML += 'blah blah blah'

    const speed = 10

    this.key_triggered_button('Left', ['a'], () => {
      this.boat_velocity[0] -= (1 / 60) * speed
    })

    this.key_triggered_button('Right', ['d'], () => {
      this.boat_velocity[0] += (1 / 60) * speed
    })

    this.key_triggered_button('Forward', ['w'], () => {
      this.boat_velocity[1] += (1 / 60) * speed
    })

    this.key_triggered_button('Backward', ['s'], () => {
      this.boat_velocity[1] -= (1 / 60) * speed
    })

    this.new_line()

    if (this.show_advanced_controls) {
      this.key_triggered_button('+', ['a'], () => {
        this.amplitude += 0.01
      })

      this.key_triggered_button(
        '+',
        ['Control', 'a'],
        () => {
          this.amplitude += 0.1
        }
      )

      this.live_string((box) => {
        box.textContent = `Amplitude: ${this.amplitude.toFixed(
          2
        )}`
      })

      this.key_triggered_button('-', ['s'], () => {
        this.amplitude = Math.max(0, this.amplitude - 0.01)
      })

      this.key_triggered_button(
        '-',
        ['Control', 's'],
        () => {
          this.amplitude = Math.max(0, this.amplitude - 0.1)
        }
      )

      this.new_line()

      this.key_triggered_button('+', ['z'], () => {
        this.amplitudeMultiplier += 0.01
      })

      this.key_triggered_button(
        '+',
        ['Control', 'z'],
        () => {
          this.amplitudeMultiplier += 0.1
        }
      )

      this.live_string((box) => {
        box.textContent = `Amplitude Multiplier: ${this.amplitudeMultiplier.toFixed(
          2
        )}`
      })

      this.key_triggered_button('-', ['x'], () => {
        this.amplitudeMultiplier = Math.max(
          0,
          this.amplitudeMultiplier - 0.01
        )
      })

      this.key_triggered_button(
        '-',
        ['Control', 'x'],
        () => {
          this.amplitudeMultiplier = Math.max(
            0,
            this.amplitudeMultiplier - 0.1
          )
        }
      )

      this.new_line()

      this.key_triggered_button('+', ['d'], () => {
        this.waveMut += 0.01
      })

      this.key_triggered_button(
        '+',
        ['Control', 'd'],
        () => {
          this.waveMut += 0.1
        }
      )

      this.live_string((box) => {
        box.textContent = `Starting Wave Multiplier: ${this.waveMut.toFixed(
          2
        )}`
      })

      this.key_triggered_button('-', ['f'], () => {
        this.waveMut = Math.max(0, this.waveMut - 0.01)
      })

      this.key_triggered_button(
        '-',
        ['Control', 'f'],
        () => {
          this.waveMut = Math.max(0, this.waveMut - 0.1)
        }
      )

      this.new_line()

      this.key_triggered_button('+', ['q'], () => {
        this.waveMultiplier += 0.01
      })

      this.key_triggered_button(
        '+',
        ['Control', 'q'],
        () => {
          this.waveMultiplier += 0.1
        }
      )

      this.live_string((box) => {
        box.textContent = `Progressive Wave Multiplier: ${this.waveMultiplier.toFixed(
          2
        )}`
      })

      this.key_triggered_button('-', ['w'], () => {
        this.waveMultiplier = Math.max(
          0,
          this.waveMultiplier - 0.01
        )
      })

      this.key_triggered_button(
        '-',
        ['Control', 'w'],
        () => {
          this.waveMultiplier = Math.max(
            0,
            this.waveMultiplier - 0.1
          )
        }
      )

      this.new_line()

      this.key_triggered_button('randomize', ['r'], () => {
        this.seed = Math.random() * 10000
        this.seedOffset = Math.random() * 10000
      })

      this.live_string((box) => {
        box.textContent = `Seed: ${this.seed} | Seed Offset: ${this.seedOffset}`
      })
    }
  }

  get_gerstner_wave(x, y, t) {
    let amplitude = this.amplitude
    let waveMut = this.waveMut
    let seed = this.seed

    let nx = x
    let ny = y
    let nz = 0

    const g = 9.81
    const ITERATIONS = 40

    for (let i = 0; i < ITERATIONS; i++) {
      const kx = Math.sin(seed)
      const ky = Math.cos(seed)
      const omega = Math.sqrt(g * waveMut)
      const theta =
        kx * waveMut * nx +
        ky * waveMut * ny -
        omega * t -
        seed

      nx -= kx * amplitude * Math.sin(theta)
      ny -= ky * amplitude * Math.sin(theta)
      nz += amplitude * Math.cos(theta)

      amplitude *= this.amplitudeMultiplier
      waveMut *= this.waveMultiplier
      seed += this.seedOffset
    }

    return [nx, ny, nz]
  }

  display(context, program_state) {
    program_state.set_camera(
      // Mat4.translation(0, 0, -7).times(
      //   Mat4.rotation(-0.4, 1, 0, 0)
      // )
      Mat4.inverse(
        Mat4.translation(
          this.boat_position[0],
          this.boat_position[1],
          this.boat_position[2]
        )
          .times(Mat4.rotation(1.4, 1, 0, 0))
          .times(Mat4.translation(0, 0.4, 1))
      )
    )

    program_state.projection_transform = Mat4.perspective(
      Math.PI / 4,
      context.width / context.height,
      0.1,
      1000
    )
    this.shapes.screen_quad.draw(
      context,
      program_state,
      Mat4.identity(),
      this.materials.background
    )

    context.context.clear(context.context.DEPTH_BUFFER_BIT)

    // first pass
    const model_transform = Mat4.identity()

    this.shapes.ocean.draw(
      context,
      program_state,
      model_transform,
      this.materials.ocean.override({
        amplitude: this.amplitude,
        waveMut: this.waveMut,
        seed: this.seed,
        amplitudeMultiplier: this.amplitudeMultiplier,
        waveMultiplier: this.waveMultiplier,
        seedOffset: this.seedOffset,
      })
    )

    const x = this.boat_position[0]
    const y = this.boat_position[1]
    const z = this.boat_position[2]

    const [nx, ny, nz] = this.get_gerstner_wave(
      x,
      y,
      program_state.animation_time / 1000
    )

    let zForce = 0

    if (z > nz) {
      zForce = Math.min(0.5, z - nz) * -9.81 * 2
    } else {
      zForce = Math.min(0.5, nz - z) * 9.81 * 2
    }

    const dt = program_state.animation_delta_time / 1000
    const force = 5

    this.boat_velocity = this.boat_velocity
      .plus(vec3(nx - x, ny - y, 0).times(force * dt))
      .plus(vec3(0, 0, zForce).times(dt))

    this.boat_position = this.boat_position.plus(
      this.boat_velocity.minus(this.boat_position).times(dt)
    )

    this.shapes.box.draw(
      context,
      program_state,

      Mat4.translation(
        this.boat_position[0],
        this.boat_position[1],
        this.boat_position[2]
      ).times(Mat4.scale(0.3, 0.3, 0.3)),
      this.materials.box
    )

    // second pass
    // this.scratchpad_context.drawImage(
    //   context.canvas,
    //   0,
    //   0,
    //   1024,
    //   1024
    // )

    // this.texture.image.src =
    //   this.scratchpad.toDataURL('image/png')

    // if (this.skipped_first_frame)
    //   // Update the texture with the current scene:
    //   this.texture.copy_onto_graphics_card(
    //     context.context,
    //     false
    //   )
    // this.skipped_first_frame = true

    // context.context.clear(
    //   context.context.COLOR_BUFFER_BIT |
    //     context.context.DEPTH_BUFFER_BIT
    // )

    // this.shapes.screen_quad.draw(
    //   context,
    //   program_state,
    //   Mat4.identity(),
    //   this.materials.postprocess
    // )
  }
}
