export class UIHandler {
	setup_ui(scene) {
		const canvas = document.getElementById('main-canvas').firstChild

		scene.add_camera_controls(canvas)

		scene.control_panel.innerHTML += 'Controls:'

		scene.key_triggered_button('Toggle Post Processing', ['p'], () => {
			scene.enable_post_processing = !scene.enable_post_processing
		})

		scene.new_line()

		const force = 10
		const max_speed = 5
		scene.key_triggered_button(
			'Left Turn',
			['a'],
			() => {
				scene.boat_rotate_left = true
			},
			undefined,
			() => {
				scene.boat_rotate_left = false
			},
		)

		scene.key_triggered_button(
			'Right Turn',
			['d'],
			() => {
				scene.boat_rotate_right = true
			},
			undefined,
			() => {
				scene.boat_rotate_right = false
			},
		)

		scene.key_triggered_button('Forward', ['w'], () => {
			scene.boat_velocity[1] += force
			scene.boat_velocity[1] = Math.min(scene.boat_velocity[1], max_speed)
		})

		scene.key_triggered_button('Backward', ['s'], () => {
			scene.boat_velocity[1] -= force
			scene.boat_velocity[1] = Math.max(scene.boat_velocity[1], -max_speed)
		})

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
				scene.amplitude += 0.1
			})

			scene.key_triggered_button('+0.01', [], () => {
				scene.amplitude += 0.01
			})

			scene.live_string((box) => {
				box.textContent = `Wave Amplitude: ${scene.amplitude.toFixed(2)}`
			})

			scene.key_triggered_button('-0.01', [], () => {
				scene.amplitude = Math.max(0, scene.amplitude - 0.01)
			})

			scene.key_triggered_button('-0.1', [], () => {
				scene.amplitude = Math.max(0, scene.amplitude - 0.1)
			})

			scene.new_line()

			scene.key_triggered_button('+0.1', [], () => {
				scene.amplitudeMultiplier += 0.1
			})

			scene.key_triggered_button('+0.01', [], () => {
				scene.amplitudeMultiplier += 0.01
			})

			scene.live_string((box) => {
				box.textContent = `Wave Amplitude Multiplier: ${scene.amplitudeMultiplier.toFixed(
					2,
				)}`
			})

			scene.key_triggered_button('-0.01', [], () => {
				scene.amplitudeMultiplier = Math.max(
					0,
					scene.amplitudeMultiplier - 0.01,
				)
			})

			scene.key_triggered_button('-0.1', [], () => {
				scene.amplitudeMultiplier = Math.max(0, scene.amplitudeMultiplier - 0.1)
			})

			scene.new_line()

			scene.key_triggered_button('+0.01', [], () => {
				scene.waveMut += 0.01
			})

			scene.key_triggered_button('+0.1', [], () => {
				scene.waveMut += 0.1
			})

			scene.live_string((box) => {
				box.textContent = `Wave Number: ${scene.waveMut.toFixed(2)}`
			})

			scene.key_triggered_button('-0.01', [], () => {
				scene.waveMut = Math.max(0, scene.waveMut - 0.01)
			})

			scene.key_triggered_button('-0.1', [], () => {
				scene.waveMut = Math.max(0, scene.waveMut - 0.1)
			})

			scene.new_line()

			scene.key_triggered_button('+0.1', [], () => {
				scene.waveMultiplier += 0.1
			})

			scene.key_triggered_button('+0.01', [], () => {
				scene.waveMultiplier += 0.01
			})

			scene.live_string((box) => {
				box.textContent = `Wave Number Multiplier: ${scene.waveMultiplier.toFixed(
					2,
				)}`
			})

			scene.key_triggered_button('-0.01', [], () => {
				scene.waveMultiplier = Math.max(0, scene.waveMultiplier - 0.01)
			})

			scene.key_triggered_button('-0.1', [''], () => {
				scene.waveMultiplier = Math.max(0, scene.waveMultiplier - 0.1)
			})

			scene.new_line()

			scene.key_triggered_button('randomize', ['r'], () => {
				scene.seed = Math.random() * 10000
				scene.seedOffset = Math.random() * 10000
			})

			scene.live_string((box) => {
				box.textContent = `Seed: ${scene.seed} | Seed Offset: ${scene.seedOffset}`
			})

			scene.new_line()

			scene.key_triggered_button('splash!', ['l'], () => {
				scene.is_splashing = true
			})

			scene.new_line()

			scene.key_triggered_button('big boat', ['b'], () => {
				scene.is_big_boat = !scene.is_big_boat
			})
		}
	}
}
