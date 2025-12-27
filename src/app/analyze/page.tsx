'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePoseStore } from '@/stores/pose-store';
import MetricsPanel from '@/components/analysis/MetricsPanel';
import {
  Layers,
  GitBranch,
  Box,
  Home,
  Download,
  Video,
  Upload,
} from 'lucide-react';
import Link from 'next/link';

// 클라이언트 전용 컴포넌트 동적 import
const Scene = dynamic(() => import('@/components/3d/Scene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900 rounded-lg">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-400">3D 엔진 로딩 중...</p>
      </div>
    </div>
  ),
});

const WebcamCapture = dynamic(() => import('@/components/capture/WebcamCapture'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg">
      <p className="text-gray-400">캡처 모듈 로딩 중...</p>
    </div>
  ),
});

const VideoUpload = dynamic(() => import('@/components/capture/VideoUpload'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg">
      <p className="text-gray-400">비디오 모듈 로딩 중...</p>
    </div>
  ),
});

export default function AnalyzePage() {
  const [inputMode, setInputMode] = useState<'webcam' | 'video'>('video'); // 기본값을 video로 변경

  const {
    showSkeleton,
    showTrajectory,
    toggleSkeleton,
    toggleTrajectory,
    visualizationMode,
    setVisualizationMode,
    recordedFrames,
    frameBuffer,
  } = usePoseStore();

  // 데이터 내보내기
  const exportData = () => {
    const frames = recordedFrames.length > 0 ? recordedFrames : frameBuffer;
    if (frames.length === 0) {
      alert('분석된 데이터가 없습니다.');
      return;
    }

    const data = JSON.stringify({
      exportedAt: new Date().toISOString(),
      frameCount: frames.length,
      frames: frames,
    }, null, 2);

    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `motion-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* 헤더 */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white">
              <Home className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-semibold">Motion3D Analyzer</h1>
            <Badge variant="outline" className="text-xs">Beta</Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSkeleton}
              className={showSkeleton ? 'text-blue-400' : 'text-gray-400'}
            >
              <Box className="w-4 h-4 mr-1" />
              스켈레톤
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTrajectory}
              className={showTrajectory ? 'text-green-400' : 'text-gray-400'}
            >
              <GitBranch className="w-4 h-4 mr-1" />
              궤적
            </Button>
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
          {/* 왼쪽: 입력 소스 (웹캠 또는 비디오) */}
          <div className="col-span-3 flex flex-col gap-4">
            {/* 입력 모드 선택 탭 */}
            <Tabs value={inputMode} onValueChange={(v) => setInputMode(v as 'webcam' | 'video')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="video" className="text-xs">
                  <Upload className="w-3 h-3 mr-1" />
                  비디오
                </TabsTrigger>
                <TabsTrigger value="webcam" className="text-xs">
                  <Video className="w-3 h-3 mr-1" />
                  웹캠
                </TabsTrigger>
              </TabsList>

              <TabsContent value="webcam" className="flex-1 mt-4">
                <div className="h-[calc(100vh-280px)]">
                  <WebcamCapture />
                </div>
              </TabsContent>

              <TabsContent value="video" className="flex-1 mt-4">
                <div className="h-[calc(100vh-280px)]">
                  <VideoUpload />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* 중앙: 3D 시각화 */}
          <div className="col-span-6">
            <div className="h-full bg-gray-900 rounded-lg overflow-hidden relative">
              <Scene />

              {/* 시각화 모드 선택 */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <Tabs
                  value={visualizationMode}
                  onValueChange={(v) => setVisualizationMode(v as any)}
                  className="bg-gray-800/80 rounded-lg p-1"
                >
                  <TabsList className="bg-transparent">
                    <TabsTrigger value="skeleton" className="text-xs">
                      스켈레톤
                    </TabsTrigger>
                    <TabsTrigger value="trajectory" className="text-xs">
                      궤적
                    </TabsTrigger>
                    <TabsTrigger value="both" className="text-xs">
                      모두
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* 3D 컨트롤 안내 */}
              <div className="absolute top-4 right-4 text-xs text-gray-500">
                마우스: 회전 | 스크롤: 줌 | Shift+드래그: 이동
              </div>
            </div>
          </div>

          {/* 오른쪽: 분석 패널 */}
          <div className="col-span-3 flex flex-col gap-4 overflow-y-auto">
            <MetricsPanel />

            {/* 추적 관절 설정 */}
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                추적 관절
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { label: '왼손목', color: 'bg-red-500' },
                  { label: '오른손목', color: 'bg-cyan-500' },
                  { label: '왼발목', color: 'bg-orange-500' },
                  { label: '오른발목', color: 'bg-blue-500' },
                ].map((joint, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${joint.color}`} />
                    <span className="text-gray-300">{joint.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 사용 안내 */}
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-medium mb-3">사용 방법</h3>
              <div className="space-y-2 text-xs text-gray-400">
                <p>1. 비디오 파일을 업로드하거나 웹캠을 사용</p>
                <p>2. 재생하면 자동으로 포즈 분석 시작</p>
                <p>3. 3D 뷰에서 스켈레톤과 궤적 확인</p>
                <p>4. 분석 결과를 JSON으로 내보내기</p>
              </div>
            </div>

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
          </div>
        </div>
      </main>
    </div>
  );
}
