import { defs, tiny } from './examples/common.js'
import Ocean_Shader from './shaders/ocean.js'
import PostProcessingShader from './shaders/post_processing.js'

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
    // Describe the where the points of a triangle are in space, and also describe their colors:
    // TODO: Edit the position and color here
    const boundary = 5
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
      make_controls: false,
      show_explanation: false,
    }
    // Send a Triangle's vertices to the GPU buffers:
    this.shapes = {
      ocean: new Ocean(),
      screen_quad: new defs.Square(),
    }
    this.materials = {
      ocean: new Material(new Ocean_Shader()),
      cube: new Material(new Phong_Shader()),
      postprocess: new Material(
        new PostProcessingShader(),
        {
          texture: this.texture,
        }
      ),
    }
    this.skipped_first_frame = false
  }

  display(context, program_state) {
    program_state.set_camera(Mat4.translation(0, 0, -15))
    program_state.projection_transform = Mat4.perspective(
      Math.PI / 4,
      context.width / context.height,
      1,
      1000
    )

    // first pass
    const model_transform = Mat4.identity()
      .times(Mat4.rotation(-1, 1, 0, 0))
      .times(
        Mat4.rotation(
          program_state.animation_time / 20000,
          0,
          0,
          1
        )
      )

    this.shapes.ocean.draw(
      context,
      program_state,
      model_transform,
      this.materials.ocean
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
