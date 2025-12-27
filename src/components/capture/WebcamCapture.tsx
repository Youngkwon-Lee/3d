'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { usePoseStore } from '@/stores/pose-store';
import {
  initializePoseDetector,
  detectPose,
  drawPoseOverlay,
  disposePoseDetector,
} from '@/lib/mediapipe/pose-detector';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, VideoOff, Circle, Square, RotateCcw } from 'lucide-react';

export default function WebcamCapture() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  const [isWebcamOn, setIsWebcamOn] = useState(false);
  const [fps, setFps] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const {
    captureState,
    setCaptureState,
    isRecording,
    addFrame,
    startRecording,
    stopRecording,
    reset,
  } = usePoseStore();

  // 웹캠 시작
  const startWebcam = useCallback(async () => {
    try {
      setError(null);
      setCaptureState('initializing');

      // MediaPipe 초기화
      await initializePoseDetector();

      // 웹캠 스트림 획득
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsWebcamOn(true);
        setCaptureState('ready');

        // 포즈 감지 루프 시작
        startDetectionLoop();
      }
    } catch (err) {
      console.error('Webcam error:', err);
      setError('웹캠을 시작할 수 없습니다. 권한을 확인해주세요.');
      setCaptureState('idle');
    }
  }, [setCaptureState]);

  // 웹캠 중지
  const stopWebcam = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    setIsWebcamOn(false);
    setCaptureState('idle');
    disposePoseDetector();
  }, [setCaptureState]);

  // 포즈 감지 루프
  const startDetectionLoop = useCallback(() => {
    let lastTime = performance.now();
    let frameCount = 0;

    const detect = () => {
      if (!videoRef.current || !canvasRef.current) {
        animationRef.current = requestAnimationFrame(detect);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx || video.readyState !== 4) {
        animationRef.current = requestAnimationFrame(detect);
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

      // FPS 계산
      frameCount++;
      if (timestamp - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = timestamp;
      }

      animationRef.current = requestAnimationFrame(detect);
    };

    detect();
  }, [addFrame]);

  // 녹화 토글
  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
      setCaptureState('ready');
    } else {
      startRecording();
      setCaptureState('recording');
    }
  }, [isRecording, startRecording, stopRecording, setCaptureState]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      stopWebcam();
    };
  }, [stopWebcam]);

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* 비디오 컨테이너 */}
      <div className="relative flex-1 bg-black rounded-lg overflow-hidden">
        {/* 비디오 */}
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          style={{ transform: 'scaleX(-1)' }} // 거울 모드
        />

        {/* 포즈 오버레이 캔버스 */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ transform: 'scaleX(-1)' }}
        />

        {/* 상태 배지 */}
        <div className="absolute top-4 left-4 flex gap-2">
          <Badge variant={isWebcamOn ? 'default' : 'secondary'}>
            {captureState === 'initializing'
              ? '초기화 중...'
              : isWebcamOn
              ? '웹캠 활성'
              : '웹캠 비활성'}
          </Badge>
          {isWebcamOn && (
            <Badge variant="outline" className="bg-black/50">
              {fps} FPS
            </Badge>
          )}
          {isRecording && (
            <Badge variant="destructive" className="animate-pulse">
              <Circle className="w-3 h-3 mr-1 fill-current" />
              녹화 중
            </Badge>
          )}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <p className="text-red-400 text-center px-4">{error}</p>
          </div>
        )}

        {/* 시작 안내 */}
        {!isWebcamOn && !error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/90">
            <div className="text-center">
              <Video className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-300 mb-4">웹캠을 시작하여 움직임을 분석하세요</p>
              <Button onClick={startWebcam} size="lg">
                <Video className="w-5 h-5 mr-2" />
                웹캠 시작
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 컨트롤 버튼 */}
      <div className="flex gap-2 mt-4">
        {isWebcamOn ? (
          <>
            <Button
              variant={isRecording ? 'destructive' : 'default'}
              onClick={toggleRecording}
              className="flex-1"
            >
              {isRecording ? (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  녹화 중지
                </>
              ) : (
                <>
                  <Circle className="w-4 h-4 mr-2" />
                  녹화 시작
                </>
              )}
            </Button>
            <Button variant="outline" onClick={stopWebcam}>
              <VideoOff className="w-4 h-4 mr-2" />
              웹캠 끄기
            </Button>
            <Button variant="ghost" onClick={reset}>
              <RotateCcw className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <Button onClick={startWebcam} className="flex-1" disabled={captureState === 'initializing'}>
            <Video className="w-4 h-4 mr-2" />
            {captureState === 'initializing' ? '초기화 중...' : '웹캠 시작'}
          </Button>
        )}
      </div>
    </div>
  );
}
