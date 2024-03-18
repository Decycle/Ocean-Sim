export class UIHandler {
	setup_ui(scene) {
		const canvas = document
			.getElementById('main-canvas')
			.getElementsByTagName('canvas')[0]
		// canvas.style.cursor = 'none'

		scene.add_camera_controls(canvas)

		scene.control_panel.innerHTML += 'Controls:'
		scene.new_line()
		scene.key_triggered_button(
			'Left Turn',
			['a'],
			() => {
				scene.boat_physics.start_rotate_left()
			},
			undefined,
			() => {
				scene.boat_physics.stop_rotate()
			}
		)

		scene.key_triggered_button(
			'Right Turn',
			['d'],
			() => {
				scene.boat_physics.start_rotate_right()
			},
			undefined,
			() => {
				scene.boat_physics.stop_rotate()
			}
		)

		scene.key_triggered_button(
			'Forward',
			['w'],
			() => {
				scene.boat_physics.is_moving_forward = true
			},
			undefined,
			() => {
				scene.boat_physics.is_moving_forward = false
			}
		)
		scene.key_triggered_button(
			'Backward',
			['s'],
			() => {
				scene.boat_physics.is_moving_backward = true
			},
			undefined,
			() => {
				scene.boat_physics.is_moving_backward = false
			}
		)
		scene.new_line()
		// scene.key_triggered_button('full screen', ['f'], () => {
		// 	if (document.fullscreenElement) {
		// 		document.exitFullscreen()
		// 	} else {
		// 		canvas.requestFullscreen()
		// 	}
		// })

		// scene.new_line()
		scene.new_line()

		scene.key_triggered_button(
			'Zoom In',
			['z'],
			() => {
				scene.states.is_zooming_in = true
			},
			undefined,
			() => {
				scene.states.is_zooming_in = false
			}
		)

		scene.key_triggered_button(
			'Zoom Out',
			['x'],
			() => {
				scene.states.is_zooming_out = true
			},
			undefined,
			() => {
				scene.states.is_zooming_out = false
			}
		)

		scene.new_line()

		scene.live_string((box) => {
			box.textContent = `Money: ${scene.shop.money}`
		})

		scene.new_line()

		for (let item of scene.shop.items) {
			const title = `${item.name} Cost: ${item.cost}`
			scene.key_triggered_button(title, [item.key], () => {
				scene.shop.buy_item(item, scene.boatManager)
			})
		}
		scene.key_triggered_button('Shop', ['m'], () => {
			scene.shopPage.shopToggle()
		})
		scene.new_line()
		scene.live_string((box) => {
			box.textContent = `Health: ${scene.boatManager.health.toFixed(2)} / ${scene.boatManager.max_health}`
		})

		scene.new_line()

		scene.live_string((box) => {
			if (scene.boatManager.has_teleporter) {
				if (scene.boatManager.can_teleport) {
					box.textContent = 'Teleporter: Ready'
				} else {
					box.textContent = 'Teleporter: Cooldown'
				}
			} else {
				box.textContent = 'Teleporter: None'
			}
		})

		scene.key_triggered_button('Teleport', ['t'], () => {
			if (scene.boatManager.has_teleporter && scene.boatManager.can_teleport) {
				scene.boatManager.can_teleport = false
				scene.boat_physics.teleport()
			}
		})

		scene.new_line()

		if (scene.config.show_advanced_controls) {
			scene.live_string((box) => {
				box.textContent = 'Wave Configuration:'
			})
			scene.new_line()
			scene.key_triggered_button('+0.1', [], () => {
				scene.config.oceanConfig.amplitude += 0.1
			})
			scene.key_triggered_button('+0.01', [], () => {
				scene.config.oceanConfig.amplitude += 0.01
			})
			scene.live_string((box) => {
				box.textContent = `Wave Amplitude: ${scene.config.oceanConfig.amplitude.toFixed(2)}`
			})
			scene.key_triggered_button('-0.01', [], () => {
				scene.config.oceanConfig.amplitude -= 0.01
			})
			scene.key_triggered_button('-0.1', [], () => {
				scene.config.oceanConfig.amplitude -= 0.1
			})
			scene.new_line()
			scene.key_triggered_button('+0.1', [], () => {
				scene.config.oceanConfig.amplitudeMultiplier += 0.1
			})
			scene.key_triggered_button('+0.01', [], () => {
				scene.config.oceanConfig.amplitudeMultiplier += 0.01
			})
			scene.live_string((box) => {
				box.textContent = `Wave Amplitude Multiplier: ${scene.config.oceanConfig.amplitudeMultiplier.toFixed(
					2
				)}`
			})
			scene.key_triggered_button('-0.01', [], () => {
				scene.config.oceanConfig.amplitudeMultiplier -= 0.01
			})
			scene.key_triggered_button('-0.1', [], () => {
				scene.config.oceanConfig.amplitudeMultiplier -= 0.1
			})
			scene.new_line()
			scene.key_triggered_button('+0.01', [], () => {
				scene.config.oceanConfig.waveMut += 0.01
			})
			scene.key_triggered_button('+0.1', [], () => {
				scene.config.oceanConfig.waveMut += 0.1
			})
			scene.live_string((box) => {
				box.textContent = `Wave Number: ${scene.config.oceanConfig.waveMut.toFixed(2)}`
			})
			scene.key_triggered_button('-0.01', [], () => {
				scene.config.oceanConfig.waveMut -= 0.01
			})
			scene.key_triggered_button('-0.1', [], () => {
				scene.config.oceanConfig.waveMut -= 0.1
			})
			scene.new_line()
			scene.key_triggered_button('+0.1', [], () => {
				scene.config.oceanConfig.waveMultiplier += 0.1
			})
			scene.key_triggered_button('+0.01', [], () => {
				scene.config.oceanConfig.waveMultiplier += 0.01
			})
			scene.live_string((box) => {
				box.textContent = `Wave Number Multiplier: ${scene.config.oceanConfig.waveMultiplier.toFixed(
					2
				)}`
			})
			scene.key_triggered_button('-0.01', [], () => {
				scene.config.oceanConfig.waveMultiplier -= 0.01
			})
			scene.key_triggered_button('-0.1', [''], () => {
				scene.config.oceanConfig.waveMultiplier -= 0.1
			})
			scene.new_line()
			scene.key_triggered_button('Randomize', ['r'], () => {
				scene.config.oceanConfig.seed = Math.random() * 10000
				scene.config.oceanConfig.seedOffset = Math.random() * 10000
			})
			scene.live_string((box) => {
				box.textContent = `Seed: ${scene.config.oceanConfig.seed} | Seed Offset: ${scene.config.oceanConfig.seedOffset}`
			})
			scene.new_line()
			scene.key_triggered_button('Cheats', ['c'], () => {
				scene.shopPage.cheatsToggle()
			})
			scene.key_triggered_button('Jump to Splash!', ['l'], () => {
				// scene.states.is_splashing = true
				scene.boat_physics.boat_position[1] += 1.5
			})
			scene.new_line()
			scene.key_triggered_button('Give Money', ['g'], () => {
				scene.shop.money += 1
			})
			scene.key_triggered_button('Reset Teleporter', ['j'], () => {
				scene.boatManager.can_teleport = true
				console.log(scene.boatManager.can_teleport)
			})
			scene.key_triggered_button('Next Render Step', ['n'], () => {
				scene.states.render_steps += 1
				scene.states.render_steps = scene.states.render_steps % 6
			})
		}
	}
}
