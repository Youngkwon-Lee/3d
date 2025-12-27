'use client';

import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import type { PoseLandmark } from '@/types/pose';
import { SKELETON_CONNECTIONS, POSE_LANDMARKS } from '@/types/pose';

interface Skeleton3DProps {
  landmarks: PoseLandmark[];
  scale?: number;
  color?: string;
  jointColor?: string;
  jointSize?: number;
}

// 랜드마크를 3D 좌표로 변환
function landmarkTo3D(landmark: PoseLandmark, scale: number = 2): [number, number, number] {
  return [
    (landmark.x - 0.5) * scale,      // X: 중앙 기준
    -(landmark.y - 0.5) * scale,     // Y: 반전 (화면 좌표계 → 3D 좌표계)
    landmark.z * scale               // Z: 깊이
  ];
}

// 관절 그룹별 색상
const JOINT_COLORS: Record<string, string> = {
  face: '#ffcc00',
  torso: '#ffffff',
  leftArm: '#ff6b6b',
  rightArm: '#4ecdc4',
  leftLeg: '#ff8c42',
  rightLeg: '#45b7d1',
};

// 관절 인덱스별 그룹
function getJointGroup(index: number): string {
  if (index <= 10) return 'face';
  if (index === 11 || index === 12 || index === 23 || index === 24) return 'torso';
  if (index >= 13 && index <= 22 && index % 2 === 1) return 'leftArm';
  if (index >= 13 && index <= 22 && index % 2 === 0) return 'rightArm';
  if (index >= 25 && index <= 32 && index % 2 === 1) return 'leftLeg';
  if (index >= 25 && index <= 32 && index % 2 === 0) return 'rightLeg';
  return 'torso';
}

export default function Skeleton3D({
  landmarks,
  scale = 2,
  color = '#ffffff',
  jointColor = '#ff6b6b',
  jointSize = 0.03,
}: Skeleton3DProps) {
  // 3D 좌표로 변환된 관절 위치
  const positions = useMemo(() => {
    return landmarks.map((l) => landmarkTo3D(l, scale));
  }, [landmarks, scale]);

  // 본(뼈) 라인 데이터
  const bones = useMemo(() => {
    return SKELETON_CONNECTIONS.map(([startIdx, endIdx]) => {
      const startLandmark = landmarks[startIdx];
      const endLandmark = landmarks[endIdx];

      // visibility가 낮으면 표시하지 않음
      if ((startLandmark.visibility ?? 1) < 0.5 || (endLandmark.visibility ?? 1) < 0.5) {
        return null;
      }

      return {
        start: positions[startIdx],
        end: positions[endIdx],
        color: JOINT_COLORS[getJointGroup(startIdx)] || color,
      };
    }).filter(Boolean);
  }, [positions, landmarks, color]);

  // 주요 관절만 표시 (너무 많으면 복잡해짐)
  const mainJoints = useMemo(() => {
    const importantIndices = [
      POSE_LANDMARKS.NOSE,
      POSE_LANDMARKS.LEFT_SHOULDER,
      POSE_LANDMARKS.RIGHT_SHOULDER,
      POSE_LANDMARKS.LEFT_ELBOW,
      POSE_LANDMARKS.RIGHT_ELBOW,
      POSE_LANDMARKS.LEFT_WRIST,
      POSE_LANDMARKS.RIGHT_WRIST,
      POSE_LANDMARKS.LEFT_HIP,
      POSE_LANDMARKS.RIGHT_HIP,
      POSE_LANDMARKS.LEFT_KNEE,
      POSE_LANDMARKS.RIGHT_KNEE,
      POSE_LANDMARKS.LEFT_ANKLE,
      POSE_LANDMARKS.RIGHT_ANKLE,
    ];

    return importantIndices
      .filter((idx) => (landmarks[idx]?.visibility ?? 1) > 0.5)
      .map((idx) => ({
        position: positions[idx],
        color: JOINT_COLORS[getJointGroup(idx)] || jointColor,
      }));
  }, [positions, landmarks, jointColor]);

  return (
    <group>
      {/* 본 (뼈) 라인 렌더링 */}
      {bones.map((bone, i) => (
        bone && (
          <Line
            key={`bone-${i}`}
            points={[bone.start, bone.end]}
            color={bone.color}
            lineWidth={3}
          />
        )
      ))}

      {/* 관절 구체 렌더링 */}
      {mainJoints.map((joint, i) => (
        <mesh key={`joint-${i}`} position={joint.position}>
          <sphereGeometry args={[jointSize, 16, 16]} />
          <meshStandardMaterial
            color={joint.color}
            emissive={joint.color}
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}
