'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Video,
  Box,
  GitBranch,
  BarChart3,
  ArrowRight,
  Sparkles,
  Heart,
  Dumbbell,
  Users
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-6 py-24">
          <div className="text-center">
            <Badge variant="outline" className="mb-6 text-blue-400 border-blue-400/30">
              <Sparkles className="w-3 h-3 mr-1" />
              3D Motion Analysis Platform
            </Badge>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-blue-400 bg-clip-text text-transparent">
              Motion3D
            </h1>

            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
              웹캠만으로 실시간 3D 움직임 분석.<br />
              의료, 스포츠, 자세 교정을 위한 차세대 솔루션.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/analyze">
                <Button size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700">
                  <Activity className="w-5 h-5" />
                  분석 시작하기
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="gap-2">
                <Video className="w-5 h-5" />
                데모 보기
              </Button>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-6 max-w-3xl mx-auto">
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Box className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="font-medium mb-1">3D 스켈레톤</h3>
              <p className="text-sm text-gray-500">실시간 렌더링</p>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <GitBranch className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="font-medium mb-1">움직임 궤적</h3>
              <p className="text-sm text-gray-500">경로 시각화</p>
            </div>
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6 text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="font-medium mb-1">분석 메트릭</h3>
              <p className="text-sm text-gray-500">관절 각도/속도</p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-24 border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">활용 분야</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group bg-gray-900/30 border border-gray-800 rounded-2xl p-8 hover:border-red-500/50 transition-colors">
              <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center mb-6">
                <Heart className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">의료 / 재활</h3>
              <p className="text-gray-400 mb-4">파킨슨병 떨림 분석, 재활 치료 진행 추적</p>
            </div>
            <div className="group bg-gray-900/30 border border-gray-800 rounded-2xl p-8 hover:border-blue-500/50 transition-colors">
              <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
                <Dumbbell className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">스포츠 / 피트니스</h3>
              <p className="text-gray-400 mb-4">운동 폼 분석, 실시간 피드백</p>
            </div>
            <div className="group bg-gray-900/30 border border-gray-800 rounded-2xl p-8 hover:border-green-500/50 transition-colors">
              <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3">자세 교정</h3>
              <p className="text-gray-400 mb-4">좌우 대칭성 분석, 자세 모니터링</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-gray-800">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">지금 바로 시작하세요</h2>
          <p className="text-gray-400 mb-8">별도 설치 없이 웹 브라우저에서 바로 사용 가능합니다.</p>
          <Link href="/analyze">
            <Button size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700">
              <Activity className="w-5 h-5" />
              무료로 시작하기
            </Button>
          </Link>
        </div>
      </section>

      <footer className="py-8 border-t border-gray-800 text-center text-gray-500 text-sm">
        <p>Motion3D - 3D Motion Analysis Platform</p>
      </footer>
    </div>
  );
}
