export const clamp = (value, min, max) => {
	return Math.min(Math.max(value, min), max)
}

export const lerp = (a, b, t) => {
	return a * (1 - t) + b * t
}

export const smoothlerp = (a, b, t) => {
	return lerp(a, b, t * t * (3 - 2 * t))
}

export const remap = (value, low1, high1, low2, high2) => {
	const t = clamp((value - low1) / (high1 - low1), 0, 1)
	return lerp(low2, high2, t)
}
