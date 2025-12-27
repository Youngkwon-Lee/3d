import { create } from 'zustand';
import type { PoseFrame, MotionTrajectory, CaptureState, VisualizationMode } from '@/types/pose';

interface PoseState {
  // 현재 상태
  captureState: CaptureState;
  visualizationMode: VisualizationMode;

  // 포즈 데이터
  currentFrame: PoseFrame | null;
  frameBuffer: PoseFrame[];
  maxBufferSize: number;

  // 궤적 데이터
  trajectories: MotionTrajectory[];
  trackedJoints: number[];

  // 녹화 정보
  isRecording: boolean;
  recordedFrames: PoseFrame[];
  recordingStartTime: number | null;

  // 재생 정보
  isPlaying: boolean;
  playbackIndex: number;
  playbackSpeed: number;

  // 설정
  showSkeleton: boolean;
  showTrajectory: boolean;
  showMetrics: boolean;
  trajectoryLength: number;

  // 액션
  setCaptureState: (state: CaptureState) => void;
  setVisualizationMode: (mode: VisualizationMode) => void;
  addFrame: (frame: PoseFrame) => void;
  clearFrames: () => void;
  setTrackedJoints: (joints: number[]) => void;
  startRecording: () => void;
  stopRecording: () => void;
  startPlayback: () => void;
  stopPlayback: () => void;
  setPlaybackIndex: (index: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  toggleSkeleton: () => void;
  toggleTrajectory: () => void;
  toggleMetrics: () => void;
  setTrajectoryLength: (length: number) => void;
  reset: () => void;
}

// 기본 추적 관절 (손목, 발목)
const DEFAULT_TRACKED_JOINTS = [15, 16, 27, 28]; // 왼손목, 오른손목, 왼발목, 오른발목

// 궤적 색상
const TRAJECTORY_COLORS = [
  '#ff6b6b', // 빨강
  '#4ecdc4', // 청록
  '#45b7d1', // 파랑
  '#96ceb4', // 녹색
  '#ffeaa7', // 노랑
  '#dfe6e9', // 회색
];

export const usePoseStore = create<PoseState>((set, get) => ({
  // 초기 상태
  captureState: 'idle',
  visualizationMode: 'both',
  currentFrame: null,
  frameBuffer: [],
  maxBufferSize: 300, // 약 10초 (30fps 기준)
  trajectories: [],
  trackedJoints: DEFAULT_TRACKED_JOINTS,
  isRecording: false,
  recordedFrames: [],
  recordingStartTime: null,
  isPlaying: false,
  playbackIndex: 0,
  playbackSpeed: 1,
  showSkeleton: true,
  showTrajectory: true,
  showMetrics: true,
  trajectoryLength: 60, // 2초간의 궤적

  // 액션
  setCaptureState: (captureState) => set({ captureState }),

  setVisualizationMode: (visualizationMode) => set({ visualizationMode }),

  addFrame: (frame) => {
    const state = get();
    const { frameBuffer, maxBufferSize, trackedJoints, trajectoryLength, isRecording, recordedFrames } = state;

    // 프레임 버퍼 업데이트
    const newBuffer = [...frameBuffer, frame];
    if (newBuffer.length > maxBufferSize) {
      newBuffer.shift();
    }

    // 궤적 업데이트
    const newTrajectories: MotionTrajectory[] = trackedJoints.map((jointIndex, i) => {
      const existingTrajectory = state.trajectories.find(t => t.jointIndex === jointIndex);
      const landmark = frame.landmarks[jointIndex];

      const newPoint = {
        x: (landmark.x - 0.5) * 2, // -1 to 1 정규화
        y: -(landmark.y - 0.5) * 2, // Y축 반전
        z: landmark.z * 2,
        timestamp: frame.timestamp,
      };

      const points = existingTrajectory
        ? [...existingTrajectory.points, newPoint].slice(-trajectoryLength)
        : [newPoint];

      return {
        joint: `joint_${jointIndex}`,
        jointIndex,
        points,
        color: TRAJECTORY_COLORS[i % TRAJECTORY_COLORS.length],
      };
    });

    // 녹화 중이면 녹화 버퍼에도 추가
    const newRecordedFrames = isRecording ? [...recordedFrames, frame] : recordedFrames;

    set({
      currentFrame: frame,
      frameBuffer: newBuffer,
      trajectories: newTrajectories,
      recordedFrames: newRecordedFrames,
    });
  },

  clearFrames: () => set({
    currentFrame: null,
    frameBuffer: [],
    trajectories: [],
  }),

  setTrackedJoints: (trackedJoints) => set({ trackedJoints, trajectories: [] }),

  startRecording: () => set({
    isRecording: true,
    recordedFrames: [],
    recordingStartTime: Date.now(),
  }),

  stopRecording: () => set({
    isRecording: false,
    recordingStartTime: null,
  }),

  startPlayback: () => set({ isPlaying: true, playbackIndex: 0 }),

  stopPlayback: () => set({ isPlaying: false }),

  setPlaybackIndex: (playbackIndex) => set({ playbackIndex }),

  setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),

  toggleSkeleton: () => set((state) => ({ showSkeleton: !state.showSkeleton })),

  toggleTrajectory: () => set((state) => ({ showTrajectory: !state.showTrajectory })),

  toggleMetrics: () => set((state) => ({ showMetrics: !state.showMetrics })),

  setTrajectoryLength: (trajectoryLength) => set({ trajectoryLength }),

  reset: () => set({
    captureState: 'idle',
    currentFrame: null,
    frameBuffer: [],
    trajectories: [],
    isRecording: false,
    recordedFrames: [],
    recordingStartTime: null,
    isPlaying: false,
    playbackIndex: 0,
  }),
}));
