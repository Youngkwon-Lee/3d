'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Line } from '@react-three/drei';
import type { FaceLandmark } from '@/types/mesh';
import { FACE_LANDMARKS } from '@/types/mesh';

interface FaceMesh3DProps {
  landmarks: FaceLandmark[] | null;
  scale?: number;
  position?: [number, number, number];
  showWireframe?: boolean;
  showMesh?: boolean;
  showContours?: boolean;
  showEyes?: boolean;
  showLips?: boolean;
  meshColor?: string;
  contourColor?: string;
  opacity?: number;
}

// Face mesh triangulation indices (simplified version)
// Full face mesh has 468 landmarks, we use key connections
const FACE_MESH_TRIANGLES = generateFaceMeshTriangles();

function generateFaceMeshTriangles(): number[][] {
  // Simplified triangulation for key facial features
  const triangles: number[][] = [];

  // Face oval triangulation (connecting oval to center)
  const oval = FACE_LANDMARKS.FACE_OVAL;
  const noseTip = 4; // Approximate center
  for (let i = 0; i < oval.length - 1; i++) {
    triangles.push([oval[i], oval[i + 1], noseTip]);
  }
  triangles.push([oval[oval.length - 1], oval[0], noseTip]);

  return triangles;
}

// Convert normalized coordinates to 3D space
function landmarkTo3D(
  landmark: FaceLandmark,
  scale: number,
  offset: [number, number, number]
): THREE.Vector3 {
  return new THREE.Vector3(
    (landmark.x - 0.5) * scale + offset[0],
    -(landmark.y - 0.5) * scale + offset[1],
    -landmark.z * scale * 0.3 + offset[2]
  );
}

