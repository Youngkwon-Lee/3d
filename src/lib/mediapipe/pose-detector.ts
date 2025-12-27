import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';
import type { PoseLandmark, PoseFrame } from '@/types/pose';

let poseLandmarker: PoseLandmarker | null = null;
let lastVideoTime = -1;

// MediaPipe 초기화
export async function initializePoseDetector(): Promise<PoseLandmarker> {
  if (poseLandmarker) {
    return poseLandmarker;
  }

  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  );

  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    outputSegmentationMasks: false,
  });

  return poseLandmarker;
}

// 비디오 프레임에서 포즈 감지
export function detectPose(
  video: HTMLVideoElement,
  timestamp: number
): PoseFrame | null {
  if (!poseLandmarker) {
    console.warn('PoseLandmarker not initialized');
    return null;
  }

  // 같은 프레임 중복 처리 방지
  if (video.currentTime === lastVideoTime) {
    return null;
  }
  lastVideoTime = video.currentTime;

  try {
    const result = poseLandmarker.detectForVideo(video, timestamp);

    if (result.landmarks && result.landmarks.length > 0) {
      const landmarks: PoseLandmark[] = result.landmarks[0].map((lm) => ({
        x: lm.x,
        y: lm.y,
        z: lm.z,
        visibility: lm.visibility ?? 1,
      }));

      return {
        timestamp,
        frameIndex: Math.floor(timestamp / (1000 / 30)), // 30fps 기준
        landmarks,
        worldLandmarks: result.worldLandmarks?.[0]?.map((lm, i) => ({
          ...landmarks[i],
          worldX: lm.x,
          worldY: lm.y,
          worldZ: lm.z,
        })),
      };
    }
  } catch (error) {
    console.error('Pose detection error:', error);
  }

  return null;
}

// 캔버스에 포즈 오버레이 그리기
export function drawPoseOverlay(
  ctx: CanvasRenderingContext2D,
  landmarks: PoseLandmark[],
  width: number,
  height: number
) {
  ctx.clearRect(0, 0, width, height);

  // 연결선 그리기
  const connections = [
    [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
    [11, 23], [12, 24], [23, 24],
    [23, 25], [25, 27], [24, 26], [26, 28],
  ];

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 2;

  connections.forEach(([start, end]) => {
    const startLm = landmarks[start];
    const endLm = landmarks[end];
    if ((startLm.visibility ?? 1) > 0.5 && (endLm.visibility ?? 1) > 0.5) {
      ctx.beginPath();
      ctx.moveTo(startLm.x * width, startLm.y * height);
      ctx.lineTo(endLm.x * width, endLm.y * height);
      ctx.stroke();
    }
  });

  // 관절점 그리기
  landmarks.forEach((lm, i) => {
    if ((lm.visibility ?? 1) > 0.5) {
      ctx.beginPath();
      ctx.arc(lm.x * width, lm.y * height, 4, 0, 2 * Math.PI);
      ctx.fillStyle = i >= 23 ? '#4ecdc4' : '#ff6b6b';
      ctx.fill();
    }
  });
}

// 리소스 정리
export function disposePoseDetector() {
  if (poseLandmarker) {
    poseLandmarker.close();
    poseLandmarker = null;
  }
  lastVideoTime = -1;
}
