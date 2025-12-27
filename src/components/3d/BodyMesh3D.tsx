'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Line, Sphere, Tube } from '@react-three/drei';
import type { PoseLandmark } from '@/types/pose';
import { SKELETON_CONNECTIONS, POSE_LANDMARKS } from '@/types/pose';

interface BodyMesh3DProps {
  landmarks: PoseLandmark[] | null;
  scale?: number;
  position?: [number, number, number];
  showSkeleton?: boolean;
  showMesh?: boolean;
  showJoints?: boolean;
  meshColor?: string;
  skeletonColor?: string;
  opacity?: number;
  meshType?: 'simple' | 'volumetric' | 'silhouette';
}

// Body segment radii for volumetric mesh
const BODY_SEGMENT_RADII: Record<string, number> = {
  // Torso
  torso: 0.12,
  // Arms
  upperArm: 0.04,
  forearm: 0.035,
  // Legs
  thigh: 0.06,
  calf: 0.045,
  // Head/neck
  neck: 0.03,
  head: 0.1,
};

// Convert normalized coordinates to 3D space
function landmarkTo3D(
  landmark: PoseLandmark,
  scale: number,
  offset: [number, number, number]
): THREE.Vector3 {
  return new THREE.Vector3(
    (landmark.x - 0.5) * scale + offset[0],
    -(landmark.y - 0.5) * scale + offset[1],
    -landmark.z * scale * 0.5 + offset[2]
  );
}

// Generate tube path between two points
function createTubePath(
  start: THREE.Vector3,
  end: THREE.Vector3
): THREE.CatmullRomCurve3 {
  const mid = new THREE.Vector3().lerpVectors(start, end, 0.5);
  return new THREE.CatmullRomCurve3([start, mid, end]);
}

// Body segment definitions for volumetric rendering
const BODY_SEGMENTS = [
  // Torso
  { start: POSE_LANDMARKS.LEFT_SHOULDER, end: POSE_LANDMARKS.RIGHT_SHOULDER, radius: 'torso' },
  { start: POSE_LANDMARKS.LEFT_SHOULDER, end: POSE_LANDMARKS.LEFT_HIP, radius: 'torso' },
  { start: POSE_LANDMARKS.RIGHT_SHOULDER, end: POSE_LANDMARKS.RIGHT_HIP, radius: 'torso' },
  { start: POSE_LANDMARKS.LEFT_HIP, end: POSE_LANDMARKS.RIGHT_HIP, radius: 'torso' },
  // Left arm
  { start: POSE_LANDMARKS.LEFT_SHOULDER, end: POSE_LANDMARKS.LEFT_ELBOW, radius: 'upperArm' },
  { start: POSE_LANDMARKS.LEFT_ELBOW, end: POSE_LANDMARKS.LEFT_WRIST, radius: 'forearm' },
  // Right arm
  { start: POSE_LANDMARKS.RIGHT_SHOULDER, end: POSE_LANDMARKS.RIGHT_ELBOW, radius: 'upperArm' },
  { start: POSE_LANDMARKS.RIGHT_ELBOW, end: POSE_LANDMARKS.RIGHT_WRIST, radius: 'forearm' },
  // Left leg
  { start: POSE_LANDMARKS.LEFT_HIP, end: POSE_LANDMARKS.LEFT_KNEE, radius: 'thigh' },
  { start: POSE_LANDMARKS.LEFT_KNEE, end: POSE_LANDMARKS.LEFT_ANKLE, radius: 'calf' },
  // Right leg
  { start: POSE_LANDMARKS.RIGHT_HIP, end: POSE_LANDMARKS.RIGHT_KNEE, radius: 'thigh' },
  { start: POSE_LANDMARKS.RIGHT_KNEE, end: POSE_LANDMARKS.RIGHT_ANKLE, radius: 'calf' },
];

