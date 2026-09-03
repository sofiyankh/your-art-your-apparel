import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Decal, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { fabricTexture, garmentGeometry } from "./garmentGeometry";

type GarmentProps = {
  category: string;
  color: string;
  imageUrl?: string | null;
  position?: [number, number, number];
  rotation?: number;
  scale?: number;
  spin?: boolean;
  settle?: boolean;
};

function Artwork({
  url,
  position,
  rotation,
  scale,
}: {
  url: string;
  position: [number, number, number];
  rotation: number;
  scale: number;
}) {
  const texture = useLoader(THREE.TextureLoader, url);
  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
  }, [texture]);

  return (
    <Decal position={position} rotation={[0, 0, rotation]} scale={[scale, scale, scale]}>
      <meshBasicMaterial
        map={texture}
        transparent
        polygonOffset
        polygonOffsetFactor={-10}
        toneMapped={false}
      />
    </Decal>
  );
}

function Garment({
  category,
  color,
  imageUrl,
  position = [0, 0.1, 0.05],
  rotation = 0,
  scale = 0.3,
  spin = false,
  settle = false,
}: GarmentProps) {
  const group = useRef<THREE.Group>(null);
  const geometry = useMemo(() => garmentGeometry(category), [category]);
  const fabric = useMemo(() => fabricTexture(), []);
  const settleStart = useRef(0);

  useEffect(() => {
    if (settle) settleStart.current = performance.now();
  }, [settle]);

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    if (!group.current) return;
    if (spin) group.current.rotation.y += delta * 0.28;
    if (settle) {
      // The one orchestrated motion moment: the garment settles square-on.
      const t = Math.min(1, (performance.now() - settleStart.current) / 700);
      const ease = 1 - Math.pow(1 - t, 3);
      group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, 0, ease * 0.2);
      const s = 0.94 + 0.06 * ease;
      group.current.scale.setScalar(s);
    } else {
      group.current.scale.setScalar(1);
    }
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.012;
  });

  return (
    <group ref={group}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={color}
          roughness={0.86}
          metalness={0}
          bumpMap={fabric}
          bumpScale={0.035}
          roughnessMap={fabric}
        />
        {imageUrl ? (
          <Suspense fallback={null}>
            <Artwork url={imageUrl} position={position} rotation={rotation} scale={scale} />
          </Suspense>
        ) : null}
      </mesh>
    </group>
  );
}

export function GarmentViewer({
  className,
  controls = true,
  ...garment
}: GarmentProps & { className?: string; controls?: boolean }) {
  return (
    <div className={className}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0.05, 3.1], fov: 42 }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[2.5, 3.5, 3]} intensity={1.5} castShadow />
        <directionalLight position={[-3, 1, -2]} intensity={0.5} />
        <Environment>
          <Lightformer intensity={2.2} position={[0, 4, 2]} scale={[8, 8, 1]} />
          <Lightformer
            intensity={1.1}
            color="#d8cfbe"
            position={[-5, 1, -1]}
            rotation-y={Math.PI / 2}
            scale={[16, 2, 1]}
          />
          <Lightformer
            intensity={0.8}
            color="#8899b5"
            position={[5, 0, 1]}
            rotation-y={-Math.PI / 2}
            scale={[16, 2, 1]}
          />
        </Environment>
        <Suspense fallback={null}>
          <Garment {...garment} />
        </Suspense>
        {controls ? (
          <OrbitControls
            enablePan={false}
            minDistance={2.2}
            maxDistance={4.5}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 1.7}
            makeDefault
          />
        ) : null}
      </Canvas>
    </div>
  );
}
