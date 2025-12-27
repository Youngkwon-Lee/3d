'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, PerspectiveCamera } from '@react-three/drei';
import { Suspense } from 'react';
import Skeleton3D from './Skeleton3D';
import MotionTrail from './MotionTrail';
import { usePoseStore } from '@/stores/pose-store';

function SceneContent() {
  const { currentFrame, trajectories, showSkeleton, showTrajectory } = usePoseStore();

  return (
    <>
      {/* 카메라 */}
      <PerspectiveCamera makeDefault position={[0, 1, 3]} fov={60} />

      {/* 조명 */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.5} />

      {/* 환경 */}
      <Environment preset="city" />

      {/* 바닥 그리드 */}
      <Grid
        position={[0, -1.5, 0]}
        args={[10, 10]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#6e6e6e"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#9d4b4b"
        fadeDistance={10}
        fadeStrength={1}
        followCamera={false}
      />

      {/* 3D 스켈레톤 */}
      {showSkeleton && currentFrame && (
        <Skeleton3D landmarks={currentFrame.landmarks} />
      )}

      {/* 움직임 궤적 */}
      {showTrajectory && trajectories.map((trajectory) => (
        <MotionTrail key={trajectory.jointIndex} trajectory={trajectory} />
      ))}

      {/* 카메라 컨트롤 */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={1}
        maxDistance={10}
        target={[0, 0, 0]}
      />
    </>
  );
}

// 로딩 표시
function Loader() {
  return (
    <mesh>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="#666" wireframe />
    </mesh>
  );
}

export default function Scene() {
  return (
    <div className="w-full h-full bg-gradient-to-b from-gray-900 to-gray-800 rounded-lg overflow-hidden">
      <Canvas shadows>
        <Suspense fallback={<Loader />}>
          <SceneContent />
        </Suspense>
      </Canvas>
    </div>
  );
}
