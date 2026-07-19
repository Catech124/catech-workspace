import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls } from "@react-three/drei";
import type * as THREE from "three";

function TorusKnot() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.3;
      meshRef.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.4} floatIntensity={0.6}>
      <mesh ref={meshRef}>
        <torusKnotGeometry args={[1, 0.35, 128, 16]} />
        <meshStandardMaterial
          color="#9149f5"
          metalness={0.7}
          roughness={0.2}
          wireframe={false}
        />
      </mesh>
    </Float>
  );
}

function Particles() {
  const positions = useMemo(() => {
    const count = 80;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 12;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 12;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    return arr;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={80}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="var(--link)"
        sizeAttenuation
        transparent
        opacity={0.6}
      />
    </points>
  );
}

export function Hero3D() {
  return (
    <div className="relative h-[500px] w-full overflow-hidden rounded-xl">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        className="h-full w-full"
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <directionalLight position={[-3, -2, 1]} intensity={0.5} color="#70b0fa" />
        <pointLight position={[0, 0, 3]} intensity={0.8} color="#9149f5" />

        <TorusKnot />
        <Particles />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={1.5}
          maxPolarAngle={Math.PI / 2.5}
          minPolarAngle={Math.PI / 3.5}
        />
      </Canvas>
    </div>
  );
}