export default function FaceMesh3D({
  landmarks,
  scale = 3,
  position = [0, 1.5, 0],
  showWireframe = true,
  showMesh = false,
  showContours = true,
  showEyes = true,
  showLips = true,
  meshColor = '#a78bfa',
  contourColor = '#c4b5fd',
  opacity = 1,
}: FaceMesh3DProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Convert all landmarks to 3D positions
  const points = useMemo(() => {
    if (!landmarks || landmarks.length < 468) return [];
    return landmarks.map((lm) => landmarkTo3D(lm, scale, position));
  }, [landmarks, scale, position]);

  // Create contour lines
  const contourLines = useMemo(() => {
    if (points.length < 468 || !showContours) return [];

    const lines: THREE.Vector3[][] = [];

    // Face oval
    const ovalPoints = FACE_LANDMARKS.FACE_OVAL.map((i) => points[i]).filter(Boolean);
    if (ovalPoints.length > 0) {
      lines.push([...ovalPoints, ovalPoints[0]]);
    }

    return lines;
  }, [points, showContours]);

  // Eye contours
  const eyeLines = useMemo(() => {
    if (points.length < 468 || !showEyes) return { left: [], right: [] };

    const leftEyePoints = FACE_LANDMARKS.LEFT_EYE.map((i) => points[i]).filter(Boolean);
    const rightEyePoints = FACE_LANDMARKS.RIGHT_EYE.map((i) => points[i]).filter(Boolean);
    const leftBrowPoints = FACE_LANDMARKS.LEFT_EYEBROW.map((i) => points[i]).filter(Boolean);
    const rightBrowPoints = FACE_LANDMARKS.RIGHT_EYEBROW.map((i) => points[i]).filter(Boolean);

    return {
      left: [
        leftEyePoints.length > 0 ? [...leftEyePoints, leftEyePoints[0]] : [],
        leftBrowPoints,
      ].filter((arr) => arr.length > 0),
      right: [
        rightEyePoints.length > 0 ? [...rightEyePoints, rightEyePoints[0]] : [],
        rightBrowPoints,
      ].filter((arr) => arr.length > 0),
    };
  }, [points, showEyes]);

  // Lip contours
  const lipLines = useMemo(() => {
    if (points.length < 468 || !showLips) return [];

    const outerPoints = FACE_LANDMARKS.LIPS_OUTER.map((i) => points[i]).filter(Boolean);
    const innerPoints = FACE_LANDMARKS.LIPS_INNER.map((i) => points[i]).filter(Boolean);

    const lines: THREE.Vector3[][] = [];
    if (outerPoints.length > 0) {
      lines.push([...outerPoints, outerPoints[0]]);
    }
    if (innerPoints.length > 0) {
      lines.push([...innerPoints, innerPoints[0]]);
    }

    return lines;
  }, [points, showLips]);

  // Nose contour
  const nosePoints = useMemo(() => {
    if (points.length < 468) return [];
    return FACE_LANDMARKS.NOSE.map((i) => points[i]).filter(Boolean);
  }, [points]);

  // Create mesh geometry
  const meshGeometry = useMemo(() => {
    if (points.length < 468 || !showMesh) return null;

    const geometry = new THREE.BufferGeometry();
    const vertices: number[] = [];

    // Add all vertices
    points.forEach((p) => {
      if (p) {
        vertices.push(p.x, p.y, p.z);
      }
    });

    // Create triangulation using Delaunay-like approach for visible points
    const indices: number[] = [];
    FACE_MESH_TRIANGLES.forEach((tri) => {
      if (points[tri[0]] && points[tri[1]] && points[tri[2]]) {
        indices.push(tri[0], tri[1], tri[2]);
      }
    });

    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(vertices, 3)
    );
    if (indices.length > 0) {
      geometry.setIndex(indices);
    }
    geometry.computeVertexNormals();

    return geometry;
  }, [points, showMesh]);

  // Wireframe geometry (point cloud with lines)
  const wireframePoints = useMemo(() => {
    if (points.length < 468 || !showWireframe) return [];
    // Sample every nth point for wireframe
    return points.filter((_, i) => i % 3 === 0);
  }, [points, showWireframe]);

  // Subtle animation
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(Date.now() * 0.0005) * 0.05;
    }
  });

  if (!landmarks || landmarks.length < 468) {
    return null;
  }

  return (
    <group ref={groupRef}>
      {/* Face contour */}
      {contourLines.map((line, i) => (
        <Line
          key={`contour-${i}`}
          points={line}
          color={contourColor}
          lineWidth={1.5}
          transparent
          opacity={opacity * 0.8}
        />
      ))}

      {/* Eyes */}
      {eyeLines.left.map((line, i) => (
        <Line
          key={`left-eye-${i}`}
          points={line}
          color="#60a5fa"
          lineWidth={2}
          transparent
          opacity={opacity}
        />
      ))}
      {eyeLines.right.map((line, i) => (
        <Line
          key={`right-eye-${i}`}
          points={line}
          color="#60a5fa"
          lineWidth={2}
          transparent
          opacity={opacity}
        />
      ))}

      {/* Lips */}
      {lipLines.map((line, i) => (
        <Line
          key={`lips-${i}`}
          points={line}
          color="#f472b6"
          lineWidth={2}
          transparent
          opacity={opacity}
        />
      ))}

      {/* Nose */}
      {nosePoints.length > 0 && (
        <Line
          points={nosePoints}
          color={contourColor}
          lineWidth={1.5}
          transparent
          opacity={opacity * 0.7}
        />
      )}

      {/* Wireframe points */}
      {showWireframe && (
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[
                new Float32Array(wireframePoints.flatMap((p) => [p.x, p.y, p.z])),
                3,
              ]}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.01}
            color={meshColor}
            transparent
            opacity={opacity * 0.5}
            sizeAttenuation
          />
        </points>
      )}

      {/* Mesh surface */}
      {showMesh && meshGeometry && (
        <mesh ref={meshRef} geometry={meshGeometry}>
          <meshStandardMaterial
            color={meshColor}
            transparent
            opacity={opacity * 0.3}
            side={THREE.DoubleSide}
            metalness={0.1}
            roughness={0.9}
          />
        </mesh>
      )}

      {/* Key landmark indicators */}
      {[1, 4, 5, 6].map((i) => {
        if (!points[i]) return null;
        return (
          <mesh key={`landmark-${i}`} position={points[i]}>
            <sphereGeometry args={[0.01, 8, 8]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={opacity * 0.8} />
          </mesh>
        );
      })}
    </group>
  );
}
