'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useHolisticStore } from '@/stores/holistic-store';
import {
  Home,
  Download,
  Circle,
  Square,
  Settings,
} from 'lucide-react';
import Link from 'next/link';

// 클라이언트 전용 컴포넌트 동적 import
const HolisticScene = dynamic(() => import('@/components/3d/HolisticScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-lg">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-400">Holistic 3D 엔진 로딩 중...</p>
      </div>
    </div>
  ),
});

const HolisticVideoCapture = dynamic(
  () => import('@/components/capture/HolisticVideoCapture'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg">
        <p className="text-gray-400">Holistic 캡처 모듈 로딩 중...</p>
      </div>
    ),
  }
);

const VisualizationControls = dynamic(
  () => import('@/components/controls/VisualizationControls'),
  {
    ssr: false,
    loading: () => <div className="bg-gray-900/80 rounded-xl p-4 h-48" />,
  }
);

export default function HolisticAnalyzePage() {
  const [showControls, setShowControls] = useState(true);

  const {
    isRecording,
    startRecording,
    stopRecording,
    recordedFrames,
    frameBuffer,
    currentFrame,
  } = useHolisticStore();

  // 데이터 내보내기
  const exportData = () => {
    const frames = recordedFrames.length > 0 ? recordedFrames : frameBuffer;
    if (frames.length === 0) {
      alert('분석된 데이터가 없습니다.');
      return;
    }

    const data = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        frameCount: frames.length,
        frames: frames,
      },
      null,
      2
    );

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `holistic-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 감지 상태 표시
  const detectionStatus = currentFrame
    ? {
        pose: currentFrame.pose ? '✓' : '✗',
        leftHand: currentFrame.leftHand ? '✓' : '✗',
        rightHand: currentFrame.rightHand ? '✓' : '✗',
        face: currentFrame.face ? '✓' : '✗',
      }
    : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* 헤더 */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-400 hover:text-white"
            >
              <Home className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Holistic Analyzer
            </h1>
            <Badge variant="outline" className="text-xs border-purple-500 text-purple-400">
              Pose + Hands + Face
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {/* 녹화 버튼 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={isRecording ? stopRecording : startRecording}
              className={isRecording ? 'text-red-400' : 'text-gray-400'}
            >
              {isRecording ? (
                <>
                  <Square className="w-4 h-4 mr-1" />
                  녹화 중지
                </>
              ) : (
                <>
                  <Circle className="w-4 h-4 mr-1" />
                  녹화 시작
                </>
              )}
            </Button>

            {/* 컨트롤 토글 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowControls(!showControls)}
              className={showControls ? 'text-purple-400' : 'text-gray-400'}
            >
              <Settings className="w-4 h-4 mr-1" />
              설정
            </Button>

            {/* 내보내기 */}
            <Button variant="ghost" size="sm" onClick={exportData}>
              <Download className="w-4 h-4 mr-1" />
              내보내기
            </Button>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="p-6">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-120px)]">
          {/* 왼쪽: 비디오 입력 */}
          <div className="col-span-3 flex flex-col gap-4">
            <HolisticVideoCapture />

            {/* 감지 상태 */}
            {detectionStatus && (
              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3">감지 상태</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        detectionStatus.pose === '✓'
                          ? 'text-green-400'
                          : 'text-red-400'
                      }
                    >
                      {detectionStatus.pose}
                    </span>
                    <span className="text-gray-300">포즈</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        detectionStatus.face === '✓'
                          ? 'text-green-400'
                          : 'text-red-400'
                      }
                    >
                      {detectionStatus.face}
                    </span>
                    <span className="text-gray-300">얼굴</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        detectionStatus.leftHand === '✓'
                          ? 'text-green-400'
                          : 'text-red-400'
                      }
                    >
                      {detectionStatus.leftHand}
                    </span>
                    <span className="text-gray-300">왼손</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        detectionStatus.rightHand === '✓'
                          ? 'text-green-400'
                          : 'text-red-400'
                      }
                    >
                      {detectionStatus.rightHand}
                    </span>
                    <span className="text-gray-300">오른손</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 중앙: 3D 시각화 */}
          <div className={`${showControls ? 'col-span-6' : 'col-span-9'}`}>
            <div className="h-full bg-gray-900 rounded-lg overflow-hidden relative">
              <HolisticScene showStats={false} showGrid={true} />

              {/* 3D 컨트롤 안내 */}
              <div className="absolute top-4 right-4 text-xs text-gray-500">
                마우스: 회전 | 스크롤: 줌 | Shift+드래그: 이동
              </div>

              {/* 녹화 표시 */}
              {isRecording && (
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500/20 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-400 text-sm">REC</span>
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽: 시각화 컨트롤 */}
          {showControls && (
            <div className="col-span-3 flex flex-col gap-4 overflow-y-auto">
              <VisualizationControls />

              {/* 프레임 정보 */}
              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3">분석 상태</h3>
                <div className="space-y-1 text-xs text-gray-400">
                  <div className="flex justify-between">
                    <span>버퍼 프레임</span>
                    <span className="text-white">{frameBuffer.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>녹화 프레임</span>
                    <span className="text-white">{recordedFrames.length}</span>
                  </div>
                </div>
              </div>

              {/* 사용 안내 */}
              <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-medium mb-3">Holistic 분석</h3>
                <div className="space-y-2 text-xs text-gray-400">
                  <p>• 포즈: 33개 신체 관절</p>
                  <p>• 손: 각 21개 랜드마크</p>
                  <p>• 얼굴: 468개 메쉬 포인트</p>
                  <p>• 실시간 3D 시각화</p>
                </div>
              </div>

              {/* 기본 분석 링크 */}
              <Link
                href="/analyze"
                className="text-center text-sm text-gray-400 hover:text-white transition-colors"
              >
                ← 기본 분석 모드로 돌아가기
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
