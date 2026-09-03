import * as THREE from "three";

/**
 * The garment blanks are generated procedurally: a stitched silhouette is
 * extruded and bevelled so the front panel stays flat enough to take a decal.
 */
function silhouette(points: [number, number][]) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0]![0], points[0]![1]);
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!;
    const cur = points[i]!;
    shape.quadraticCurveTo(prev[0], prev[1], (prev[0] + cur[0]) / 2, (prev[1] + cur[1]) / 2);
    shape.lineTo(cur[0], cur[1]);
  }
  // Mirror back down the left-hand side.
  for (let i = points.length - 2; i >= 0; i--) {
    const p = points[i]!;
    shape.lineTo(-p[0], p[1]);
  }
  shape.closePath();
  return shape;
}

const TEE: [number, number][] = [
  [0.0, -0.98],
  [0.56, -0.96],
  [0.58, -0.1],
  [0.6, 0.16],
  [0.98, 0.4],
  [1.0, 0.62],
  [0.66, 0.74],
  [0.24, 0.82],
  [0.0, 0.66],
];

const HOODIE: [number, number][] = [
  [0.0, -1.02],
  [0.64, -1.0],
  [0.66, -0.12],
  [0.68, 0.2],
  [1.12, 0.42],
  [1.14, 0.66],
  [0.74, 0.78],
  [0.3, 0.84],
  [0.0, 0.72],
];

export function garmentGeometry(category: string) {
  const depth = category === "hoodie" ? 0.42 : 0.32;
  const shape = silhouette(category === "hoodie" ? HOODIE : TEE);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.09,
    bevelSize: 0.07,
    bevelSegments: 4,
    curveSegments: 24,
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.computeVertexNormals();
  return geometry;
}

/** Woven-cotton roughness/bump map so the blanks never read as flat plastic. */
export function fabricTexture(size = 256) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, size, size);
  const image = ctx.getImageData(0, 0, size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const weave = ((x % 3 === 0 ? 18 : 0) + (y % 3 === 0 ? 18 : 0)) / 2;
      const noise = (Math.random() - 0.5) * 26;
      const v = Math.max(0, Math.min(255, 128 + weave + noise));
      const i = (y * size + x) * 4;
      image.data[i] = image.data[i + 1] = image.data[i + 2] = v;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  return texture;
}
