'use client';

import {
  FaceLandmarker,
  HandLandmarker,
  PoseLandmarker,
  FilesetResolver,
  DrawingUtils,
} from '@mediapipe/tasks-vision';
import type { HolisticFrame } from '@/types/mesh';
import type { PoseLandmark } from '@/types/pose';

let poseLandmarker: PoseLandmarker | null = null;
let handLandmarker: HandLandmarker | null = null;
let faceLandmarker: FaceLandmarker | null = null;
let isInitialized = false;
let isInitializing = false;

export interface HolisticDetectorOptions {
  enablePose?: boolean;
  enableHands?: boolean;
  enableFace?: boolean;
  numHands?: number;
  minPoseDetectionConfidence?: number;
  minHandDetectionConfidence?: number;
  minFaceDetectionConfidence?: number;
}

const defaultOptions: HolisticDetectorOptions = {
  enablePose: true,
  enableHands: true,
  enableFace: true,
  numHands: 2,
  minPoseDetectionConfidence: 0.5,
  minHandDetectionConfidence: 0.5,
  minFaceDetectionConfidence: 0.5,
};

export async function initializeHolisticDetector(
  options: HolisticDetectorOptions = {}
): Promise<void> {
  if (isInitialized || isInitializing) return;
  isInitializing = true;

  const opts = { ...defaultOptions, ...options };

  try {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );

    const initPromises: Promise<void>[] = [];

    // Initialize Pose Landmarker
    if (opts.enablePose) {
      initPromises.push(
        PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: opts.minPoseDetectionConfidence,
          minTrackingConfidence: 0.5,
        }).then((landmarker) => {
          poseLandmarker = landmarker;
        })
      );
    }

    // Initialize Hand Landmarker
    if (opts.enableHands) {
      initPromises.push(
        HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: opts.numHands,
          minHandDetectionConfidence: opts.minHandDetectionConfidence,
          minTrackingConfidence: 0.5,
        }).then((landmarker) => {
          handLandmarker = landmarker;
        })
      );
    }

    // Initialize Face Landmarker
    if (opts.enableFace) {
      initPromises.push(
        FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          minFaceDetectionConfidence: opts.minFaceDetectionConfidence,
          minTrackingConfidence: 0.5,
          outputFaceBlendshapes: false,
          outputFacialTransformationMatrixes: false,
        }).then((landmarker) => {
          faceLandmarker = landmarker;
        })
      );
    }

    await Promise.all(initPromises);
    isInitialized = true;
    console.log('Holistic detector initialized successfully');
  } catch (error) {
    console.error('Failed to initialize holistic detector:', error);
    throw error;
  } finally {
    isInitializing = false;
  }
}

export function detectHolistic(
  video: HTMLVideoElement,
  timestamp: number
): HolisticFrame {
  const frame: HolisticFrame = {
    timestamp,
    pose: null,
    leftHand: null,
    rightHand: null,
    face: null,
  };

  if (!isInitialized) {
    return frame;
  }

  // Detect pose
  if (poseLandmarker) {
    try {
      const poseResult = poseLandmarker.detectForVideo(video, timestamp);
      if (poseResult.landmarks && poseResult.landmarks.length > 0) {
        frame.pose = poseResult.landmarks[0].map((lm, index) => ({
          x: lm.x,
          y: lm.y,
          z: lm.z,
          visibility: lm.visibility ?? 1,
          index,
        })) as PoseLandmark[];
      }
    } catch (e) {
      console.warn('Pose detection error:', e);
    }
  }

  // Detect hands
  if (handLandmarker) {
    try {
      const handResult = handLandmarker.detectForVideo(video, timestamp);
      if (handResult.landmarks && handResult.handednesses) {
        for (let i = 0; i < handResult.landmarks.length; i++) {
          const landmarks = handResult.landmarks[i].map((lm) => ({
            x: lm.x,
            y: lm.y,
            z: lm.z,
          }));
          const handedness = handResult.handednesses[i][0]?.categoryName;

          // MediaPipe returns mirrored handedness for webcam
          if (handedness === 'Left') {
            frame.rightHand = landmarks;
          } else {
            frame.leftHand = landmarks;
          }
        }
      }
    } catch (e) {
      console.warn('Hand detection error:', e);
    }
  }

  // Detect face
  if (faceLandmarker) {
    try {
      const faceResult = faceLandmarker.detectForVideo(video, timestamp);
      if (faceResult.faceLandmarks && faceResult.faceLandmarks.length > 0) {
        frame.face = faceResult.faceLandmarks[0].map((lm) => ({
          x: lm.x,
          y: lm.y,
          z: lm.z,
        }));
      }
    } catch (e) {
      console.warn('Face detection error:', e);
    }
  }

  return frame;
}

export function drawHolisticOverlay(
  ctx: CanvasRenderingContext2D,
  frame: HolisticFrame
): void {
  const drawingUtils = new DrawingUtils(ctx);

  // Draw pose
  if (frame.pose) {
    const poseLandmarks = frame.pose.map((lm) => ({
      x: lm.x,
      y: lm.y,
      z: lm.z,
      visibility: lm.visibility,
    }));

    // Draw connections
    drawingUtils.drawConnectors(
      poseLandmarks,
      PoseLandmarker.POSE_CONNECTIONS,
      { color: '#00FF00', lineWidth: 2 }
    );

    // Draw landmarks
    drawingUtils.drawLandmarks(poseLandmarks, {
      color: '#FF0000',
      radius: 3,
    });
  }

  // Draw hands
  const handColors = {
    left: { connector: '#00FF00', landmark: '#FF0000' },
    right: { connector: '#00CCFF', landmark: '#FF6600' },
  };

  if (frame.leftHand) {
    drawingUtils.drawConnectors(
      frame.leftHand,
      HandLandmarker.HAND_CONNECTIONS,
      { color: handColors.left.connector, lineWidth: 2 }
    );
    drawingUtils.drawLandmarks(frame.leftHand, {
      color: handColors.left.landmark,
      radius: 2,
    });
  }

  if (frame.rightHand) {
    drawingUtils.drawConnectors(
      frame.rightHand,
      HandLandmarker.HAND_CONNECTIONS,
      { color: handColors.right.connector, lineWidth: 2 }
    );
    drawingUtils.drawLandmarks(frame.rightHand, {
      color: handColors.right.landmark,
      radius: 2,
    });
  }

  // Draw face mesh
  if (frame.face) {
    drawingUtils.drawConnectors(
      frame.face,
      FaceLandmarker.FACE_LANDMARKS_TESSELATION,
      { color: '#C0C0C070', lineWidth: 1 }
    );
    drawingUtils.drawConnectors(
      frame.face,
      FaceLandmarker.FACE_LANDMARKS_CONTOURS,
      { color: '#E0E0E0', lineWidth: 1 }
    );
  }
}

export function disposeHolisticDetector(): void {
  if (poseLandmarker) {
    poseLandmarker.close();
    poseLandmarker = null;
  }
  if (handLandmarker) {
    handLandmarker.close();
    handLandmarker = null;
  }
  if (faceLandmarker) {
    faceLandmarker.close();
    faceLandmarker = null;
  }
  isInitialized = false;
}

export function isHolisticDetectorReady(): boolean {
  return isInitialized;
}
