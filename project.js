import {defs, tiny} from './examples/common.js'
import PostProcessingShader from './shaders/post_processing.js'
import Quaternion from './util/quaternion.js'
import {SplashEffect} from './models/splash_effect.js'
import {Ocean} from './models/ocean.js'
import {BackgroundRenderer} from './models/background.js'
import {UIHandler} from './ui.js'
import {Boat} from './models/boat.js'
import {BigBoat} from './models/big_boat.js'
import {lerp, smoothlerp, clamp, remap} from './util/common.js'
import {TestCube} from './models/test_cube.js'
import {PostProcessor} from './models/post_processor.js'
import {BoatPhysics} from './boat_physics.js'
import {OceanMap} from './models/ocean_map.js'
// Pull these names into this module's scope for convenience:
const {vec3, vec4, Mat4, color, hex_color, Material, Scene, Light, Texture} =
	tiny
export class Project_Scene extends Scene {
	// **Minimal_Webgl_Demo** is an extremely simple example of a Scene class.
	constructor(webgl_manager, control_panel) {
		super(webgl_manager, control_panel)

		this.post_processor = new PostProcessor()

		this.widget_options = {
			make_controls: true,
			show_explanation: false,
		}
		this.boat = new Boat()
		this.big_boat = new BigBoat()

		this.backgroundRenderer = new BackgroundRenderer()
		this.uiHandler = new UIHandler()

		this.oceanMap = new OceanMap(hex_color('#000055'), hex_color('#ff0000'))

		this.oceanConfig = {
			amplitude: 0.13,
			waveMut: 0.22,
			seed: 4551.671312417933,
			amplitudeMultiplier: 0.94,
			waveMultiplier: 1.1,
			seedOffset: 8780.3143875966,
		}

		this.oceanBoundary = 50
		this.oceanSubdivision = 500

		this.ocean = new Ocean(
			this.oceanBoundary,
			this.oceanSubdivision,
			this.oceanConfig,
		)

		this.boat_physics = new BoatPhysics(
			this.oceanConfig,
			(t, x, z, ny, strength) => {
				this.splash_effect.splash(t, x, z, ny, strength)
			},
			vec3(1, 1, 1),
		)

		//is the user rotating the camera
		this.camera_rotate_left = false
		this.camera_rotate_right = false
		// current angle of the camera
		this.camera_horizontal_angle = 0

		// whether or not to show advanced controls
		this.show_advanced_controls = true

		// enable post processing
		this.enable_post_processing = true

		// current camera z offset (zoom)
		this.camera_z_offset = 4.3
		this.camera_z_min_offset = 0
		this.camera_z_max_offset = 20

		// camera rotation with mouse
		this.mouse_camera_horizontal_angle = 0
		this.mouse_camera_vertical_angle = 0
		this.mouse_camera_horizontal_sensitivity = 0.005
		this.mouse_camera_vertical_sensitivity = 0.003

		// is the user zooming in or out
		this.is_zooming_in = false
		this.is_zooming_out = false

		// splash effect
		this.splash_effect = new SplashEffect()

		// is the boat big
		this.is_big_boat = false

		// fov
		this.fov = Math.PI / 3

		// test
		this.test_cube = new TestCube()

		this.small_boat_size = vec3(15.5, 6.5, 21.5)
		this.big_boat_size = vec3(2.68, 8.1, 7.4)

		this.small_boat_scale = 0.42
		this.big_boat_scale = 1.0

		this.camera_position = vec3(0, 0, 0)

		this.money = 0
		this.upgrades = []
	}

	clamp_ocean_config() {
		this.oceanConfig.amplitude = clamp(this.oceanConfig.amplitude, 0, 0.3)
		this.oceanConfig.amplitudeMultiplier = clamp(
			this.oceanConfig.amplitudeMultiplier,
			0,
			0.99,
		)
		this.oceanConfig.waveMut = clamp(this.oceanConfig.waveMut, 0, 2)
		this.oceanConfig.waveMultiplier = clamp(
			this.oceanConfig.waveMultiplier,
			1.01,
			2,
		)
	}

