import {tiny} from './examples/common.js'
import {SplashEffect} from './models/splash_effect.js'
import {Ocean} from './models/ocean.js'
import {BackgroundRenderer} from './models/background.js'
import {UIHandler} from './game/ui.js'
import {lerp, smoothlerp, clamp, remap} from './util/common.js'
import {TestCube} from './models/test_cube.js'
import {PostProcessor} from './models/post_processor.js'
import {BoatPhysics} from './game/boat_physics.js'
import {OceanMap} from './models/ocean_map.js'
import {TargetManager} from './game/target.js'
import {Config} from './game/config.js'
import {States} from './game/states.js'
import {BoatManager} from './game/boat_manager.js'
import {Shop} from './game/shop.js'
import {ShopPage} from './shop-page/ShopPage.js'
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
			show_explanation: false
		}

		this.config = new Config()
		this.states = new States()

		this.backgroundRenderer = new BackgroundRenderer()
		this.uiHandler = new UIHandler()

		this.ocean = new Ocean(
			this.config.oceanBoundary,
			this.config.oceanSubdivision,
			this.config.oceanConfig
		)

		this.oceanMap = new OceanMap(
			hex_color('#05133d'),
			hex_color('#ff0000'),
			this.config.oceanBoundary
		)

		this.splash_effect = new SplashEffect()
		this.targetManager = new TargetManager(
			this.config.oceanBoundary,
			this.config.targets_per_chunk
		)
		this.test_cube = new TestCube()

		this.boat_physics = new BoatPhysics(
			this.config.oceanConfig,
			(t, x, z, ny, water_color, strength) => {
				this.splash_effect.splash(t, x, z, ny, water_color, strength)
			},
			vec3(1, 1, 1),
			this.config.physicsConfig
		)

		this.boatManager = new BoatManager(
			this.config.boatConfig,
			this.boat_physics
		)

		this.shop = new Shop(this.config.shopConfig)

		const canvasContainer = document.getElementById('main-canvas')
		this.shopPage = new ShopPage(canvasContainer)
	}

	clamp_ocean_config() {
		this.config.oceanConfig.amplitude = clamp(
			this.config.oceanConfig.amplitude,
			0,
			0.3
		)
		this.config.oceanConfig.amplitudeMultiplier = clamp(
			this.config.oceanConfig.amplitudeMultiplier,
			0,
			0.99
		)
		this.config.oceanConfig.waveMut = clamp(
			this.config.oceanConfig.waveMut,
			0,
			2
		)
		this.config.oceanConfig.waveMultiplier = clamp(
			this.config.oceanConfig.waveMultiplier,
			1.01,
			2
		)
	}

	pause(t) {
		this.states.is_paused = true
		this.states.last_paused_time = t
	}

	unpause(t) {
		this.states.is_paused = false
		this.states.missed_time += t - this.states.last_paused_time
	}

	display(context, program_state) {
		super.display(context, program_state)

		if (this.won) {
			console.log('display winning screen')
			return
		}

		let t = program_state.animation_time / 1000
		let dt = 1 / 60 // fixed time step for physics to work properly

		this.t = t

		if (this.states.is_paused) {
			// record the time when the game is paused
			t = this.states.last_paused_time
			// dt = 0
		} else {
			t -= this.states.missed_time
		}

		// console.log('t:', t, 'dt:', dt)
		// console.log('last paused time:', this.states.last_paused_time)
		// console.log('missed time:', this.states.missed_time)

		// console.log(1 / dt)

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
		const boatScale = this.boatManager.boatScale()
		const scaledBoatSize = this.boatManager.boatScaledSize()

		const [r, g, b, a] = this.oceanMap.get_center_color()
		const water_color = vec4(r / 255, g / 255, b / 255, 1)

		this.boat_physics.updateBoatSize(scaledBoatSize)
		this.boat_physics.updateOceanConfig(this.config.oceanConfig)

		this.boat_physics.update(t, dt, water_color)
		const [x, y, z] = this.boat_physics.boat_position

		this.oceanMap.init_map(context, program_state, x, z)
		if (this.states.render_steps === 0) {
			return
		}
		this.oceanMap.clear_screen(context)

		// camera rotation
		if (this.states.camera_rotate_left) {
			this.states.camera_horizontal_angle += 0.02
		} else if (this.states.camera_rotate_right) {
			this.states.camera_horizontal_angle -= 0.02
		}
		this.states.camera_horizontal_angle = clamp(
			this.states.camera_horizontal_angle,
			-Math.PI / 4,
			Math.PI / 4
		)

		// zooming in and out
		if (this.states.is_zooming_in) {
			this.states.camera_z_offset *= 0.97
		} else if (this.states.is_zooming_out) {
			this.states.camera_z_offset *= 1.03
		}

		this.states.camera_z_offset = clamp(
			this.states.camera_z_offset,
			this.config.camera_z_min_offset,
			this.config.camera_z_max_offset
		)

		// update the camera position
		this.states.camera_position[0] = smoothlerp(
			this.states.camera_position[0],
			x,
			30 * dt
		)
		this.states.camera_position[1] = smoothlerp(
			this.states.camera_position[1],
			y,
			30 * dt
		)
		this.states.camera_position[2] = smoothlerp(
			this.states.camera_position[2],
			z,
			30 * dt
		)

		const captain_position = this.boatManager.captainPosition()
		const camera_target = this.states.camera_position.plus(captain_position)

		program_state.set_camera(
			Mat4.inverse(
				Mat4.identity()
					//follow boat
					.times(
						Mat4.translation(
							camera_target[0],
							camera_target[1],
							camera_target[2]
						) //look at where a human would be
					)
					// .times(Mat4.rotation(-use_camera_vertical_angle, 0, 0, 1)) // mouse camera rotation
					.times(
						Mat4.rotation(-this.states.mouse_camera_horizontal_angle, 0, 1, 0)
					) // mouse camera rotation
					.times(
						Mat4.rotation(this.boat_physics.boat_horizontal_angle, 0, 1, 0)
					) // align with boat's rotation
					.times(Mat4.rotation(-0.5, 0, 0, 1)) //look down a bit
					.times(Mat4.rotation(-Math.PI / 2, 0, 1, 0)) // forward direction change to x from z
					.times(Mat4.translation(0, 0, this.states.camera_z_offset)) // zoom,
			)
		)

		const normal_fov = Math.PI * 0.33
		const fast_fov = Math.PI * 0.4

		const fov = remap(
			this.boat_physics.boat_velocity[0],
			0,
			this.boat_physics.boat_maximum_velocity,
			normal_fov,
			fast_fov
		)

		this.states.fov = smoothlerp(this.states.fov, fov, 4.2 * dt) // higher fov when moving faster

		program_state.projection_transform = Mat4.perspective(
			this.states.fov,
			context.width / context.height,
			0.1,
			100
		)

		this.targetManager.explore(x, z)

		// first pass
		this.backgroundRenderer.draw(context, program_state) // render the background
		if (this.states.render_steps === 1) {
			return
		}
		this.splash_effect.draw(context, program_state) // render the splash effect (if any)

		const ocean_model_transform = Mat4.translation(x, 0, z).times(
			Mat4.translation(
				-this.config.oceanBoundary / 2,
				0,
				-this.config.oceanBoundary / 2
			)
		)

		this.clamp_ocean_config()
		this.ocean.draw(
			context,
			program_state,
			ocean_model_transform,
			this.oceanConfig,
			t,
			this.oceanMap.get_map(),
			this.targetManager.toFloat32Array(x, z, this.config.oceanBoundary)
		) // render the ocean

		if (this.states.render_steps === 2) {
			return
		}

		// convert the quaternion to a rotation matrix1
		const rotation = this.boat_physics.quaternion.toMatrix()

		const bigFlip = this.boatManager.is_big_boat ? -1 : 1 // flip the boat if it's big
		const bigRotate = this.boatManager.is_big_boat ? -Math.PI / 2 : 0 // rotate the boat if it's big
		const bigRaise = this.boatManager.is_big_boat ? 1 : 0 // raise the boat if it's big

		const boat_model_transform = Mat4.translation(
			x,
			y + bigRaise, // so that the bottom of the boat is at the water level
			z
		) // boat position
			.times(Mat4.rotation(this.boat_physics.boat_horizontal_angle, 0, 1, 0)) // boat horizontal angle
			.times(rotation) // boat quaternion rotation
			.times(Mat4.rotation(bigRotate, 1, 0, 0)) // rotate the boat 90 degrees by y axis so it faces the right way
			.times(Mat4.rotation(-Math.PI / 2, 0, 0, 1)) // rotate the boat 180 degrees by z axis so it faces the right way
			.times(Mat4.scale(boatScale, boatScale * bigFlip, boatScale)) // boat scale

		this.boatManager.draw(context, program_state, boat_model_transform) // render the boat

		if (this.states.render_steps === 3) {
			return
		}
		for (const target of this.targetManager.targets) {
			const tx = target.x
			const tz = target.z

			const distanceSquared = (tx - x) ** 2 + (tz - z) ** 2
			if (
				distanceSquared <= this.config.consume_target_distance ** 2 &&
				target.active
			) {
				target.active = false
				this.shop.money += 1
				if (this.shop.money >= 5) {
					this.shop.money = 5
				}
				this.boatManager.can_teleport = true

				// if (this.shop.money >= this.config.win_money) {
				// 	this.won = true
				// 	console.log('You won!')
				// }
			}

			if (
				distanceSquared > this.config.oceanBoundary ** 2 / 2 ||
				!target.active
			) {
				continue
			}
			const output = this.boat_physics.get_gerstner_wave(tx, tz, t)
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
				0.1
			)
		}
		// second pass
		this.post_processor.draw(context, program_state)
		if (this.states.render_steps === 4) {
			return
		}

		this.oceanMap.draw_map(
			context,
			program_state,
			this.boat_physics.boat_horizontal_angle,
			this.targetManager.toFloat32Array(x, z, this.config.oceanBoundary)
		)
		this.shop.draw_menu(context, program_state)

		// console.log(r)
		if (r >= this.config.damageThreshold) {
			//take damage
			const damage =
				((r - this.config.damageThreshold) /
					(255 - this.config.damageThreshold)) *
				dt *
				this.config.damageMultiplier
			this.boatManager.take_damage(damage)
			if (this.boatManager.health <= 0) {
				this.respawn()
			}
		}

		// if the user is pressing the splash key, splash
		if (this.states.is_splashing) {
			const ny = this.boat_physics.get_gerstner_wave(x, z, t)[0][1]
			this.splash_effect.splash(t, x, z, ny, water_color)
			this.states.is_splashing = false
		}

		// every 10 seconds, clean up unused splash effect
		if (t % 10 < 0.05) {
			this.splash_effect.cleanup(t)
		}

		this.shopPage.updateBalance(this.shop.money)
		const statusMessage = this.boatManager.has_teleporter
			? this.boatManager.can_teleport
				? 'Press t to teleport'
				: 'Teleporter on Cooldown'
			: 'Teleporter: Missing'
		this.shopPage.updateTeleporterStatus(statusMessage)
	}

	respawn() {
		// lost half money on death
		this.boat_physics.boat_position = vec3(0, 0, 0)
		this.boatManager.health = this.boatManager.max_health
		this.states.money = Math.floor(this.states.money / 2)
		this.shopPage.updateBalance(this.shop.money)
		this.states.upgrades = []
	}

	add_camera_controls(canvas) {
		canvas.addEventListener('click', (e) => {
			this.states.is_mouse_down = true // for some very weird reason, e triggers twice
			this.states.last_mouse_x = e.clientX
			this.states.last_mouse_y = e.clientY
		})

		canvas.addEventListener('mousemove', (e) => {
			if (this.states.is_mouse_down) {
				const dx = e.clientX - this.states.last_mouse_x
				const dy = e.clientY - this.states.last_mouse_y
				this.states.mouse_camera_horizontal_angle +=
					dx * this.config.mouse_camera_horizontal_sensitivity
				this.states.mouse_camera_vertical_angle +=
					dy * this.config.mouse_camera_vertical_sensitivity

				// cap dy
				this.states.mouse_camera_vertical_angle = Math.min(
					Math.PI / 4,
					Math.max(0, this.states.mouse_camera_vertical_angle)
				)

				this.states.last_mouse_x = e.clientX
				this.states.last_mouse_y = e.clientY
			}
		})
	}

	make_control_panel() {
		this.uiHandler.setup_ui(this)
	}
}
