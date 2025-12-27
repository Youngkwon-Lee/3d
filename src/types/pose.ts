// MediaPipe Pose Landmark 인덱스
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const;

// 스켈레톤 본 연결 정의
export const SKELETON_CONNECTIONS: [number, number][] = [
  // 얼굴
  [POSE_LANDMARKS.NOSE, POSE_LANDMARKS.LEFT_EYE],
  [POSE_LANDMARKS.NOSE, POSE_LANDMARKS.RIGHT_EYE],
  [POSE_LANDMARKS.LEFT_EYE, POSE_LANDMARKS.LEFT_EAR],
  [POSE_LANDMARKS.RIGHT_EYE, POSE_LANDMARKS.RIGHT_EAR],
  // 몸통
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.RIGHT_SHOULDER],
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_HIP],
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_HIP],
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.RIGHT_HIP],
  // 왼팔
  [POSE_LANDMARKS.LEFT_SHOULDER, POSE_LANDMARKS.LEFT_ELBOW],
  [POSE_LANDMARKS.LEFT_ELBOW, POSE_LANDMARKS.LEFT_WRIST],
  [POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.LEFT_PINKY],
  [POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.LEFT_INDEX],
  [POSE_LANDMARKS.LEFT_WRIST, POSE_LANDMARKS.LEFT_THUMB],
  [POSE_LANDMARKS.LEFT_PINKY, POSE_LANDMARKS.LEFT_INDEX],
  // 오른팔
  [POSE_LANDMARKS.RIGHT_SHOULDER, POSE_LANDMARKS.RIGHT_ELBOW],
  [POSE_LANDMARKS.RIGHT_ELBOW, POSE_LANDMARKS.RIGHT_WRIST],
  [POSE_LANDMARKS.RIGHT_WRIST, POSE_LANDMARKS.RIGHT_PINKY],
  [POSE_LANDMARKS.RIGHT_WRIST, POSE_LANDMARKS.RIGHT_INDEX],
  [POSE_LANDMARKS.RIGHT_WRIST, POSE_LANDMARKS.RIGHT_THUMB],
  [POSE_LANDMARKS.RIGHT_PINKY, POSE_LANDMARKS.RIGHT_INDEX],
  // 왼다리
  [POSE_LANDMARKS.LEFT_HIP, POSE_LANDMARKS.LEFT_KNEE],
  [POSE_LANDMARKS.LEFT_KNEE, POSE_LANDMARKS.LEFT_ANKLE],
  [POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.LEFT_HEEL],
  [POSE_LANDMARKS.LEFT_ANKLE, POSE_LANDMARKS.LEFT_FOOT_INDEX],
  [POSE_LANDMARKS.LEFT_HEEL, POSE_LANDMARKS.LEFT_FOOT_INDEX],
  // 오른다리
  [POSE_LANDMARKS.RIGHT_HIP, POSE_LANDMARKS.RIGHT_KNEE],
  [POSE_LANDMARKS.RIGHT_KNEE, POSE_LANDMARKS.RIGHT_ANKLE],
  [POSE_LANDMARKS.RIGHT_ANKLE, POSE_LANDMARKS.RIGHT_HEEL],
  [POSE_LANDMARKS.RIGHT_ANKLE, POSE_LANDMARKS.RIGHT_FOOT_INDEX],
  [POSE_LANDMARKS.RIGHT_HEEL, POSE_LANDMARKS.RIGHT_FOOT_INDEX],
];

// 단일 랜드마크
export interface PoseLandmark {
  x: number;          // 0-1 정규화 좌표
  y: number;
  z: number;          // 깊이
  visibility?: number;
}

// 월드 좌표 포함 랜드마크
export interface WorldLandmark extends PoseLandmark {
  worldX: number;     // 실제 좌표 (미터)
  worldY: number;
  worldZ: number;
}

// 단일 프레임 데이터
export interface PoseFrame {
  timestamp: number;
  frameIndex: number;
  landmarks: PoseLandmark[];
  worldLandmarks?: WorldLandmark[];
}

// 분석용 관절 각도
export interface JointAngle {
  joint: string;
  angle: number;      // degrees
  timestamp: number;
}

// 움직임 궤적
export interface MotionTrajectory {
  joint: string;
  jointIndex: number;
  points: { x: number; y: number; z: number; timestamp: number }[];
  color: string;
}

// 분석 결과
export interface AnalysisResult {
  sessionId: string;
  startTime: number;
  duration: number;
  frameCount: number;
  fps: number;
  jointAngles: Record<string, number[]>;
  velocities: Record<string, number[]>;
  trajectories: MotionTrajectory[];
  metrics: AnalysisMetrics;
}

// 분석 메트릭
export interface AnalysisMetrics {
  maxVelocity: Record<string, number>;
  avgVelocity: Record<string, number>;
  rangeOfMotion: Record<string, { min: number; max: number }>;
  symmetryScore?: number;
}

// 캡처 상태
export type CaptureState = 'idle' | 'initializing' | 'ready' | 'recording' | 'paused' | 'stopped';

// 시각화 모드
export type VisualizationMode = 'skeleton' | 'trajectory' | 'both' | 'avatar';
