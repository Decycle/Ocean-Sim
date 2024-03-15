import {BigBoat} from '../models/big_boat.js'
import {Boat} from '../models/boat.js'
import {tiny, defs} from '../examples/common.js'

const {vec3} = tiny
class SmallBoatObject {
	constructor(size, scale) {
		this.size = size
		this.scale = scale
		this.model = new Boat()
		this.captain_position = vec3(0, 0.5, 0)
	}
}

class BigBoatObject {
	constructor(size, scale) {
		this.size = size
		this.scale = scale
		this.model = new BigBoat()
		this.captain_position = vec3(0.5, 0.5, 0)
	}
}

export class BoatManager {
	constructor(boatConfig, boatPhysics) {
		this.small_boat = new SmallBoatObject(
			boatConfig.small_boat_size,
			boatConfig.small_boat_scale,
		)
		this.big_boat = new BigBoatObject(
			boatConfig.big_boat_size,
			boatConfig.big_boat_scale,
		)

		this.health = 1
		this.max_health = 1

		this.is_big_boat = false

		this.has_teleporter = false
		this.can_teleport = true

		this.max_speed = 10
		this.physics = boatPhysics
	}

	increase_speed(speed) {
		this.max_speed += speed
		this.physics.updateMaxSpeed(this.max_speed)
	}

	boat() {
		return this.is_big_boat ? this.big_boat : this.small_boat
	}

	boatScale() {
		return this.boat().scale
	}

	boatSize() {
		return this.boat().size
	}

	boatScaledSize() {
		return this.boatSize().times(this.boatScale())
	}

	captainPosition() {
		return this.boat().captain_position
	}

	draw(context, program_state, model_transform) {
		this.boat().model.draw(
			context,
			program_state,
			model_transform,
			this.health / this.max_health,
		)
	}

	take_damage(damage) {
		this.health -= damage
	}

	heal(heal) {
		this.health += heal
		this.health = Math.min(this.health, this.max_health)
	}
}
