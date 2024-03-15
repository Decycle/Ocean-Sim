export class TargetManager {
	constructor(chunk_size, targets_per_chunk = 1) {
		this.targets = []
		this.seen_chunks = {}

		this.chunk_size = chunk_size
		this.targets_per_chunk = targets_per_chunk
	}

	explore(x, z) {
		const chunk_x = Math.floor(x / this.chunk_size + 0.5)
		const chunk_z = Math.floor(z / this.chunk_size + 0.5)
		// console.log(this.targets)
		this.generate_chunks(chunk_x, chunk_z)
	}

	generate_chunks(chunk_x, chunk_z) {
		for (let i = -1; i <= 1; i++) {
			for (let j = -1; j <= 1; j++) {
				const chunk = `${chunk_x + i},${chunk_z + j}`
				if (this.seen_chunks[chunk]) {
					continue
				}
				this.seen_chunks[chunk] = true
				for (let k = 0; k < this.targets_per_chunk; k++) {
					this.generate_target(chunk_x + i, chunk_z + j)
				}
			}
		}
	}

	generate_target(chunk_x, chunk_z) {
		const x = (chunk_x + Math.random() - 0.5) * this.chunk_size
		const z = (chunk_z + Math.random() - 0.5) * this.chunk_size

		this.targets.push({
			x,
			z,
			y: 0,
			active: true,
		})
	}

	toFloat32Array(x, z, ocean_size) {
		const result = new Float32Array(this.targets.length * 2)
		let index = 0
		for (let i = 0; i < this.targets.length; i++) {
			const tx = this.targets[i].x
			const tz = this.targets[i].z

			if (Math.abs(tx - x) > ocean_size || Math.abs(tz - z) > ocean_size) {
				continue
			}
			result[index] = (tx - x) / ocean_size
			result[index + 1] = (tz - z) / ocean_size
			index += 2
		}
		return result
	}
}
