'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Line, Sphere } from '@react-three/drei';
import type { HandLandmark } from '@/types/mesh';
import { HAND_CONNECTIONS } from '@/types/mesh';

interface HandMesh3DProps {
  landmarks: HandLandmark[] | null;
  handedness: 'left' | 'right';
  color?: string;
  scale?: number;
  position?: [number, number, number];
  showJoints?: boolean;
  showBones?: boolean;
  showMesh?: boolean;
  jointSize?: number;
  boneWidth?: number;
  opacity?: number;
}

// Convert normalized coordinates to 3D space
function landmarkTo3D(
  landmark: HandLandmark,
  scale: number,
  offset: [number, number, number]
): THREE.Vector3 {
  return new THREE.Vector3(
    (landmark.x - 0.5) * scale + offset[0],
    -(landmark.y - 0.5) * scale + offset[1],
    -landmark.z * scale * 0.5 + offset[2]
  );
}

// Hand mesh surface triangles for rendering
const HAND_TRIANGLES = [
  // Palm
  [0, 1, 5], [0, 5, 9], [0, 9, 13], [0, 13, 17],
  [1, 5, 2], [5, 9, 6], [9, 13, 10], [13, 17, 14],
  // Fingers connections
  [1, 2, 5], [2, 5, 6], [5, 6, 9], [6, 9, 10],
  [9, 10, 13], [10, 13, 14], [13, 14, 17], [14, 17, 18],
];

export default function HandMesh3D({
  landmarks,
  handedness,
  color,
  scale = 2,
  position = [0, 0, 0],
  showJoints = true,
  showBones = true,
  showMesh = false,
  jointSize = 0.02,
  boneWidth = 2,
  opacity = 1,
}: HandMesh3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Default colors based on handedness
  const defaultColor = handedness === 'left' ? '#10b981' : '#f59e0b';
  const handColor = color || defaultColor;

  // Offset position based on handedness
  const handOffset: [number, number, number] = [
    position[0] + (handedness === 'left' ? -0.5 : 0.5),
    position[1],
    position[2],
  ];

  // Convert landmarks to 3D positions
  const points = useMemo(() => {
    if (!landmarks || landmarks.length < 21) return [];
    return landmarks.map((lm) => landmarkTo3D(lm, scale, handOffset));
  }, [landmarks, scale, handOffset]);

  // Create bone line segments
  const boneSegments = useMemo(() => {
    if (points.length < 21) return [];
    return HAND_CONNECTIONS.map(([start, end]) => [
      points[start],
      points[end],
    ]);
  }, [points]);

  // Create mesh geometry
  const meshGeometry = useMemo(() => {
    if (points.length < 21 || !showMesh) return null;

    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];

    // Add vertices
    points.forEach((p) => {
      vertices.push(p.x, p.y, p.z);
    });

    // Add triangles
    HAND_TRIANGLES.forEach((tri) => {
      indices.push(tri[0], tri[1], tri[2]);
    });

    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    return geometry;
  }, [points, showMesh]);

  // Smooth animation
  useFrame(() => {
    if (groupRef.current) {
      // Subtle breathing animation
      groupRef.current.rotation.y = Math.sin(Date.now() * 0.001) * 0.02;
    }
  });

  if (!landmarks || landmarks.length < 21) {
    return null;
  }

  return (
    <group ref={groupRef}>
      {/* Render bones */}
      {showBones &&
        boneSegments.map((segment, i) => (
          <Line
            key={`bone-${i}`}
            points={[segment[0], segment[1]]}
            color={handColor}
            lineWidth={boneWidth}
            transparent
            opacity={opacity * 0.8}
          />
        ))}

      {/* Render joints */}
      {showJoints &&
        points.map((point, i) => {
          // Fingertips are larger
          const isTip = [4, 8, 12, 16, 20].includes(i);
          const size = isTip ? jointSize * 1.5 : jointSize;

          return (
            <Sphere key={`joint-${i}`} args={[size, 16, 16]} position={point}>
              <meshStandardMaterial
                color={handColor}
                emissive={handColor}
                emissiveIntensity={isTip ? 0.5 : 0.2}
                transparent
                opacity={opacity}
                metalness={0.3}
                roughness={0.7}
              />
            </Sphere>
          );
        })}

      {/* Render mesh surface */}
      {showMesh && meshGeometry && (
        <mesh ref={meshRef} geometry={meshGeometry}>
          <meshStandardMaterial
            color={handColor}
            transparent
            opacity={opacity * 0.4}
            side={THREE.DoubleSide}
            metalness={0.2}
            roughness={0.8}
          />
        </mesh>
      )}

      {/* Fingertip glow effects */}
      {showJoints &&
        [4, 8, 12, 16, 20].map((tipIndex) => {
          if (!points[tipIndex]) return null;
          return (
            <pointLight
              key={`glow-${tipIndex}`}
              position={points[tipIndex]}
              color={handColor}
              intensity={0.1}
              distance={0.3}
            />
          );
        })}
    </group>
  );
}

// Component to render both hands
interface BothHandsProps {
  leftHand: HandLandmark[] | null;
  rightHand: HandLandmark[] | null;
  showJoints?: boolean;
  showBones?: boolean;
  showMesh?: boolean;
  scale?: number;
}

export function BothHands3D({
  leftHand,
  rightHand,
  showJoints = true,
  showBones = true,
  showMesh = false,
  scale = 2,
}: BothHandsProps) {
  return (
    <>
      {leftHand && (
        <HandMesh3D
          landmarks={leftHand}
          handedness="left"
          showJoints={showJoints}
          showBones={showBones}
          showMesh={showMesh}
          scale={scale}
        />
      )}
      {rightHand && (
        <HandMesh3D
          landmarks={rightHand}
          handedness="right"
          showJoints={showJoints}
          showBones={showBones}
          showMesh={showMesh}
          scale={scale}
        />
      )}
    </>
  );
}