	display(context, program_state) {
		super.display(context, program_state)

		const t = program_state.animation_time / 1000
		const dt = program_state.animation_delta_time / 1000

		// development camera
		// if (!context.scratchpad.controls) {
		// 	this.children.push(
		// 		(context.scratchpad.controls = new defs.Movement_Controls()),
		// 	)

		// program_state.set_camera(Mat4.inverse(Mat4.translation(0, 0, 100)))
		// look at 0,0,0 from 0,10,30
		// program_state.set_camera(
		// 	Mat4.look_at(vec3(0, 1, 3), vec3(0, 0, 0), vec3(0, 1, 0)),
		// )
		// }
		const boatScale = this.is_big_boat
			? this.big_boat_scale
			: this.small_boat_scale

		const boatSize = this.is_big_boat
			? this.big_boat_size
			: this.small_boat_size

		const boat = this.is_big_boat ? this.big_boat : this.boat

		const scaledBoatSize = boatSize.times(boatScale)

		this.boat_physics.updateBoatSize(scaledBoatSize)
		this.boat_physics.updateOceanConfig(this.oceanConfig)

		const [x, y, z] = this.boat_physics.boat_position
		this.boat_physics.update(t, dt)

		this.oceanMap.init_map(context, program_state, x, z, 10)

		// camera rotation
		if (this.camera_rotate_left) {
			this.camera_horizontal_angle += 0.02
		} else if (this.camera_rotate_right) {
			this.camera_horizontal_angle -= 0.02
		}
		this.camera_horizontal_angle = clamp(
			this.camera_horizontal_angle,
			-Math.PI / 4,
			Math.PI / 4,
		)

		// zooming in and out
		if (this.is_zooming_in) {
			this.camera_z_offset *= 0.97
		} else if (this.is_zooming_out) {
			this.camera_z_offset *= 1.03
		}

		this.camera_z_offset = clamp(
			this.camera_z_offset,
			this.camera_z_min_offset,
			this.camera_z_max_offset,
		)
		// update the camera position
		this.camera_position[0] = smoothlerp(this.camera_position[0], x, 0.5)
		this.camera_position[1] = smoothlerp(this.camera_position[1], y, 0.5)
		this.camera_position[2] = smoothlerp(this.camera_position[2], z, 0.5)

		const small_boat_captain_position = vec3(0, 0.5, 0)
		const big_boat_captain_position = vec3(0.5, 0.5, 0)

		const captain_position = this.is_big_boat
			? big_boat_captain_position
			: small_boat_captain_position

		const camera_target = this.camera_position.plus(captain_position)

		program_state.set_camera(
			Mat4.inverse(
				Mat4.identity()
					//follow boat
					.times(
						Mat4.translation(
							camera_target[0],
							camera_target[1],
							camera_target[2],
						), //look at where a human would be
					)
					// .times(Mat4.rotation(-this.mouse_camera_vertical_angle, 0, 0, 1)) // mouse camera rotation
					.times(Mat4.rotation(-this.mouse_camera_horizontal_angle, 0, 1, 0)) // mouse camera rotation
					.times(
						Mat4.rotation(this.boat_physics.boat_horizontal_angle, 0, 1, 0),
					) // align with boat's rotation
					.times(Mat4.rotation(-0.5, 0, 0, 1)) //look down a bit
					.times(Mat4.rotation(-Math.PI / 2, 0, 1, 0)) // forward direction change to x from z
					.times(Mat4.translation(0, 0, this.camera_z_offset)), // zoom,
			),
		)

		const normal_fov = Math.PI * 0.33
		const fast_fov = Math.PI * 0.5

		const fov = remap(
			this.boat_physics.boat_velocity.norm(),
			0,
			this.boat_physics.boat_maximum_velocity * 1.141,
			normal_fov,
			fast_fov,
		)

		this.fov = smoothlerp(this.fov, fov, 0.07) // higher fov when moving faster

		program_state.projection_transform = Mat4.perspective(
			this.fov,
			context.width / context.height,
			0.1,
			1000,
		)

		// first pass
		this.backgroundRenderer.draw(context, program_state) // render the background
		this.splash_effect.draw(context, program_state) // render the splash effect (if any)

		const ocean_model_transform = Mat4.translation(x, 0, z).times(
			Mat4.translation(-this.oceanBoundary / 2, 0, -this.oceanBoundary / 2),
		)

		this.clamp_ocean_config()
		this.ocean.draw(
			context,
			program_state,
			ocean_model_transform,
			this.oceanConfig,
			t,
			this.oceanMap.get_map(),
		) // render the ocean

		// convert the quaternion to a rotation matrix1
		const rotation = this.boat_physics.quaternion.toMatrix()

		const bigFlip = this.is_big_boat ? -1 : 1 // flip the boat if it's big
		const bigRotate = this.is_big_boat ? -Math.PI / 2 : 0 // rotate the boat if it's big
		const bigRaise = this.is_big_boat ? 1 : 0 // raise the boat if it's big

		const boat_model_transform = Mat4.translation(
			x,
			y + bigRaise, // so that the bottom of the boat is at the water level
			z,
		) // boat position
			.times(Mat4.rotation(this.boat_physics.boat_horizontal_angle, 0, 1, 0)) // boat horizontal angle
			.times(rotation) // boat quaternion rotation
			.times(Mat4.rotation(bigRotate, 1, 0, 0)) // rotate the boat 90 degrees by y axis so it faces the right way
			.times(Mat4.rotation(-Math.PI / 2, 0, 0, 1)) // rotate the boat 180 degrees by z axis so it faces the right way
			.times(Mat4.scale(boatScale, boatScale * bigFlip, boatScale)) // boat scale

		boat.draw(context, program_state, boat_model_transform) // render the boat

		const targetX = 100
		const targetZ = 200

		console.log((targetX - x) / this.oceanBoundary)
		console.log((targetZ - z) / this.oceanBoundary)

		for (let i = -3; i <= 3; i++) {
			for (let j = -3; j <= 3; j++) {
				const nx = targetX + 2 * i
				const nz = targetZ + 2 * j
				// const output = this.get_gerstner_wave(nx, nz, t)
				const output = this.boat_physics.get_gerstner_wave(nx, nz, t)
				const pos = output[0]
				const normal = output[1]
				this.test_cube.draw_line(
					context,
					program_state,
					pos[0],
					pos[1],
					pos[2],
					normal[0],
					normal[1],
					normal[2],
					0.1,
				)
			}
		}
		this.oceanMap.draw_map(
			context,
			program_state,
			this.boat_physics.boat_horizontal_angle,
			(targetX - x) / this.oceanBoundary,
			(targetZ - z) / this.oceanBoundary,
		)
		// second pass
		if (this.enable_post_processing) {
			this.post_processor.draw(context, program_state)
		}

		// if the user is pressing the splash key, splash
		if (this.is_splashing) {
			this.splash_effect.splash(t, x, z, ny)
			this.is_splashing = false
		}

		// every 10 seconds, clean up unused splash effect
		if (t % 10 < 0.05) {
			this.splash_effect.cleanup(t)
		}

		const [r, g, b, a] = this.oceanMap.get_center_color()

		// console.log(r)
		if (r >= 64) {
			//take damage
			if (this.is_big_boat) {
				this.big_boat.take_damage(0.003)
				if (this.big_boat.health <= 0) {
					this.respawn()
				}
			} else {
				this.boat.take_damage(0.003)
				if (this.boat.health <= 0) {
					this.respawn()
				}
			}
		}
	}

	respawn() {
		this.boat_physics.boat_position = vec3(0, 0, 0)
		this.big_boat.health = 1
		this.boat.health = 1
		this.money = 0
		this.upgrades = []
	}

	add_camera_controls(canvas) {
		canvas.addEventListener('mousedown', (e) => {
			this.mouse_down = true
			this.last_mouse_x = e.clientX
			this.last_mouse_y = e.clientY
		})

		canvas.addEventListener('mouseup', (e) => {
			this.mouse_down = false
		})

		canvas.addEventListener('mousemove', (e) => {
			if (this.mouse_down) {
				const dx = e.clientX - this.last_mouse_x
				const dy = e.clientY - this.last_mouse_y
				this.mouse_camera_horizontal_angle +=
					dx * this.mouse_camera_horizontal_sensitivity
				this.mouse_camera_vertical_angle +=
					dy * this.mouse_camera_vertical_sensitivity

				// cap dy
				this.mouse_camera_vertical_angle = Math.min(
					Math.PI / 4,
					Math.max(0, this.mouse_camera_vertical_angle),
				)

				this.last_mouse_x = e.clientX
				this.last_mouse_y = e.clientY
			}
		})
	}

	make_control_panel() {
		this.uiHandler.setup_ui(this)
	}
}
