'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { MotionTrajectory } from '@/types/pose';

interface MotionTrailProps {
  trajectory: MotionTrajectory;
  fadeOut?: boolean;
  lineWidth?: number;
}

export default function MotionTrail({
  trajectory,
  fadeOut = true,
  lineWidth = 2,
}: MotionTrailProps) {
  const lineRef = useRef<THREE.Line>(null);

  // 궤적 점들을 Three.js 형식으로 변환
  const { geometry, material } = useMemo(() => {
    const points = trajectory.points.map(
      (p) => new THREE.Vector3(p.x, p.y, p.z)
    );

    const geo = new THREE.BufferGeometry().setFromPoints(points);

    // 페이드 아웃 효과를 위한 색상 배열
    if (fadeOut && points.length > 1) {
      const colors: number[] = [];
      const color = new THREE.Color(trajectory.color);

      for (let i = 0; i < points.length; i++) {
        const alpha = i / (points.length - 1); // 0 → 1
        // RGB 값에 알파를 곱해서 페이드 효과
        colors.push(color.r * alpha, color.g * alpha, color.b * alpha);
      }

      geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    }

    const mat = new THREE.LineBasicMaterial({
      color: fadeOut ? 0xffffff : trajectory.color,
      vertexColors: fadeOut,
      linewidth: lineWidth,
      transparent: true,
      opacity: 0.8,
    });

    return { geometry: geo, material: mat };
  }, [trajectory, fadeOut, lineWidth]);

  // 궤적 끝점에 발광 구체 추가
  const endPoint = useMemo(() => {
    if (trajectory.points.length === 0) return null;
    const last = trajectory.points[trajectory.points.length - 1];
    return new THREE.Vector3(last.x, last.y, last.z);
  }, [trajectory.points]);

  return (
    <group>
      {/* 궤적 라인 */}
      <primitive object={new THREE.Line(geometry, material)} ref={lineRef} />

      {/* 끝점 발광 구체 */}
      {endPoint && (
        <mesh position={endPoint}>
          <sphereGeometry args={[0.02, 16, 16]} />
          <meshStandardMaterial
            color={trajectory.color}
            emissive={trajectory.color}
            emissiveIntensity={1}
            transparent
            opacity={0.9}
          />
        </mesh>
      )}

      {/* 궤적 글로우 효과 (선택적) */}
      {endPoint && (
        <mesh position={endPoint}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial
            color={trajectory.color}
            transparent
            opacity={0.3}
          />
        </mesh>
      )}
    </group>
  );
}

// 여러 관절의 궤적을 한 번에 렌더링하는 컴포넌트
interface MultiTrailProps {
  trajectories: MotionTrajectory[];
}

export function MultiTrail({ trajectories }: MultiTrailProps) {
  return (
    <group>
      {trajectories.map((trajectory) => (
        <MotionTrail key={trajectory.jointIndex} trajectory={trajectory} />
      ))}
    </group>
  );
}
