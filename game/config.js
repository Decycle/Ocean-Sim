import {tiny, defs} from '../examples/common.js'

const {vec3} = tiny

export class Config {
	constructor() {
		this.oceanBoundary = 200
		this.oceanSubdivision = 500

		this.oceanConfig = {
			amplitude: 0.13,
			waveMut: 0.22,
			seed: 4551.671312417933,
			amplitudeMultiplier: 0.94,
			waveMultiplier: 1.1,
			seedOffset: 8780.3143875966
		}

		this.physicsConfig = {
			boat_moving_force: 0.5,
			boat_starting_maximum_velocity: 10,
			boatFallingAcceleration: 3,
			boatDraftPercentage: 0.75, // 75% of the boat is submerged
			heightLerpFactor: 3,
			quaternionInterpolation: 3
		}

		this.shopConfig = {
			boat_max_health_upgrade: 0.5, // upgrade health by 0.5 per purchase
			boat_max_speed_upgrade: 5, // upgrade speed by 5 per purchase
			boat_health_heal: 100 // heal 100 health per purchase (full heal)
		}

		this.boatConfig = {
			small_boat_size: vec3(15.5, 6.5, 21.5), // calculated from model obj file
			big_boat_size: vec3(2.68, 8.1, 7.4),
			small_boat_scale: 0.42,
			big_boat_scale: 1.0
		}

		// whether or not to show advanced controls
		this.show_advanced_controls = true

		this.camera_z_min_offset = 0
		this.camera_z_max_offset = 15

		this.mouse_camera_horizontal_sensitivity = 0.005
		this.mouse_camera_vertical_sensitivity = 0.003

		this.consume_target_distance = 1 // how close the boat needs to get to get the target

		this.targets_per_chunk = 2 // number of tokens generated per chunk (per ocean boundary)

		this.damageThreshold = 64
		this.damageMultiplier = 0.1

		this.spawn_protect_time = 5 // 5 seconds invincibility if the boat is just spawned

		this.red_water_damage_exponent = 1.2
	}
}
