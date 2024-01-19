// view everything from -1 to 1 in three dimensions
import triangulationTable from './table.js'
import { tiny } from '../tiny-graphics.js'
const { vec3, vec } = tiny

const n = 70
const step_size = 1 / n

const smoothMin = (a, b, lambda) => {
  return (
    -lambda *
    Math.log(Math.exp(-a / lambda) + Math.exp(-b / lambda))
  )
}

const sphere = (x, y, z, px, py, pz, r) =>
  (x - px) * (x - px) +
  (y - py) * (y - py) +
  (z - pz) * (z - pz) -
  r * r

const noise = (x, y, z, freq, octaves = 4) => {
  let value = 0
  let weight = 1

  for (let i = 0; i < octaves; i++) {
    value +=
      weight *
      (Math.sin(x * freq) + i) *
      (Math.cos(y * freq) + i) *
      (Math.sin(z * freq) + i) *
      0.5
    weight *= 0.5
    freq *= 2
  }

  return value
}

const worldSDF = (x, y, z) => {
  x = (x - 0.5) * 2 // normalize to -1 to 1
  y = (y - 0.5) * 2
  z = (z - 0.5) * 2

  const sphere1 = sphere(x, y, z, 0, 0, 0, 0.6)
  const sphere2 = sphere(x, y, z, 0.3, 0.2, 0.4, 0.3)
  const sphere3 = sphere(x, y, z, -0.3, -0.2, -0.4, 0.3)

  const k = 0.05 // smooth factor
  const noiseScale = 0.02 // strength of noise
  const noiseFreq = 1.5 // frequency of noise
  const noiseOctaves = 4 // octaves of noise

  let d = smoothMin(sphere1, sphere2, k)
  d = smoothMin(d, sphere3, k)

  d -= noise(x, y, z, noiseFreq, noiseOctaves) * noiseScale

  return d
}

const getNormal = (x, y, z) => {
  const dx =
    worldSDF(x + step_size, y, z) -
    worldSDF(x - step_size, y, z)
  const dy =
    worldSDF(x, y + step_size, z) -
    worldSDF(x, y - step_size, z)
  const dz =
    worldSDF(x, y, z + step_size) -
    worldSDF(x, y, z - step_size)
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz)
  return vec3(dx / len, dy / len, dz / len)
}

const getExample = () => {
  const field = new Float32Array(n * n * n)
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      for (let k = 0; k < n; k++) {
        const x = i * step_size
        const y = j * step_size
        const z = k * step_size

        const index = i * n * n + j * n + k
        field[index] = worldSDF(x, y, z)
      }
    }
  }

  const getFieldValue = (x, y, z) => {
    const index = x * n * n + y * n + z
    return field[index]
  }

  const getState = (a, b, c, d, e, f, g, h) =>
    a * 1 +
    b * 2 +
    c * 4 +
    d * 8 +
    e * 16 +
    f * 32 +
    g * 64 +
    h * 128

  const vertices = []
  const normals = []
  const texture_coords = []

  const getVert = (x, y, z, offset, values) => {
    const lerp = (val, i1, i2) => {
      // we want v[i1] to be negative and v[i2] to be positive
      if (
        (values[i1] >= 0 && values[i2] >= 0) ||
        (values[i1] <= 0 && values[i2] <= 0) ||
        values[i1] === values[i2]
      )
        return val
      const t = (0 - values[i1]) / (values[i2] - values[i1])
      // linearly interpolate between the two points based on the value
      return val + t * offset
    }
    // vertices are in the order of the vertices in the triangulation table
    const vert = [
      [lerp(x, 0, 1), y, z],
      [x + offset, y, lerp(z, 1, 2)],
      [lerp(x, 3, 2), y, z + offset],
      [x, y, lerp(z, 0, 3)],
      [lerp(x, 4, 5), y + offset, z],
      [x + offset, y + offset, lerp(z, 5, 6)],
      [lerp(x, 7, 6), y + offset, z + offset],
      [x, y + offset, lerp(z, 4, 7)],
      [x, lerp(y, 0, 4), z],
      [x + offset, lerp(y, 1, 5), z],
      [x + offset, lerp(y, 2, 6), z + offset],
      [x, lerp(y, 3, 7), z + offset],
    ]

    return vert
  }

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1; j++) {
      for (let k = 0; k < n - 1; k++) {
        const values = [
          getFieldValue(i, j, k),
          getFieldValue(i + 1, j, k),
          getFieldValue(i + 1, j, k + 1),
          getFieldValue(i, j, k + 1),
          getFieldValue(i, j + 1, k),
          getFieldValue(i + 1, j + 1, k),
          getFieldValue(i + 1, j + 1, k + 1),
          getFieldValue(i, j + 1, k + 1),
        ]

        const x = i * step_size
        const y = j * step_size
        const z = k * step_size

        const vert = getVert(x, y, z, step_size, values)
        const state = getState(
          ...values.map((val) => (val <= 0 ? 1 : 0)) // signed distance field: negative = inside, positive = outside
        )

        // for each edge in the current state
        for (let vertexIndex of triangulationTable[state]) {
          if (vertexIndex !== -1) {
            // get the vertices of the edge
            // TODO: remove duplicate vertices
            // TODO: interpolate normals instead of using SDF
            const v0 = vert[vertexIndex][0]
            const v1 = vert[vertexIndex][1]
            const v2 = vert[vertexIndex][2]
            vertices.push(vec3(v0, v1, v2))
            normals.push(getNormal(x, y, z))
            texture_coords.push(vec(0, 1))
          }
        }
      }
    }
  }

  return {
    vertices,
    normals,
    texture_coords,
  }
}

export default getExample
