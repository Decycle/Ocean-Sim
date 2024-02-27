import { defs, tiny } from './examples/common.js'
import Ocean_Shader from './shaders/ocean.js'
import PostProcessingShader from './shaders/post_processing.js'
import BackgroundShader from './shaders/background.js'
import Quaternion from './util/quaternion.js'
import { Boat } from './boat.js'
import BoatShader from './shaders/boat.js'

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
    this.scratchpad.width = 512
    this.scratchpad.height = 512 // Initial image source: Blank gif file:
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
      boat: new Cube(),
    }

    this.amplitude = 0.13
    this.waveMut = 0.22
    this.seed = 4551.671312417933

    this.amplitudeMultiplier = 0.94
    this.waveMultiplier = 1.1
    this.seedOffset = 8780.3143875966

    this.materials = {
      ocean: new Material(new Ocean_Shader(), {
        amplitude: this.amplitude,
        waveMut: this.waveMut,
        seed: this.seed,
        amplitudeMultiplier: this.amplitudeMultiplier,
        waveMultiplier: this.waveMultiplier,
        seedOffset: this.seedOffset,
        sea_color: hex_color('#3b59CC'),
      }),
      boat: new Material(new BoatShader(), {}),
      postprocess: new Material(
        new PostProcessingShader(),
        {
          texture: this.texture,
        }
      ),
      background: new Material(new BackgroundShader(), {
        color: hex_color('#3b59CC'),
      }),
    }
    this.skipped_first_frame = false

    this.boat_position = vec3(0, 0, 0)
    this.boat_velocity = vec3(0, 0, 0)

    this.show_advanced_controls = true

    this.quaternion = Quaternion.identity()
    this.last_quaternion = this.quaternion
  }

  make_control_panel() {
    this.control_panel.innerHTML += 'Controls:'

    const force = 0.5
    const max_speed = 3
    this.key_triggered_button('Left', ['a'], () => {
      this.boat_velocity[0] -= force
      this.boat_velocity[0] = Math.max(
        this.boat_velocity[0],
        -max_speed
      )
    })

    this.key_triggered_button('Right', ['d'], () => {
      this.boat_velocity[0] += force
      this.boat_velocity[0] = Math.min(
        this.boat_velocity[0],
        max_speed
      )
    })

    this.key_triggered_button('Forward', ['w'], () => {
      this.boat_velocity[1] += force
      this.boat_velocity[1] = Math.min(
        this.boat_velocity[1],
        max_speed
      )
    })

    this.key_triggered_button('Backward', ['s'], () => {
      this.boat_velocity[1] -= force
      this.boat_velocity[1] = Math.max(
        this.boat_velocity[1],
        -max_speed
      )
    })

    this.new_line()

    if (this.show_advanced_controls) {
      this.control_panel.innerHTML += 'Wave Configuration:'
      this.new_line()

      this.key_triggered_button('+', ['q'], () => {
        this.amplitude += 0.01
      })

      this.key_triggered_button(
        '+',
        ['Control', 'q'],
        () => {
          this.amplitude += 0.1
        }
      )

      this.live_string((box) => {
        box.textContent = `Amplitude: ${this.amplitude.toFixed(
          2
        )}`
      })

      this.key_triggered_button('-', ['e'], () => {
        this.amplitude = Math.max(0, this.amplitude - 0.01)
      })

      this.key_triggered_button(
        '-',
        ['Control', 'e'],
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

      this.key_triggered_button('+', ['t'], () => {
        this.waveMut += 0.01
      })

      this.key_triggered_button(
        '+',
        ['Control', 't'],
        () => {
          this.waveMut += 0.1
        }
      )

      this.live_string((box) => {
        box.textContent = `Starting Wave Multiplier: ${this.waveMut.toFixed(
          2
        )}`
      })

      this.key_triggered_button('-', ['y'], () => {
        this.waveMut = Math.max(0, this.waveMut - 0.01)
      })

      this.key_triggered_button(
        '-',
        ['Control', 'y'],
        () => {
          this.waveMut = Math.max(0, this.waveMut - 0.1)
        }
      )

      this.new_line()

      this.key_triggered_button('+', ['f'], () => {
        this.waveMultiplier += 0.01
      })

      this.key_triggered_button(
        '+',
        ['Control', 'f'],
        () => {
          this.waveMultiplier += 0.1
        }
      )

      this.live_string((box) => {
        box.textContent = `Progressive Wave Multiplier: ${this.waveMultiplier.toFixed(
          2
        )}`
      })

      this.key_triggered_button('-', ['g'], () => {
        this.waveMultiplier = Math.max(
          0,
          this.waveMultiplier - 0.01
        )
      })

      this.key_triggered_button(
        '-',
        ['Control', 'g'],
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

  // same calculation as in the shader to get the relative movement of the boat
  get_gerstner_wave(x, y, t) {
    let amplitude = this.amplitude
    let waveMut = this.waveMut
    let seed = this.seed

    let nx = x
    let ny = y
    let nz = 0

    let vx = vec3(1, 0, 0)
    let vy = vec3(0, 1, 0)

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

      const dv = vec3(
        kx * Math.cos(theta),
        ky * Math.cos(theta),
        Math.sin(theta)
      ).times(amplitude)

      vx = vx.minus(dv.times(kx))
      vy = vy.minus(dv.times(ky))

      amplitude *= this.amplitudeMultiplier
      waveMut *= this.waveMultiplier
      seed += this.seedOffset
    }

    return [vec3(nx, ny, nz), vx.cross(vy).normalized()]
  }

  display(context, program_state) {
    super.display(context, program_state)
    const t = program_state.animation_time / 1000
    const dt = program_state.animation_delta_time / 1000

    const boatWidth = 0.3
    const boatLength = 0.3
    const boatHeight = 0.1
    const heightLerpFactor = 0.05
    const quaternionInterpolation = 0.05
    const boatFallingAcceleration = 1

    this.boat_position = this.boat_position.plus(
      this.boat_velocity.times(dt)
    )

    const x = this.boat_position[0]
    const y = this.boat_position[1]
    // const z = this.boat_position[2]

    const wave_pos = this.get_gerstner_wave(x, y, t)[0]

    const nz = wave_pos[2]

    if (this.boat_position[2] < nz) {
      this.boat_position[2] =
        (nz + boatHeight / 2) * heightLerpFactor +
        this.boat_position[2] * (1 - heightLerpFactor)
      this.boat_velocity[2] = 0
    } else {
      this.boat_velocity[2] -= boatFallingAcceleration * dt
    }

    this.boat_velocity[0] *= 0.95
    this.boat_velocity[1] *= 0.95

    program_state.set_camera(
      Mat4.inverse(
        Mat4.translation(
          this.boat_position[0],
          this.boat_position[1],
          this.boat_position[2]
        )
          .times(Mat4.rotation(1.1, 1, 0, 0))
          .times(Mat4.translation(0, 0.5, 2))
      )
    )

    program_state.projection_transform = Mat4.perspective(
      Math.PI / 3,
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
        time: t,
      })
    )

    let new_quaternion = this.quaternion
    if (this.boat_position[2] < nz + boatHeight / 2) {
      const x1 = x + boatWidth / 2
      const x2 = x - boatWidth / 2
      const y1 = y + boatLength / 2
      const y2 = y - boatLength / 2

      const wave_normal1 = this.get_gerstner_wave(
        x1,
        y1,
        t
      )[1]
      const wave_normal2 = this.get_gerstner_wave(
        x1,
        y2,
        t
      )[1]
      const wave_normal3 = this.get_gerstner_wave(
        x2,
        y1,
        t
      )[1]
      const wave_normal4 = this.get_gerstner_wave(
        x2,
        y2,
        t
      )[1]

      const wave_normal = wave_normal1
        .plus(wave_normal2)
        .plus(wave_normal3)
        .plus(wave_normal4)
        .times(0.25)

      const up = vec3(0, 1, 0)
      const right = wave_normal.cross(up).normalized()
      if (isNaN(wave_normal[0])) {
        console.error('normal is NaN')
      }
      const theta = Math.acos(up.dot(wave_normal))

      let q0 = Math.cos(theta / 2)
      let q1 = right[0] * Math.sin(theta / 2)
      let q2 = right[1] * Math.sin(theta / 2)
      let q3 = right[2] * Math.sin(theta / 2)

      new_quaternion = new Quaternion(q0, q1, q2, q3)
      if (new_quaternion.isNan()) {
        console.error('new_quaternion is NaN')
      }
      this.last_quaternion = this.quaternion
      this.quaternion = this.quaternion.slerp(
        new_quaternion,
        quaternionInterpolation
      )
      if (
        !this.last_quaternion.isNan() &&
        this.quaternion.isNan()
      ) {
        console.error('slerp caused NaN')
      }
    } else {
      new_quaternion = this.quaternion.predictNext(
        this.last_quaternion
      )
      if (
        !this.last_quaternion.isNan() &&
        !this.quaternion.isNan() &&
        new_quaternion.isNan()
      ) {
        console.error('predictNext caused NaN')
      }
      this.last_quaternion = this.quaternion
      this.quaternion = new_quaternion
    }

    const rotation = this.quaternion.toMatrix()

    program_state.lights = [
      new Light(vec3(1, 1, 1), hex_color('#ffffff'), 1000),
    ]
    this.shapes.boat.draw(
      context,
      program_state,
      Mat4.translation(
        this.boat_position[0],
        this.boat_position[1],
        this.boat_position[2]
      )
        .times(Mat4.rotation(Math.PI / 2, 0, 0, 1))
        .times(rotation)
        .times(
          Mat4.scale(boatWidth, boatHeight, boatLength)
        ),
      this.materials.boat.override({
        ambient: 1.0,
        diffusivity: 0.8,
        specularity: 0.5,
        color: hex_color('#3b59CC'),
      })
    )

    // second pass
    // this.scratchpad_context.drawImage(
    //   context.canvas,
    //   0,
    //   0,
    //   512,
    //   512
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
