'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useHolisticStore } from '@/stores/holistic-store';
import {
  initializeHolisticDetector,
  detectHolistic,
  drawHolisticOverlay,
  disposeHolisticDetector,
  isHolisticDetectorReady,
} from '@/lib/mediapipe/holistic-detector';

interface HolisticVideoCaptureProps {
  onFrameProcessed?: () => void;
}

export default function HolisticVideoCapture({
  onFrameProcessed,
}: HolisticVideoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationRef = useRef<number | null>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [detectorReady, setDetectorReady] = useState(false);

  const { addFrame, trackingTargets } = useHolisticStore();

  // Initialize detector
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        await initializeHolisticDetector({
          enablePose: trackingTargets.pose,
          enableHands: trackingTargets.leftHand || trackingTargets.rightHand,
          enableFace: trackingTargets.face,
        });
        setDetectorReady(true);
      } catch (err) {
        setError('Holistic 감지기 초기화 실패');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    init();

    return () => {
      disposeHolisticDetector();
    };
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && file.type.startsWith('video/')) {
        // Clean up previous URL
        if (videoUrl) {
          URL.revokeObjectURL(videoUrl);
        }
        setVideoFile(file);
        setVideoUrl(URL.createObjectURL(file));
        setError(null);
        setProgress(0);
      } else {
        setError('비디오 파일을 선택해주세요');
      }
    },
    [videoUrl]
  );

  // Process video frame
  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || video.paused || video.ended) {
      setIsPlaying(false);
      return;
    }

    if (!isHolisticDetectorReady()) {
      animationRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame
    ctx.drawImage(video, 0, 0);

    // Detect holistic landmarks
    const timestamp = performance.now();
    const frame = detectHolistic(video, timestamp);

    // Draw overlay
    drawHolisticOverlay(ctx, frame);

    // Add frame to store
    addFrame(frame);

    // Update progress
    setProgress((video.currentTime / video.duration) * 100);

    // Callback
    onFrameProcessed?.();

    // Continue processing
    animationRef.current = requestAnimationFrame(processFrame);
  }, [addFrame, onFrameProcessed]);

  // Handle play/pause
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
      animationRef.current = requestAnimationFrame(processFrame);
    } else {
      video.pause();
      setIsPlaying(false);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
  }, [processFrame]);

  // Handle seek
  const handleSeek = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const video = videoRef.current;
      if (!video) return;

      const seekTime = (parseFloat(event.target.value) / 100) * video.duration;
      video.currentTime = seekTime;
      setProgress(parseFloat(event.target.value));
    },
    []
  );

  // Reset video
  const resetVideo = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      setProgress(0);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  return (
    <div className="w-full space-y-4">
      {/* File input */}
      <div className="flex items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
        >
          비디오 선택
        </button>
        {videoFile && (
          <span className="text-sm text-gray-400">{videoFile.name}</span>
        )}
      </div>

      {/* Status */}
      {isLoading && (
        <div className="text-yellow-400 text-sm">
          Holistic 감지기 로딩 중...
        </div>
      )}
      {error && <div className="text-red-400 text-sm">{error}</div>}
      {detectorReady && (
        <div className="text-green-400 text-sm flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          Holistic 감지기 준비 완료
        </div>
      )}

      {/* Video container */}
      {videoUrl && (
        <div className="relative">
          <video
            ref={videoRef}
            src={videoUrl}
            className="hidden"
            playsInline
            onEnded={() => setIsPlaying(false)}
          />
          <canvas
            ref={canvasRef}
            className="w-full rounded-lg border border-gray-700"
          />

          {/* Controls */}
          <div className="mt-2 space-y-2">
            {/* Progress bar */}
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleSeek}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />

            {/* Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                disabled={!detectorReady}
                className={`
                  px-4 py-2 rounded-lg font-medium transition-colors
                  ${
                    detectorReady
                      ? isPlaying
                        ? 'bg-red-600 hover:bg-red-500 text-white'
                        : 'bg-green-600 hover:bg-green-500 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }
                `}
              >
                {isPlaying ? '⏸ 일시정지' : '▶ 재생'}
              </button>

              <button
                onClick={resetVideo}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                ⏮ 처음으로
              </button>

              <span className="text-sm text-gray-400 ml-auto">
                {progress.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Placeholder when no video */}
      {!videoUrl && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="w-full aspect-video bg-gray-800 rounded-lg border-2 border-dashed border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-gray-500 transition-colors"
        >
          <svg
            className="w-16 h-16 text-gray-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
            />
          </svg>
          <p className="text-gray-400">클릭하여 비디오 파일을 선택하세요</p>
          <p className="text-sm text-gray-500 mt-2">
            포즈, 손, 얼굴을 동시에 추적합니다
          </p>
        </div>
      )}
    </div>
  );
}
