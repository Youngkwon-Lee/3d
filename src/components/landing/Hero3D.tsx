'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Float,
  MeshDistortMaterial,
  MeshWobbleMaterial,
  Sphere,
  Box,
  Torus,
  Environment,
  PerspectiveCamera
} from '@react-three/drei';
import * as THREE from 'three';

// 마우스 위치를 추적하는 컴포넌트
function MouseTracker({ children }: { children: React.ReactNode }) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ pointer }) => {
    if (groupRef.current) {
      // 마우스 위치에 따라 부드럽게 회전
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        pointer.x * 0.3,
        0.05
      );
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        -pointer.y * 0.2,
        0.05
      );
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

// 인체 스켈레톤 형태의 3D 오브젝트
function HumanSkeleton() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      // 부드러운 호흡 애니메이션
      groupRef.current.position.y = Math.sin(clock.elapsedTime * 0.5) * 0.1;
    }
  });

  const jointMaterial = useMemo(() => (
    <meshStandardMaterial
      color="#60a5fa"
      emissive="#3b82f6"
      emissiveIntensity={0.5}
      metalness={0.8}
      roughness={0.2}
    />
  ), []);

  const boneMaterial = useMemo(() => (
    <meshStandardMaterial
      color="#ffffff"
      emissive="#60a5fa"
      emissiveIntensity={0.2}
      metalness={0.5}
      roughness={0.3}
      transparent
      opacity={0.8}
    />
  ), []);

  return (
    <group ref={groupRef} scale={0.8}>
      {/* 머리 */}
      <Sphere args={[0.15, 32, 32]} position={[0, 1.7, 0]}>
        {jointMaterial}
      </Sphere>

      {/* 목 */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.2, 8]} />
        {boneMaterial}
      </mesh>

      {/* 몸통 */}
      <mesh position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.08, 0.06, 0.6, 8]} />
        {boneMaterial}
      </mesh>

      {/* 어깨 */}
      <Sphere args={[0.08, 16, 16]} position={[-0.3, 1.35, 0]}>
        {jointMaterial}
      </Sphere>
      <Sphere args={[0.08, 16, 16]} position={[0.3, 1.35, 0]}>
        {jointMaterial}
      </Sphere>

      {/* 왼팔 */}
      <mesh position={[-0.45, 1.1, 0]} rotation={[0, 0, Math.PI / 4]}>
        <cylinderGeometry args={[0.03, 0.03, 0.35, 8]} />
        {boneMaterial}
      </mesh>
      <Sphere args={[0.06, 16, 16]} position={[-0.55, 0.9, 0]}>
        {jointMaterial}
      </Sphere>
      <mesh position={[-0.65, 0.65, 0]} rotation={[0, 0, Math.PI / 6]}>
        <cylinderGeometry args={[0.025, 0.025, 0.35, 8]} />
        {boneMaterial}
      </mesh>

      {/* 오른팔 */}
      <mesh position={[0.45, 1.1, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <cylinderGeometry args={[0.03, 0.03, 0.35, 8]} />
        {boneMaterial}
      </mesh>
      <Sphere args={[0.06, 16, 16]} position={[0.55, 0.9, 0]}>
        {jointMaterial}
      </Sphere>
      <mesh position={[0.65, 0.65, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <cylinderGeometry args={[0.025, 0.025, 0.35, 8]} />
        {boneMaterial}
      </mesh>

      {/* 골반 */}
      <Sphere args={[0.1, 16, 16]} position={[0, 0.75, 0]}>
        {jointMaterial}
      </Sphere>

      {/* 왼다리 */}
      <mesh position={[-0.12, 0.45, 0]}>
        <cylinderGeometry args={[0.04, 0.035, 0.5, 8]} />
        {boneMaterial}
      </mesh>
      <Sphere args={[0.06, 16, 16]} position={[-0.12, 0.2, 0]}>
        {jointMaterial}
      </Sphere>
      <mesh position={[-0.12, -0.15, 0]}>
        <cylinderGeometry args={[0.035, 0.03, 0.5, 8]} />
        {boneMaterial}
      </mesh>

      {/* 오른다리 */}
      <mesh position={[0.12, 0.45, 0]}>
        <cylinderGeometry args={[0.04, 0.035, 0.5, 8]} />
        {boneMaterial}
      </mesh>
      <Sphere args={[0.06, 16, 16]} position={[0.12, 0.2, 0]}>
        {jointMaterial}
      </Sphere>
      <mesh position={[0.12, -0.15, 0]}>
        <cylinderGeometry args={[0.035, 0.03, 0.5, 8]} />
        {boneMaterial}
      </mesh>
    </group>
  );
}

// 움직임 궤적을 나타내는 파티클
function MotionParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  const count = 100;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // 나선형 배치
      const t = i / count;
      const angle = t * Math.PI * 4;
      const radius = 0.5 + t * 1.5;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = (t - 0.5) * 3;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = clock.elapsedTime * 0.1;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#60a5fa"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

// 배경 글로우 구체
function GlowSpheres() {
  return (
    <>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <Sphere args={[0.3, 32, 32]} position={[-2, 1, -2]}>
          <MeshDistortMaterial
            color="#8b5cf6"
            emissive="#7c3aed"
            emissiveIntensity={0.5}
            distort={0.4}
            speed={2}
            transparent
            opacity={0.7}
          />
        </Sphere>
      </Float>

      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8}>
        <Sphere args={[0.2, 32, 32]} position={[2, -0.5, -1.5]}>
          <MeshDistortMaterial
            color="#10b981"
            emissive="#059669"
            emissiveIntensity={0.5}
            distort={0.3}
            speed={3}
            transparent
            opacity={0.6}
          />
        </Sphere>
      </Float>

      <Float speed={2.5} rotationIntensity={0.4} floatIntensity={1.2}>
        <Torus args={[0.3, 0.1, 16, 32]} position={[1.5, 1.5, -2]} rotation={[Math.PI / 4, 0, 0]}>
          <MeshWobbleMaterial
            color="#f59e0b"
            emissive="#d97706"
            emissiveIntensity={0.3}
            factor={0.3}
            speed={2}
            transparent
            opacity={0.5}
          />
        </Torus>
      </Float>
    </>
  );
}

// 메인 3D 씬
function Scene() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0.5, 4]} fov={50} />

      {/* 조명 */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1} color="#ffffff" />
      <directionalLight position={[-5, 3, -5]} intensity={0.5} color="#60a5fa" />
      <pointLight position={[0, 2, 2]} intensity={0.5} color="#8b5cf6" />

      {/* 환경 */}
      <Environment preset="night" />

      {/* 마우스 추적 그룹 */}
      <MouseTracker>
        <HumanSkeleton />
        <MotionParticles />
      </MouseTracker>

      {/* 배경 요소 */}
      <GlowSpheres />

      {/* 안개 효과 */}
      <fog attach="fog" args={['#030712', 5, 15]} />
    </>
  );
}

export default function Hero3D() {
  return (
    <div className="absolute inset-0 -z-10">
      <Canvas>
        <Scene />
      </Canvas>
    </div>
  );
}
