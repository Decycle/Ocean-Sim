import {tiny, defs} from '../examples/common.js'
import PostProcessingShader from '../shaders/post_processing.js'
import {clamp, remap, smoothlerp} from './util/common.js'
import Quaternion from './util/quaternion.js'
const {vec3, Mat4, Material, Texture} = tiny

export class BoatPhysics {
	constructor(oceanConfig, on_splash, boat_size) {
		this.boat_moving_force = 0.5
		this.boat_maximum_velocity = 3

		this.boat_position = vec3(0, 0, 0)
		this.boat_velocity = vec3(0, 0, 0)

		// current angle of the boat
		this.boat_horizontal_angle = 0

		// current boat quaternion
		this.quaternion = Quaternion.identity()
		// previous boat quaternion
		this.last_quaternion = this.quaternion

		this.horizontal_rotation = 0

		this.is_moving_forward = false
		this.is_moving_backward = false

		this.boatFallingAcceleration = 3
		this.boatDraftPercentage = 0.75
		this.heightLerpFactor = 0.05
		this.quaternionInterpolation = 0.051

		this.oceanConfig = oceanConfig
		this.on_splash = on_splash

		this.boat_size = boat_size
	}

	updateOceanConfig(oceanConfig) {
		this.oceanConfig = oceanConfig
	}

	updateBoatSize(boat_size) {
		this.boat_size = boat_size
	}

	update(t, dt) {
		this.boat_horizontal_angle += 0.9 * dt * this.horizontal_rotation
		if (this.is_moving_forward) {
			this.go_forward()
		}
		if (this.is_moving_backward) {
			this.go_backward()
		}

		this.boat_position = this.boat_position.plus(
			Mat4.rotation(this.boat_horizontal_angle, 0, 1, 0).times(
				this.boat_velocity.times(dt),
			),
		)
		const [x, y, z] = this.boat_position
		// calculate the new position of the boat at this instant
		const wave_pos = this.get_gerstner_wave(x, z, t)[0]
		// get the new y position
		const ny = wave_pos[1]

		const [boatWidth, boatHeight, boatLength] = this.boat_size

		if (y < ny) {
			const threshold = 0.25
			const maximum_threshold = 1.4
			// console.log(this.boat_velocity[1])
			// if the boat is falling fast enough, make a splash when it hits the water
			if (-this.boat_velocity[1] > threshold) {
				const strength = remap(
					-this.boat_velocity[1],
					threshold,
					maximum_threshold,
					0,
					1,
				)
				this.on_splash(t, x, z, ny, strength)
			}

			// smoothly move the boat up to the water level
			this.boat_position[1] = smoothlerp(
				this.boat_position[1],
				ny + boatHeight * this.boatDraftPercentage,
				this.heightLerpFactor,
			)
			this.boat_velocity[1] = 0
		}
		// if the boat is above water, make it fall
		else if (y > ny + 0.7) {
			this.boat_velocity[1] -= this.boatFallingAcceleration * dt
		}

		// apply drag to the boat (velocity decays over time)
		// boat only has forward/backward velocity (can't go sideways)
		this.boat_velocity[0] *= 0.95

		//calculate the new rotation of the boat
		let new_quaternion = this.quaternion

		// if boat is below water, rotate it to match the waves
		if (y < ny + boatHeight * this.boatDraftPercentage) {
			// calculate the four quadrants of the boat and average the normals
			const x1 = x + boatWidth / 2
			const x2 = x - boatWidth / 2
			const z1 = z + boatLength / 2
			const z2 = z - boatLength / 2

			const wave_normal1 = this.get_gerstner_wave(x1, z1, t)[1]
			const wave_normal2 = this.get_gerstner_wave(x1, z2, t)[1]
			const wave_normal3 = this.get_gerstner_wave(x2, z1, t)[1]
			const wave_normal4 = this.get_gerstner_wave(x2, z2, t)[1]

			const wave_normal = wave_normal1
				.plus(wave_normal2)
				.plus(wave_normal3)
				.plus(wave_normal4)
				.times(0.25)

			const forward = vec3(1, 0, 0)
			const right = wave_normal.cross(forward).normalized()
			if (isNaN(wave_normal[0])) {
				console.error('normal is NaN')
			}
			const theta = Math.acos(forward.dot(wave_normal))

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
				this.quaternionInterpolation,
			)
		} // otherwise, rotate the boat according to the angular velocity
		else {
			new_quaternion = this.quaternion.predictNext(this.last_quaternion)
			this.last_quaternion = this.quaternion
			this.quaternion = new_quaternion
		}
	}

	go_forward() {
		this.boat_velocity[0] += this.boat_moving_force
		this.boat_velocity[0] = clamp(
			this.boat_velocity[0],
			-this.boat_maximum_velocity,
			this.boat_maximum_velocity,
		)
	}

	go_backward() {
		this.boat_velocity[0] -= this.boat_moving_force
		this.boat_velocity[0] = clamp(
			this.boat_velocity[0],
			-this.boat_maximum_velocity,
			this.boat_maximum_velocity,
		)
	}

	start_rotate_left() {
		this.horizontal_rotation = 1
	}
	stop_rotate() {
		this.horizontal_rotation = 0
	}
	start_rotate_right() {
		this.horizontal_rotation = -1
	}

	get_position() {
		return this.boat_position
	}

	// same calculation as in the shader to get the relative movement of the boat
	get_gerstner_wave(x, z, t) {
		let amplitude = this.oceanConfig.amplitude
		let waveMut = this.oceanConfig.waveMut
		let seed = this.oceanConfig.seed

		let nx = x
		let nz = z
		let ny = 0

		let vx = vec3(1, 0, 0)
		let vz = vec3(0, 0, 1)

		const g = 9.81
		const ITERATIONS = 40

		for (let i = 0; i < ITERATIONS; i++) {
			const kx = Math.sin(seed)
			const kz = Math.cos(seed)
			const omega = Math.sqrt(g * waveMut)
			const theta = kx * waveMut * nx + kz * waveMut * nz - omega * t - seed

			nx -= kx * amplitude * Math.sin(theta)
			nz -= kz * amplitude * Math.sin(theta)
			ny += amplitude * Math.cos(theta)

			const dv = vec3(
				kx * Math.cos(theta),
				Math.sin(theta),
				kz * Math.cos(theta),
			).times(amplitude)

			vx = vx.minus(dv.times(kx))
			vz = vz.minus(dv.times(kz))

			amplitude *= this.oceanConfig.amplitudeMultiplier
			waveMut *= this.oceanConfig.waveMultiplier
			seed += this.oceanConfig.seedOffset
		}

		return [vec3(nx, ny, nz), vx.cross(vz).normalized()]
	}
}
