'use client';

import { useHolisticStore } from '@/stores/holistic-store';
import type { MeshVisualizationMode } from '@/types/mesh';

export default function VisualizationControls() {
  const {
    visualizationMode,
    setVisualizationMode,
    trackingTargets,
    setTrackingTargets,
  } = useHolisticStore();

  const modes: { value: MeshVisualizationMode; label: string; icon: string }[] = [
    { value: 'skeleton', label: '스켈레톤', icon: '🦴' },
    { value: 'mesh', label: '메쉬', icon: '🧬' },
    { value: 'both', label: '스켈레톤+메쉬', icon: '👤' },
    { value: 'wireframe', label: '와이어프레임', icon: '🔲' },
  ];

  const targets = [
    { key: 'pose', label: '포즈', icon: '🏃' },
    { key: 'leftHand', label: '왼손', icon: '🤚' },
    { key: 'rightHand', label: '오른손', icon: '✋' },
    { key: 'face', label: '얼굴', icon: '😊' },
  ] as const;

  return (
    <div className="bg-gray-900/80 backdrop-blur-md rounded-xl p-4 space-y-4">
      {/* Visualization Mode */}
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-2">시각화 모드</h3>
        <div className="grid grid-cols-2 gap-2">
          {modes.map((mode) => (
            <button
              key={mode.value}
              onClick={() => setVisualizationMode(mode.value)}
              className={`
                px-3 py-2 rounded-lg text-sm font-medium transition-all
                flex items-center justify-center gap-2
                ${
                  visualizationMode === mode.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }
              `}
            >
              <span>{mode.icon}</span>
              <span>{mode.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tracking Targets */}
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-2">추적 대상</h3>
        <div className="grid grid-cols-2 gap-2">
          {targets.map((target) => (
            <button
              key={target.key}
              onClick={() =>
                setTrackingTargets({
                  [target.key]: !trackingTargets[target.key],
                })
              }
              className={`
                px-3 py-2 rounded-lg text-sm font-medium transition-all
                flex items-center justify-center gap-2
                ${
                  trackingTargets[target.key]
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }
              `}
            >
              <span>{target.icon}</span>
              <span>{target.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-2">빠른 설정</h3>
        <div className="flex gap-2">
          <button
            onClick={() =>
              setTrackingTargets({
                pose: true,
                leftHand: true,
                rightHand: true,
                face: true,
              })
            }
            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-500 transition-all"
          >
            전체 선택
          </button>
          <button
            onClick={() =>
              setTrackingTargets({
                pose: true,
                leftHand: false,
                rightHand: false,
                face: false,
              })
            }
            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-gray-700 text-white hover:bg-gray-600 transition-all"
          >
            포즈만
          </button>
        </div>
      </div>
    </div>
  );
}
