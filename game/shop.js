import {tiny, defs} from '../examples/common.js'
import {ShopMenuShader} from '../shaders/shop_menu.js'

const {vec3, Mat4, Material, Texture, hex_color} = tiny

export class Shop {
	constructor(shop_config) {
		this.items = [
			{
				name: 'Max Health',
				cost: 2,
				key: 'o',
				description: 'Increase the maximum health of your boat',
				effect: (boat) => {
					boat.max_health += shop_config.boat_max_health_upgrade
					boat.health = boat.max_health

					return true
				}
			},
			{
				name: 'Max Speed',
				cost: 1,
				key: 'i',
				description: 'Increase the maximum speed of your boat',
				effect: (boat) => {
					boat.increase_speed(shop_config.boat_max_speed_upgrade)
					return true
				}
			},
			{
				name: 'Teleporter',
				cost: 5,
				key: 'k',
				description: 'Buy a teleporter that can teleport to a random location',
				effect: (boat) => {
					if (boat.has_teleporter) return false
					boat.has_teleporter = true
					return true
				}
			},
			{
				name: 'New Boat',
				cost: 3,
				key: 'b',
				description: 'Get a new boat',
				effect: (boat) => {
					if (boat.is_big_boat) return false
					boat.is_big_boat = true
					boat.max_health += shop_config.boat_max_health_upgrade * 2
					boat.health = boat.max_health
					return true
				}
			},
			{
				name: 'Heal',
				cost: 1,
				key: 'h',
				description: 'Heal your boat',
				effect: (boat) => {
					if (boat.health === boat.max_health) return false
					boat.health += shop_config.boat_health_heal
					boat.health = Math.min(boat.health, boat.max_health)
					return true
				}
			}
		]
		this.money = 0
		this.is_menu_open = false

		this.screen_quad = new defs.Square()
		this.material = new Material(new ShopMenuShader(), {
			texture: new Texture('assets/shop.jpg'),
			money: this.money
		})
	}

	buy_item(item, boat) {
		if (this.money >= item.cost) {
			const result = item.effect(boat)
			if (result) {
				this.money -= item.cost
				return true
			} else {
				console.log('Item already bought / not needed')
				return false
			}
		} else {
			console.log('Not enough money')
			return false
		}
	}

	draw_menu(context, program_state) {
		if (this.is_menu_open) {
			// this.screen_quad.draw(
			// 	context,
			// 	program_state,
			// 	Mat4.identity(),
			// 	this.material.override({
			// 		money: this.money,
			// 	}),
			// )
			// context.context.clear(context.context.DEPTH_BUFFER_BIT)
		}
	}
}
