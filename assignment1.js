import { defs, tiny } from './examples/common.js'
import Special_Shader from './special_shader.js'
import getExample from './marching_cubes/example.js'

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

const { Phong_Shader, Basic_Shader } = defs

const Minimal_Shape = class Minimal_Shape extends tiny.Vertex_Buffer {
  // **Minimal_Shape** an even more minimal triangle, with three
  // vertices each holding a 3D position and a color.
  constructor() {
    super('position', 'color')
    // Describe the where the points of a triangle are in space, and also describe their colors:
    // TODO: Edit the position and color here
    const { vertices, colors } = getExample()
    this.arrays.position = vertices
    this.arrays.color = colors
  }
}

export class Assignment1_Scene extends Scene {
  // **Minimal_Webgl_Demo** is an extremely simple example of a Scene class.
  constructor(webgl_manager, control_panel) {
    super(webgl_manager, control_panel)
    // Don't create any DOM elements to control this scene:
    this.widget_options = {
      make_controls: false,
      show_explanation: false,
    }
    // Send a Triangle's vertices to the GPU buffers:
    this.shapes = { triangle: new Minimal_Shape() }
    const phong = new Phong_Shader()
    this.material = new Material(phong, {
      ambient: 0.2,
      diffusivity: 0.8,
      specularity: 0.5,
      color: color(0.9, 0.5, 0.9, 1),
    })
  }

  display(context, graphics_state) {
    this.shapes.triangle.draw(
      context,
      graphics_state,
      Mat4.identity(),
      new Material(new Basic_Shader())
    )
  }
}
