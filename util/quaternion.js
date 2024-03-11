import {tiny} from './../examples/common.js'

const {Mat4} = tiny

class Quaternion {
	constructor(w, x, y, z) {
		this.w = w
		this.x = x
		this.y = y
		this.z = z
	}

	conjugate() {
		return new Quaternion(this.w, -this.x, -this.y, -this.z)
	}

	times(q) {
		return new Quaternion(
			this.w * q.w - this.x * q.x - this.y * q.y - this.z * q.z,
			this.w * q.x + this.x * q.w + this.y * q.z - this.z * q.y,
			this.w * q.y - this.x * q.z + this.y * q.w + this.z * q.x,
			this.w * q.z + this.x * q.y - this.y * q.x + this.z * q.w,
		)
	}

	lerp(q, t) {
		return new Quaternion(
			this.w + t * (q.w - this.w),
			this.x + t * (q.x - this.x),
			this.y + t * (q.y - this.y),
			this.z + t * (q.z - this.z),
		)
	}

	dot(q) {
		return this.w * q.w + this.x * q.x + this.y * q.y + this.z * q.z
	}

	normalized() {
		let length = this.dot(this)

		if (length == 0) {
			console.error('Quaternion has length 0')
		}

		return new Quaternion(
			this.w / length,
			this.x / length,
			this.y / length,
			this.z / length,
		)
	}

	slerp(q, t) {
		let cosTheta = this.dot(q)
		if (cosTheta > 1) {
			cosTheta = 1
		}
		let angle = Math.acos(cosTheta)

		if (angle < 0.01) {
			return this.lerp(q, t)
		}
		let sinTheta = Math.sqrt(1.0 - cosTheta * cosTheta)
		let sinThetaInv = 1.0 / sinTheta
		let ratioA = Math.sin((1 - t) * angle) * sinThetaInv
		let ratioB = Math.sin(t * angle) * sinThetaInv

		if (isNaN(ratioA) || isNaN(ratioB)) {
			console.log(cosTheta, angle, sinTheta, sinThetaInv, ratioA, ratioB)
		}

		return new Quaternion(
			this.w * ratioA + q.w * ratioB,
			this.x * ratioA + q.x * ratioB,
			this.y * ratioA + q.y * ratioB,
			this.z * ratioA + q.z * ratioB,
		)
	}

	toMatrix() {
		let w = this.w
		let x = this.x
		let y = this.y
		let z = this.z

		return Mat4.of(
			[2 * (w * w + x * x) - 1, 2 * (x * y - w * z), 2 * (x * z + w * y), 0],
			[2 * (x * y + w * z), 2 * (w * w + y * y) - 1, 2 * (y * z - w * x), 0],
			[2 * (x * z - w * y), 2 * (y * z + w * x), 2 * (w * w + z * z) - 1, 0],
			[0, 0, 0, 1],
		)
	}

	static identity() {
		return new Quaternion(1, 0, 0, 0)
	}

	isNan() {
		return isNaN(this.w) || isNaN(this.x) || isNaN(this.y) || isNaN(this.z)
	}

	predictNext(past) {
		if (this.isNan() || past.isNan()) {
			console.log('input is NAN')
		}
		let pastConjugate = past.conjugate()
		let relative = pastConjugate.times(this)
		let next = this.times(relative)

		if (next.isNan()) {
			console.log('next is NAN')
		}
		return next.normalized()
	}
}

export default Quaternion
