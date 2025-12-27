'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePoseStore } from '@/stores/pose-store';
import { calculateJointAngles, calculateVelocity, calculateSymmetryScore } from '@/lib/analysis/kinematics';
import { Activity, Gauge, ArrowLeftRight, TrendingUp } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  status?: 'good' | 'warning' | 'bad';
}

function MetricCard({ title, value, unit, icon, status }: MetricCardProps) {
  const statusColors = {
    good: 'text-green-400',
    warning: 'text-yellow-400',
    bad: 'text-red-400',
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
      <div className="p-2 bg-gray-700/50 rounded-lg text-gray-400">{icon}</div>
      <div className="flex-1">
        <p className="text-xs text-gray-400">{title}</p>
        <p className={`text-lg font-semibold ${status ? statusColors[status] : 'text-white'}`}>
          {value}
          {unit && <span className="text-sm text-gray-400 ml-1">{unit}</span>}
        </p>
      </div>
    </div>
  );
}

export default function MetricsPanel() {
  const { currentFrame, frameBuffer, isRecording, recordedFrames } = usePoseStore();

  // 현재 관절 각도 계산
  const angles = useMemo(() => {
    if (!currentFrame) return null;
    return calculateJointAngles(currentFrame.landmarks);
  }, [currentFrame]);

  // 최근 프레임들로 속도 계산
  const velocities = useMemo(() => {
    if (frameBuffer.length < 2) return { leftWrist: 0, rightWrist: 0 };

    const recent = frameBuffer.slice(-10);
    let leftSum = 0;
    let rightSum = 0;

    for (let i = 1; i < recent.length; i++) {
      leftSum += calculateVelocity(recent[i - 1], recent[i], 15); // 왼손목
      rightSum += calculateVelocity(recent[i - 1], recent[i], 16); // 오른손목
    }

    return {
      leftWrist: leftSum / (recent.length - 1),
      rightWrist: rightSum / (recent.length - 1),
    };
  }, [frameBuffer]);

  // 대칭성 점수 계산
  const symmetryScore = useMemo(() => {
    if (!angles) return 100;
    const leftAngles = [angles.leftElbow, angles.leftShoulder, angles.leftKnee];
    const rightAngles = [angles.rightElbow, angles.rightShoulder, angles.rightKnee];
    return calculateSymmetryScore(leftAngles, rightAngles);
  }, [angles]);

  const getSymmetryStatus = (score: number): 'good' | 'warning' | 'bad' => {
    if (score >= 80) return 'good';
    if (score >= 60) return 'warning';
    return 'bad';
  };

  return (
    <Card className="bg-gray-900/50 border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white">실시간 분석</CardTitle>
          {isRecording && (
            <Badge variant="destructive" className="animate-pulse">
              {recordedFrames.length} 프레임
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 대칭성 점수 */}
        <MetricCard
          title="좌우 대칭성"
          value={symmetryScore.toFixed(0)}
          unit="%"
          icon={<ArrowLeftRight className="w-4 h-4" />}
          status={getSymmetryStatus(symmetryScore)}
        />

        {/* 손목 속도 */}
        <MetricCard
          title="왼손 속도"
          value={velocities.leftWrist.toFixed(2)}
          unit="u/s"
          icon={<Gauge className="w-4 h-4" />}
        />
        <MetricCard
          title="오른손 속도"
          value={velocities.rightWrist.toFixed(2)}
          unit="u/s"
          icon={<Gauge className="w-4 h-4" />}
        />

        {/* 관절 각도 */}
        {angles && (
          <>
            <div className="border-t border-gray-700 my-3" />
            <p className="text-xs text-gray-400 mb-2">관절 각도</p>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">왼팔꿈치</span>
                <span className="text-white">{angles.leftElbow.toFixed(0)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">오른팔꿈치</span>
                <span className="text-white">{angles.rightElbow.toFixed(0)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">왼무릎</span>
                <span className="text-white">{angles.leftKnee.toFixed(0)}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">오른무릎</span>
                <span className="text-white">{angles.rightKnee.toFixed(0)}°</span>
              </div>
            </div>
          </>
        )}

        {/* 프레임 정보 */}
        <div className="border-t border-gray-700 my-3" />
        <div className="flex justify-between text-xs text-gray-400">
          <span>버퍼: {frameBuffer.length} 프레임</span>
          <span>총: {recordedFrames.length} 녹화됨</span>
        </div>
      </CardContent>
    </Card>
  );
}
