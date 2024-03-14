import {clamp} from './util/common.js'

export class UIHandler {
	setup_ui(scene) {
		const canvas = document.getElementById('main-canvas').firstChild

		scene.add_camera_controls(canvas)

		scene.control_panel.innerHTML += 'Controls:'

		scene.key_triggered_button('Toggle Post Processing', ['p'], () => {
			scene.enable_post_processing = !scene.enable_post_processing
		})

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
			},
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
			},
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
			},
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
			},
		)
		scene.new_line()
		scene.key_triggered_button('full screen', ['f'], () => {
			if (document.fullscreenElement) {
				document.exitFullscreen()
			} else {
				canvas.requestFullscreen()
			}
		})

		scene.new_line()

		scene.key_triggered_button(
			'Rotate Left',
			['q'],
			() => {
				scene.camera_rotate_left = true
			},
			undefined,
			() => {
				scene.camera_rotate_left = false
			},
		)

		scene.key_triggered_button(
			'Rotate Right',
			['e'],
			() => {
				scene.camera_rotate_right = true
			},
			undefined,
			() => {
				scene.camera_rotate_right = false
			},
		)
		scene.new_line()

		scene.key_triggered_button(
			'Zoom In',
			['z'],
			() => {
				scene.is_zooming_in = true
			},
			undefined,
			() => {
				scene.is_zooming_in = false
			},
		)

		scene.key_triggered_button(
			'Zoom Out',
			['x'],
			() => {
				scene.is_zooming_out = true
			},
			undefined,
			() => {
				scene.is_zooming_out = false
			},
		)

		scene.new_line()
		scene.new_line()

		if (scene.show_advanced_controls) {
			scene.control_panel.innerHTML += 'Wave Configuration:'

			scene.new_line()

			scene.key_triggered_button('+0.1', [], () => {
				scene.oceanConfig.amplitude += 0.1
			})

			scene.key_triggered_button('+0.01', [], () => {
				scene.oceanConfig.amplitude += 0.01
			})

			scene.live_string((box) => {
				box.textContent = `Wave Amplitude: ${scene.oceanConfig.amplitude.toFixed(2)}`
			})

			scene.key_triggered_button('-0.01', [], () => {
				scene.oceanConfig.amplitude -= 0.01
			})

			scene.key_triggered_button('-0.1', [], () => {
				scene.oceanConfig.amplitude -= 0.1
			})
			scene.new_line()

			scene.key_triggered_button('+0.1', [], () => {
				scene.oceanConfig.amplitudeMultiplier += 0.1
			})

			scene.key_triggered_button('+0.01', [], () => {
				scene.oceanConfig.amplitudeMultiplier += 0.01
			})

			scene.live_string((box) => {
				box.textContent = `Wave Amplitude Multiplier: ${scene.oceanConfig.amplitudeMultiplier.toFixed(
					2,
				)}`
			})

			scene.key_triggered_button('-0.01', [], () => {
				scene.oceanConfig.amplitudeMultiplier -= 0.01
			})

			scene.key_triggered_button('-0.1', [], () => {
				scene.oceanConfig.amplitudeMultiplier -= 0.1
			})

			scene.new_line()

			scene.key_triggered_button('+0.01', [], () => {
				scene.oceanConfig.waveMut += 0.01
			})

			scene.key_triggered_button('+0.1', [], () => {
				scene.oceanConfig.waveMut += 0.1
			})

			scene.live_string((box) => {
				box.textContent = `Wave Number: ${scene.oceanConfig.waveMut.toFixed(2)}`
			})

			scene.key_triggered_button('-0.01', [], () => {
				scene.oceanConfig.waveMut -= 0.01
			})

			scene.key_triggered_button('-0.1', [], () => {
				scene.oceanConfig.waveMut -= 0.1
			})

			scene.new_line()

			scene.key_triggered_button('+0.1', [], () => {
				scene.oceanConfig.waveMultiplier += 0.1
			})

			scene.key_triggered_button('+0.01', [], () => {
				scene.oceanConfig.waveMultiplier += 0.01
			})

			scene.live_string((box) => {
				box.textContent = `Wave Number Multiplier: ${scene.oceanConfig.waveMultiplier.toFixed(
					2,
				)}`
			})

			scene.key_triggered_button('-0.01', [], () => {
				scene.oceanConfig.waveMultiplier -= 0.01
			})

			scene.key_triggered_button('-0.1', [''], () => {
				scene.oceanConfig.waveMultiplier -= 0.1
			})
			scene.new_line()

			scene.key_triggered_button('randomize', ['r'], () => {
				scene.oceanConfig.seed = Math.random() * 10000
				scene.oceanConfig.seedOffset = Math.random() * 10000
			})

			scene.live_string((box) => {
				box.textContent = `Seed: ${scene.oceanConfig.seed} | Seed Offset: ${scene.oceanConfig.seedOffset}`
			})

			scene.new_line()

			scene.key_triggered_button('splash!', ['l'], () => {
				scene.is_splashing = true
			})

			scene.new_line()

			scene.key_triggered_button('big boat', ['b'], () => {
				scene.is_big_boat = !scene.is_big_boat
			})

			scene.new_line()

			scene.key_triggered_button('take damage', ['t'], () => {
				if (scene.is_big_boat) {
					scene.big_boat.take_damage(0.01)
				} else {
					scene.boat.take_damage(0.01)
				}
			})

			scene.key_triggered_button('heal', ['h'], () => {
				if (scene.is_big_boat) {
					scene.big_boat.heal(0.01)
				} else {
					scene.boat.heal(0.01)
				}
			})
		}
	}
}
