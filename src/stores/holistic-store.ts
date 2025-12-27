'use client';

import { create } from 'zustand';
import type { HolisticFrame, MeshVisualizationMode, TrackingTarget } from '@/types/mesh';

interface HolisticState {
  // Current frame data
  currentFrame: HolisticFrame | null;

  // Frame buffer for analysis
  frameBuffer: HolisticFrame[];
  maxBufferSize: number;

  // Visualization settings
  visualizationMode: MeshVisualizationMode;
  trackingTargets: TrackingTarget;

  // Recording state
  isRecording: boolean;
  recordedFrames: HolisticFrame[];

  // Playback state
  isPlaying: boolean;
  playbackIndex: number;
  playbackSpeed: number;

  // Actions
  setCurrentFrame: (frame: HolisticFrame) => void;
  addFrame: (frame: HolisticFrame) => void;
  clearFrames: () => void;

  setVisualizationMode: (mode: MeshVisualizationMode) => void;
  setTrackingTargets: (targets: Partial<TrackingTarget>) => void;

  startRecording: () => void;
  stopRecording: () => void;
  clearRecording: () => void;

  startPlayback: () => void;
  stopPlayback: () => void;
  setPlaybackIndex: (index: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  nextFrame: () => void;
  prevFrame: () => void;
}

export const useHolisticStore = create<HolisticState>((set, get) => ({
  // Initial state
  currentFrame: null,
  frameBuffer: [],
  maxBufferSize: 300, // ~10 seconds at 30fps

  visualizationMode: 'skeleton',
  trackingTargets: {
    pose: true,
    leftHand: true,
    rightHand: true,
    face: true,
  },

  isRecording: false,
  recordedFrames: [],

  isPlaying: false,
  playbackIndex: 0,
  playbackSpeed: 1,

  // Actions
  setCurrentFrame: (frame) => set({ currentFrame: frame }),

  addFrame: (frame) =>
    set((state) => {
      const newBuffer = [...state.frameBuffer, frame];
      if (newBuffer.length > state.maxBufferSize) {
        newBuffer.shift();
      }

      const newRecorded = state.isRecording
        ? [...state.recordedFrames, frame]
        : state.recordedFrames;

      return {
        currentFrame: frame,
        frameBuffer: newBuffer,
        recordedFrames: newRecorded,
      };
    }),

  clearFrames: () =>
    set({
      currentFrame: null,
      frameBuffer: [],
    }),

  setVisualizationMode: (mode) => set({ visualizationMode: mode }),

  setTrackingTargets: (targets) =>
    set((state) => ({
      trackingTargets: { ...state.trackingTargets, ...targets },
    })),

  startRecording: () =>
    set({
      isRecording: true,
      recordedFrames: [],
    }),

  stopRecording: () => set({ isRecording: false }),

  clearRecording: () =>
    set({
      recordedFrames: [],
      playbackIndex: 0,
    }),

  startPlayback: () => set({ isPlaying: true }),
  stopPlayback: () => set({ isPlaying: false }),

  setPlaybackIndex: (index) => {
    const { recordedFrames } = get();
    const clampedIndex = Math.max(0, Math.min(index, recordedFrames.length - 1));
    set({
      playbackIndex: clampedIndex,
      currentFrame: recordedFrames[clampedIndex] || null,
    });
  },

  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  nextFrame: () => {
    const { playbackIndex, recordedFrames } = get();
    if (playbackIndex < recordedFrames.length - 1) {
      set({
        playbackIndex: playbackIndex + 1,
        currentFrame: recordedFrames[playbackIndex + 1],
      });
    }
  },

  prevFrame: () => {
    const { playbackIndex, recordedFrames } = get();
    if (playbackIndex > 0) {
      set({
        playbackIndex: playbackIndex - 1,
        currentFrame: recordedFrames[playbackIndex - 1],
      });
    }
  },
}));
