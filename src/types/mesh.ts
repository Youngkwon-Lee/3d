// Hand Landmark 정의 (MediaPipe Hands - 21 points per hand)
export const HAND_LANDMARKS = {
  WRIST: 0,
  THUMB_CMC: 1,
  THUMB_MCP: 2,
  THUMB_IP: 3,
  THUMB_TIP: 4,
  INDEX_MCP: 5,
  INDEX_PIP: 6,
  INDEX_DIP: 7,
  INDEX_TIP: 8,
  MIDDLE_MCP: 9,
  MIDDLE_PIP: 10,
  MIDDLE_DIP: 11,
  MIDDLE_TIP: 12,
  RING_MCP: 13,
  RING_PIP: 14,
  RING_DIP: 15,
  RING_TIP: 16,
  PINKY_MCP: 17,
  PINKY_PIP: 18,
  PINKY_DIP: 19,
  PINKY_TIP: 20,
} as const;

// Hand bone connections
export const HAND_CONNECTIONS: [number, number][] = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm
  [5, 9], [9, 13], [13, 17],
];

// Face Mesh 주요 랜드마크 (468개 중 주요 포인트)
export const FACE_LANDMARKS = {
  // 얼굴 윤곽
  FACE_OVAL: [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109],
  // 눈
  LEFT_EYE: [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246],
  RIGHT_EYE: [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398],
  // 눈썹
  LEFT_EYEBROW: [46, 53, 52, 65, 55, 70, 63, 105, 66, 107],
  RIGHT_EYEBROW: [276, 283, 282, 295, 285, 300, 293, 334, 296, 336],
  // 코
  NOSE: [1, 2, 98, 327, 4, 5, 6, 168, 197, 195, 5],
  // 입
  LIPS_OUTER: [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185],
  LIPS_INNER: [78, 95, 88, 178, 87, 14, 317, 402, 318, 324, 308, 415, 310, 311, 312, 13, 82, 81, 80, 191],
} as const;

// Hand Landmark 데이터
export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

// Hand Frame
export interface HandFrame {
  landmarks: HandLandmark[];
  handedness: 'Left' | 'Right';
  score: number;
}

// Face Landmark 데이터
export interface FaceLandmark {
  x: number;
  y: number;
  z: number;
}

// Face Frame
export interface FaceFrame {
  landmarks: FaceLandmark[];
}

// Holistic Frame (전체 통합)
export interface HolisticFrame {
  timestamp: number;
  pose: import('./pose').PoseLandmark[] | null;
  leftHand: HandLandmark[] | null;
  rightHand: HandLandmark[] | null;
  face: FaceLandmark[] | null;
}

// SMPL Body Parameters
export interface SMPLParams {
  // Shape parameters (10 PCA components)
  betas: number[];
  // Pose parameters (24 joints * 3 rotation angles)
  thetas: number[];
  // Global translation
  translation: [number, number, number];
}

// Mesh 시각화 모드
export type MeshVisualizationMode =
  | 'skeleton'      // 스켈레톤만
  | 'mesh'          // 메쉬만
  | 'both'          // 스켈레톤 + 메쉬
  | 'wireframe';    // 와이어프레임

// 추적 대상
export interface TrackingTarget {
  pose: boolean;
  leftHand: boolean;
  rightHand: boolean;
  face: boolean;
}