export default function BodyMesh3D({
  landmarks,
  scale = 4,
  position = [0, 0, 0],
  showSkeleton = true,
  showMesh = true,
  showJoints = true,
  meshColor = '#8b5cf6',
  skeletonColor = '#60a5fa',
  opacity = 1,
  meshType = 'volumetric',
}: BodyMesh3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Convert landmarks to 3D positions
  const points = useMemo(() => {
    if (!landmarks || landmarks.length < 33) return [];
    return landmarks.map((lm) => landmarkTo3D(lm, scale, position));
  }, [landmarks, scale, position]);

  // Create skeleton line segments
  const skeletonSegments = useMemo(() => {
    if (points.length < 33) return [];
    return SKELETON_CONNECTIONS.map(([start, end]) => ({
      points: [points[start], points[end]],
      visibility: Math.min(
        landmarks![start].visibility || 0,
        landmarks![end].visibility || 0
      ),
    }));
  }, [points, landmarks]);

  // Create volumetric body segments
  const volumetricSegments = useMemo(() => {
    if (points.length < 33 || meshType !== 'volumetric') return [];

    return BODY_SEGMENTS.map((segment) => {
      const startPoint = points[segment.start];
      const endPoint = points[segment.end];
      const radius = BODY_SEGMENT_RADII[segment.radius] || 0.03;

      if (!startPoint || !endPoint) return null;

      const path = createTubePath(startPoint, endPoint);
      return { path, radius };
    }).filter(Boolean);
  }, [points, meshType]);

  // Create silhouette mesh (simple body shape)
  const silhouetteMesh = useMemo(() => {
    if (points.length < 33 || meshType !== 'silhouette') return null;

    // Create a simple body silhouette using key points
    const shape = new THREE.Shape();

    // Get key body points
    const leftShoulder = points[POSE_LANDMARKS.LEFT_SHOULDER];
    const rightShoulder = points[POSE_LANDMARKS.RIGHT_SHOULDER];
    const leftHip = points[POSE_LANDMARKS.LEFT_HIP];
    const rightHip = points[POSE_LANDMARKS.RIGHT_HIP];

    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return null;

    // Create silhouette outline
    shape.moveTo(leftShoulder.x, leftShoulder.y);
    shape.lineTo(rightShoulder.x, rightShoulder.y);
    shape.lineTo(rightHip.x, rightHip.y);
    shape.lineTo(leftHip.x, leftHip.y);
    shape.closePath();

    const geometry = new THREE.ShapeGeometry(shape);
    return geometry;
  }, [points, meshType]);

  // Smooth animation
  useFrame(({ clock }) => {
    if (groupRef.current) {
      // Subtle breathing effect
      const breathe = Math.sin(clock.elapsedTime * 2) * 0.01;
      groupRef.current.scale.setScalar(1 + breathe);
    }
  });

  if (!landmarks || landmarks.length < 33) {
    return null;
  }

  return (
    <group ref={groupRef}>
      {/* Skeleton lines */}
      {showSkeleton &&
        skeletonSegments.map((segment, i) => (
          <Line
            key={`skeleton-${i}`}
            points={segment.points}
            color={skeletonColor}
            lineWidth={2}
            transparent
            opacity={opacity * segment.visibility * 0.8}
          />
        ))}

      {/* Joint spheres */}
      {showJoints &&
        points.map((point, i) => {
          const visibility = landmarks![i].visibility || 0;
          if (visibility < 0.5) return null;

          // Larger spheres for major joints
          const isMajorJoint = [
            POSE_LANDMARKS.LEFT_SHOULDER,
            POSE_LANDMARKS.RIGHT_SHOULDER,
            POSE_LANDMARKS.LEFT_ELBOW,
            POSE_LANDMARKS.RIGHT_ELBOW,
            POSE_LANDMARKS.LEFT_HIP,
            POSE_LANDMARKS.RIGHT_HIP,
            POSE_LANDMARKS.LEFT_KNEE,
            POSE_LANDMARKS.RIGHT_KNEE,
          ].includes(i);

          const size = isMajorJoint ? 0.04 : 0.025;

          return (
            <Sphere key={`joint-${i}`} args={[size, 16, 16]} position={point}>
              <meshStandardMaterial
                color={skeletonColor}
                emissive={skeletonColor}
                emissiveIntensity={0.3}
                transparent
                opacity={opacity * visibility}
                metalness={0.5}
                roughness={0.5}
              />
            </Sphere>
          );
        })}

      {/* Volumetric body mesh */}
      {showMesh &&
        meshType === 'volumetric' &&
        volumetricSegments.map((segment, i) => {
          if (!segment) return null;
          return (
            <mesh key={`tube-${i}`}>
              <tubeGeometry args={[segment.path, 8, segment.radius, 8, false]} />
              <meshStandardMaterial
                color={meshColor}
                transparent
                opacity={opacity * 0.6}
                metalness={0.2}
                roughness={0.8}
              />
            </mesh>
          );
        })}

      {/* Silhouette mesh */}
      {showMesh && meshType === 'silhouette' && silhouetteMesh && (
        <mesh geometry={silhouetteMesh}>
          <meshStandardMaterial
            color={meshColor}
            transparent
            opacity={opacity * 0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Simple mesh - spheres at joints with connecting cylinders */}
      {showMesh && meshType === 'simple' && (
        <>
          {/* Torso sphere */}
          {points[POSE_LANDMARKS.LEFT_SHOULDER] && points[POSE_LANDMARKS.RIGHT_HIP] && (
            <mesh
              position={new THREE.Vector3().lerpVectors(
                points[POSE_LANDMARKS.LEFT_SHOULDER],
                points[POSE_LANDMARKS.RIGHT_HIP],
                0.5
              )}
            >
              <sphereGeometry args={[0.15, 16, 16]} />
              <meshStandardMaterial
                color={meshColor}
                transparent
                opacity={opacity * 0.5}
              />
            </mesh>
          )}

          {/* Head sphere */}
          {points[POSE_LANDMARKS.NOSE] && (
            <mesh position={points[POSE_LANDMARKS.NOSE]}>
              <sphereGeometry args={[0.1, 16, 16]} />
              <meshStandardMaterial
                color={meshColor}
                transparent
                opacity={opacity * 0.5}
              />
            </mesh>
          )}
        </>
      )}

      {/* Ambient glow for key joints */}
      {[
        POSE_LANDMARKS.LEFT_WRIST,
        POSE_LANDMARKS.RIGHT_WRIST,
        POSE_LANDMARKS.LEFT_ANKLE,
        POSE_LANDMARKS.RIGHT_ANKLE,
      ].map((jointIndex) => {
        const point = points[jointIndex];
        if (!point) return null;
        return (
          <pointLight
            key={`glow-${jointIndex}`}
            position={point}
            color={meshColor}
            intensity={0.05}
            distance={0.5}
          />
        );
      })}
    </group>
  );
}
