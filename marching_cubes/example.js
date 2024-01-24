// view everything from -1 to 1 in three dimensions
import triangulationTable from './table.js'
import { tiny } from '../tiny-graphics.js'
const { vec3, vec } = tiny

const bounding_box = [
  [0, 0, 0],
  [10, 10, 10],
]
const nx = bounding_box[1][0] - bounding_box[0][0]
const ny = bounding_box[1][1] - bounding_box[0][1]
const nz = bounding_box[1][2] - bounding_box[0][2]

const rand = (x) => {
  x = Math.sin(x) * 10000
  return x - Math.floor(x)
}

const noise3d = (x, y, z, scale) => {
  const octaves = 4

  const persistence = 0.5
  const lacunarity = 2

  let total = 0
  let frequency = 1
  let amplitude = 1
  let maxValue = 0

  for (let i = 0; i < octaves; i++) {
    total +=
      rand((x + i + 1.4124214) * frequency * scale) *
      rand((y + i * i + 2.5121) * frequency * scale) *
      rand((z + i * i * i + 3.124) * frequency * scale) *
      amplitude
    maxValue += amplitude

    amplitude *= persistence
    frequency *= lacunarity
  }

  return total / maxValue
}

const world = (x, y, z) => {
  x -= nx / 2
  y -= ny / 2
  z -= nz / 2

  const d = Math.sqrt(x * x + y * y + z * z)
  const r = 5

  return d - r

  return d > r ? 1 : 0
}

const getExample = () => {
  const field = new Float32Array(nx * ny * nz)
  for (let x = 0; x < nx; x++) {
    for (let y = 0; y < ny; y++) {
      for (let z = 0; z < nz; z++) {
        const index = x * ny * nz + y * nz + z
        field[index] = world(x, y, z)
      }
    }
  }

  const getFieldValue = (x, y, z) => {
    const index = x * ny * nz + y * nz + z
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

  const getHash = (vector) => {
    const x_i = vector[0]
    const y_i = vector[1]
    const z_i = vector[2]

    const hash = x_i * ny * nz + y_i * nz + z_i
    return hash
  }

  const vertices = []
  const normals = []
  const normals_count = []
  const texture_coords = []
  const hashes = {}
  const indices = []

  const getVert = (x, y, z, values) => {
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
      return val + t
    }
    // vertices are in the order of the vertices in the triangulation table
    const vert = [
      [lerp(x, 0, 1), y, z],
      [x + 1, y, lerp(z, 1, 2)],
      [lerp(x, 3, 2), y, z + 1],
      [x, y, lerp(z, 0, 3)],
      [lerp(x, 4, 5), y + 1, z],
      [x + 1, y + 1, lerp(z, 5, 6)],
      [lerp(x, 7, 6), y + 1, z + 1],
      [x, y + 1, lerp(z, 4, 7)],
      [x, lerp(y, 0, 4), z],
      [x + 1, lerp(y, 1, 5), z],
      [x + 1, lerp(y, 2, 6), z + 1],
      [x, lerp(y, 3, 7), z + 1],
    ]

    return vert
  }
  for (let x = 0; x < nx - 1; x++) {
    for (let y = 0; y < ny - 1; y++) {
      for (let z = 0; z < nz - 1; z++) {
        const values = [
          getFieldValue(x, y, z),
          getFieldValue(x + 1, y, z),
          getFieldValue(x + 1, y, z + 1),
          getFieldValue(x, y, z + 1),
          getFieldValue(x, y + 1, z),
          getFieldValue(x + 1, y + 1, z),
          getFieldValue(x + 1, y + 1, z + 1),
          getFieldValue(x, y + 1, z + 1),
        ]

        const vert = getVert(x, y, z, values)
        const state = getState(
          ...values.map((v) => (v > 0 ? 1 : 0))
        )
        const edgeIndices = triangulationTable[state]
        for (let i = 0; i < edgeIndices.length; i += 3) {
          const e0 = edgeIndices[i]
          const e1 = edgeIndices[i + 1]
          const e2 = edgeIndices[i + 2]
          if (e0 === -1) break

          const vec0 = vec3(
            vert[e0][0],
            vert[e0][1],
            vert[e0][2]
          )
          const vec1 = vec3(
            vert[e1][0],
            vert[e1][1],
            vert[e1][2]
          )
          const vec2 = vec3(
            vert[e2][0],
            vert[e2][1],
            vert[e2][2]
          )

          const hash0 = getHash(vec0)
          const hash1 = getHash(vec1)
          const hash2 = getHash(vec2)

          const normal = vec1
            .minus(vec0)
            .cross(vec2.minus(vec0))
            .normalized()

          console.log(vec0, vec1, vec2, normal)

          if (!hashes[hash0]) {
            hashes[hash0] = vertices.length

            vertices.push(vec0)
            normals.push(normal)
            normals_count.push(1)
            texture_coords.push(vec(0, 1))
          } else {
            normals[hashes[hash0]].plus(normal)
            normals_count[hashes[hash0]]++
          }

          if (!hashes[hash1]) {
            hashes[hash1] = vertices.length

            vertices.push(vec1)
            normals.push(normal)
            normals_count.push(1)
            texture_coords.push(vec(0, 1))
          } else {
            normals[hashes[hash1]].plus(normal)
            normals_count[hashes[hash1]]++
          }

          if (!hashes[hash2]) {
            hashes[hash2] = vertices.length

            vertices.push(vec2)
            normals.push(normal)
            normals_count.push(1)
            texture_coords.push(vec(0, 1))
          } else {
            normals[hashes[hash2]].plus(normal)
            normals_count[hashes[hash2]]++
          }

          indices.push(hashes[hash0])
          indices.push(hashes[hash1])
          indices.push(hashes[hash2])
        }
      }
    }
  }

  for (let i = 0; i < normals.length; i++) {
    normals[i].scale_by(1 / normals_count[i])
    normals[i].normalize()
  }

  console.log(vertices)
  console.log(indices)
  console.log(normals)

  return {
    vertices,
    normals,
    texture_coords,
    indices,
  }
}

export default getExample
