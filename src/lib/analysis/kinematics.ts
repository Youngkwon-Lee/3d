import type { PoseLandmark, PoseFrame, JointAngle } from '@/types/pose';
import { POSE_LANDMARKS } from '@/types/pose';

// 두 점 사이의 거리 계산
export function distance3D(
  p1: { x: number; y: number; z: number },
  p2: { x: number; y: number; z: number }
): number {
  return Math.sqrt(
    Math.pow(p2.x - p1.x, 2) +
    Math.pow(p2.y - p1.y, 2) +
    Math.pow(p2.z - p1.z, 2)
  );
}

// 세 점으로 이루어진 관절 각도 계산 (degrees)
export function calculateAngle(
  p1: PoseLandmark,
  p2: PoseLandmark, // 꼭짓점 (관절 위치)
  p3: PoseLandmark
): number {
  const v1 = {
    x: p1.x - p2.x,
    y: p1.y - p2.y,
    z: p1.z - p2.z,
  };

  const v2 = {
    x: p3.x - p2.x,
    y: p3.y - p2.y,
    z: p3.z - p2.z,
  };

  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);

  if (mag1 === 0 || mag2 === 0) return 0;

  const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return Math.acos(cosAngle) * (180 / Math.PI);
}

// 주요 관절 각도 계산
export function calculateJointAngles(landmarks: PoseLandmark[]): Record<string, number> {
  const angles: Record<string, number> = {};

  // 왼쪽 팔꿈치 각도
  angles.leftElbow = calculateAngle(
    landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
    landmarks[POSE_LANDMARKS.LEFT_ELBOW],
    landmarks[POSE_LANDMARKS.LEFT_WRIST]
  );

  // 오른쪽 팔꿈치 각도
  angles.rightElbow = calculateAngle(
    landmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
    landmarks[POSE_LANDMARKS.RIGHT_ELBOW],
    landmarks[POSE_LANDMARKS.RIGHT_WRIST]
  );

  // 왼쪽 어깨 각도
  angles.leftShoulder = calculateAngle(
    landmarks[POSE_LANDMARKS.LEFT_HIP],
    landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
    landmarks[POSE_LANDMARKS.LEFT_ELBOW]
  );

  // 오른쪽 어깨 각도
  angles.rightShoulder = calculateAngle(
    landmarks[POSE_LANDMARKS.RIGHT_HIP],
    landmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
    landmarks[POSE_LANDMARKS.RIGHT_ELBOW]
  );

  // 왼쪽 엉덩이 각도
  angles.leftHip = calculateAngle(
    landmarks[POSE_LANDMARKS.LEFT_SHOULDER],
    landmarks[POSE_LANDMARKS.LEFT_HIP],
    landmarks[POSE_LANDMARKS.LEFT_KNEE]
  );

  // 오른쪽 엉덩이 각도
  angles.rightHip = calculateAngle(
    landmarks[POSE_LANDMARKS.RIGHT_SHOULDER],
    landmarks[POSE_LANDMARKS.RIGHT_HIP],
    landmarks[POSE_LANDMARKS.RIGHT_KNEE]
  );

  // 왼쪽 무릎 각도
  angles.leftKnee = calculateAngle(
    landmarks[POSE_LANDMARKS.LEFT_HIP],
    landmarks[POSE_LANDMARKS.LEFT_KNEE],
    landmarks[POSE_LANDMARKS.LEFT_ANKLE]
  );

  // 오른쪽 무릎 각도
  angles.rightKnee = calculateAngle(
    landmarks[POSE_LANDMARKS.RIGHT_HIP],
    landmarks[POSE_LANDMARKS.RIGHT_KNEE],
    landmarks[POSE_LANDMARKS.RIGHT_ANKLE]
  );

  return angles;
}

// 속도 계산 (프레임 간)
export function calculateVelocity(
  prevFrame: PoseFrame,
  currFrame: PoseFrame,
  jointIndex: number
): number {
  const dt = (currFrame.timestamp - prevFrame.timestamp) / 1000; // 초 단위
  if (dt <= 0) return 0;

  const p1 = prevFrame.landmarks[jointIndex];
  const p2 = currFrame.landmarks[jointIndex];

  const dist = distance3D(p1, p2);
  return dist / dt; // 단위/초
}

// 여러 프레임에서 특정 관절의 속도 배열 계산
export function calculateVelocities(
  frames: PoseFrame[],
  jointIndex: number
): number[] {
  if (frames.length < 2) return [];

  const velocities: number[] = [];
  for (let i = 1; i < frames.length; i++) {
    velocities.push(calculateVelocity(frames[i - 1], frames[i], jointIndex));
  }
  return velocities;
}

// 가속도 계산
export function calculateAcceleration(
  velocities: number[],
  timestamps: number[]
): number[] {
  if (velocities.length < 2) return [];

  const accelerations: number[] = [];
  for (let i = 1; i < velocities.length; i++) {
    const dt = (timestamps[i] - timestamps[i - 1]) / 1000;
    if (dt > 0) {
      accelerations.push((velocities[i] - velocities[i - 1]) / dt);
    }
  }
  return accelerations;
}

// Range of Motion (ROM) 계산
export function calculateROM(angles: number[]): { min: number; max: number; range: number } {
  if (angles.length === 0) return { min: 0, max: 0, range: 0 };

  const min = Math.min(...angles);
  const max = Math.max(...angles);
  return { min, max, range: max - min };
}

// 좌우 대칭성 점수 계산 (0-100, 100이 완전 대칭)
export function calculateSymmetryScore(
  leftAngles: number[],
  rightAngles: number[]
): number {
  if (leftAngles.length === 0 || rightAngles.length === 0) return 100;

  const length = Math.min(leftAngles.length, rightAngles.length);
  let totalDiff = 0;

  for (let i = 0; i < length; i++) {
    totalDiff += Math.abs(leftAngles[i] - rightAngles[i]);
  }

  const avgDiff = totalDiff / length;
  // 각도 차이 30도 이상이면 0점
  return Math.max(0, 100 - (avgDiff / 30) * 100);
}

// 데이터 스무딩 (이동 평균)
export function smoothData(data: number[], windowSize: number = 5): number[] {
  if (data.length < windowSize) return data;

  const smoothed: number[] = [];
  const halfWindow = Math.floor(windowSize / 2);

  for (let i = 0; i < data.length; i++) {
    let sum = 0;
    let count = 0;

    for (let j = Math.max(0, i - halfWindow); j <= Math.min(data.length - 1, i + halfWindow); j++) {
      sum += data[j];
      count++;
    }

    smoothed.push(sum / count);
  }

  return smoothed;
}

// 피크 검출
export function detectPeaks(
  data: number[],
  threshold: number = 0.1
): number[] {
  const peaks: number[] = [];

  for (let i = 1; i < data.length - 1; i++) {
    if (data[i] > data[i - 1] && data[i] > data[i + 1]) {
      if (data[i] > threshold) {
        peaks.push(i);
      }
    }
  }

  return peaks;
}
