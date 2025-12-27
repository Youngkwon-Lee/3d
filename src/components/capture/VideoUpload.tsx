'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { usePoseStore } from '@/stores/pose-store';
import {
  initializePoseDetector,
  detectPose,
  drawPoseOverlay,
  disposePoseDetector,
} from '@/lib/mediapipe/pose-detector';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Upload,
  Play,
  Pause,
  RotateCcw,
  FileVideo,
  Loader2,
} from 'lucide-react';

export default function VideoUpload() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animationRef = useRef<number>(0);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [fps, setFps] = useState(0);

  const {
    setCaptureState,
    addFrame,
    reset,
  } = usePoseStore();

  // MediaPipe 초기화
  const initialize = useCallback(async () => {
    try {
      setIsProcessing(true);
      await initializePoseDetector();
      setIsInitialized(true);
      setCaptureState('ready');
    } catch (error) {
      console.error('Failed to initialize:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [setCaptureState]);

  // 파일 선택 핸들러
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 이전 URL 정리
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }

    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    setProgress(0);
    reset();

    // MediaPipe 초기화
    if (!isInitialized) {
      await initialize();
    }
  }, [videoUrl, isInitialized, initialize, reset]);

  // 비디오 메타데이터 로드
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  // 포즈 감지 루프
  const startProcessing = useCallback(() => {
    let lastTime = performance.now();
    let frameCount = 0;

    const processFrame = () => {
      if (!videoRef.current || !canvasRef.current) {
        animationRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx || video.readyState !== 4 || video.paused) {
        if (!video.paused) {
          animationRef.current = requestAnimationFrame(processFrame);
        }
        return;
      }

      // 캔버스 크기 맞추기
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // 포즈 감지
      const timestamp = performance.now();
      const frame = detectPose(video, timestamp);

      if (frame) {
        addFrame(frame);
        drawPoseOverlay(ctx, frame.landmarks, canvas.width, canvas.height);
      }

      // 진행률 업데이트
      setProgress((video.currentTime / video.duration) * 100);

      // FPS 계산
      frameCount++;
      if (timestamp - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = timestamp;
      }

      animationRef.current = requestAnimationFrame(processFrame);
    };

    processFrame();
  }, [addFrame]);

  // 재생/일시정지 토글
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      cancelAnimationFrame(animationRef.current);
    } else {
      videoRef.current.play();
      startProcessing();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, startProcessing]);

  // 시간 이동
  const handleSeek = useCallback((value: number[]) => {
    if (!videoRef.current || !duration) return;
    const time = (value[0] / 100) * duration;
    videoRef.current.currentTime = time;
    setProgress(value[0]);
  }, [duration]);

  // 리셋
  const handleReset = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.pause();
    }
    cancelAnimationFrame(animationRef.current);
    setIsPlaying(false);
    setProgress(0);
    reset();
  }, [reset]);

  // 비디오 종료 처리
  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    cancelAnimationFrame(animationRef.current);
  }, []);

  // 정리
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
      cancelAnimationFrame(animationRef.current);
      disposePoseDetector();
    };
  }, [videoUrl]);

  // 시간 포맷팅
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* 비디오 컨테이너 */}
      <div className="relative flex-1 bg-black rounded-lg overflow-hidden">
        {videoUrl ? (
          <>
            {/* 비디오 */}
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain"
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={handleEnded}
              playsInline
              muted
            />

            {/* 포즈 오버레이 캔버스 */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full pointer-events-none object-contain"
            />

            {/* 상태 배지 */}
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge variant="default" className="bg-green-600">
                <FileVideo className="w-3 h-3 mr-1" />
                {videoFile?.name.slice(0, 20)}...
              </Badge>
              {isPlaying && (
                <Badge variant="outline" className="bg-black/50">
                  {fps} FPS
                </Badge>
              )}
            </div>

            {/* 시간 표시 */}
            <div className="absolute bottom-4 right-4">
              <Badge variant="outline" className="bg-black/50">
                {formatTime((progress / 100) * duration)} / {formatTime(duration)}
              </Badge>
            </div>
          </>
        ) : (
          // 업로드 안내
          <div
            className="absolute inset-0 flex items-center justify-center bg-gray-900/90 cursor-pointer hover:bg-gray-900/80 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="text-center">
              {isProcessing ? (
                <>
                  <Loader2 className="w-16 h-16 mx-auto mb-4 text-blue-400 animate-spin" />
                  <p className="text-gray-300">초기화 중...</p>
                </>
              ) : (
                <>
                  <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-300 mb-2">비디오 파일을 업로드하세요</p>
                  <p className="text-gray-500 text-sm">클릭하거나 파일을 드래그하세요</p>
                  <p className="text-gray-600 text-xs mt-2">지원 형식: MP4, WebM, MOV</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* 숨겨진 파일 입력 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* 진행률 슬라이더 */}
      {videoUrl && (
        <div className="mt-3 px-1">
          <Slider
            value={[progress]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="w-full"
          />
        </div>
      )}

      {/* 컨트롤 버튼 */}
      <div className="flex gap-2 mt-4">
        {videoUrl ? (
          <>
            <Button
              variant={isPlaying ? 'secondary' : 'default'}
              onClick={togglePlay}
              className="flex-1"
              disabled={!isInitialized}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  일시정지
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  재생 및 분석
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              다른 영상
            </Button>
            <Button variant="ghost" onClick={handleReset}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                초기화 중...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                비디오 업로드
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
