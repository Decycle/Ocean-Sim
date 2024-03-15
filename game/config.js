import {tiny, defs} from '../examples/common.js'

const {vec3} = tiny

export class Config {
	constructor() {
		this.oceanBoundary = 200
		this.oceanSubdivision = 200
		this.oceanConfig = {
			amplitude: 0.13,
			waveMut: 0.22,
			seed: 4551.671312417933,
			amplitudeMultiplier: 0.94,
			waveMultiplier: 1.1,
			seedOffset: 8780.3143875966,
		}

		this.physicsConfig = {
			boat_moving_force: 0.5,
			boat_starting_maximum_velocity: 10,
			boatFallingAcceleration: 3,
			boatDraftPercentage: 0.75,
			heightLerpFactor: 0.05,
			quaternionInterpolation: 0.051,
		}

		this.shopConfig = {
			boat_max_health_upgrade: 0.5,
			boat_max_speed_upgrade: 0.5,
			boat_health_heal: 100,
		}

		this.boatConfig = {
			small_boat_size: vec3(15.5, 6.5, 21.5),
			big_boat_size: vec3(2.68, 8.1, 7.4),
			small_boat_scale: 0.42,
			big_boat_scale: 1.0,
		}

		// whether or not to show advanced controls
		this.show_advanced_controls = false

		this.camera_z_min_offset = 0
		this.camera_z_max_offset = 20

		this.mouse_camera_horizontal_sensitivity = 0.005
		this.mouse_camera_vertical_sensitivity = 0.003

		this.consume_target_distance = 1

		this.targets_per_chunk = 1
	}
}