import { defs, tiny } from './examples/common.js'
import Ocean_Shader from './ocean_shader.js'

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
} = tiny

const { Phong_Shader, Basic_Shader, Cube } = defs

const Ocean = class Ocean extends tiny.Vertex_Buffer {
  // **Minimal_Shape** an even more minimal triangle, with three
  // vertices each holding a 3D position and a color.
  constructor() {
    super('position')
    // Describe the where the points of a triangle are in space, and also describe their colors:
    // TODO: Edit the position and color here
    const boundary = 0.7
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
    // Don't create any DOM elements to control this scene:
    this.widget_options = {
      make_controls: false,
      show_explanation: false,
    }
    // Send a Triangle's vertices to the GPU buffers:
    this.shapes = {
      ocean: new Ocean(),
      cube: new Cube(),
    }
    this.cube_material = new Material(new Basic_Shader())
    this.material = new Material(new Ocean_Shader())
  }

  display(context, program_state) {
    program_state.set_camera(Mat4.translation(0, 0, -2))
    program_state.projection_transform = Mat4.perspective(
      Math.PI / 4,
      context.width / context.height,
      1,
      100
    )

    // const cube_transform = Mat4.identity()
    //   .times(Mat4.translation(0, 0, -5))
    //   .times(Mat4.scale(0.3, 0.3, 0.3))

    // this.shapes.cube.draw(
    //   context,
    //   program_state,
    //   cube_transform,
    //   this.cube_material
    // )

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
      this.material
    )
  }
}
