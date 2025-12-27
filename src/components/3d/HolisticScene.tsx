'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  OrbitControls,
  Grid,
  Environment,
  PerspectiveCamera,
  Stats,
} from '@react-three/drei';
import { useHolisticStore } from '@/stores/holistic-store';
import Skeleton3D from './Skeleton3D';
import { BothHands3D } from './HandMesh3D';
import FaceMesh3D from './FaceMesh3D';
import BodyMesh3D from './BodyMesh3D';
import MotionTrail from './MotionTrail';

interface HolisticSceneProps {
  showStats?: boolean;
  showGrid?: boolean;
  backgroundColor?: string;
}

function SceneContent() {
  const {
    currentFrame,
    visualizationMode,
    trackingTargets,
    frameBuffer,
  } = useHolisticStore();

  if (!currentFrame) {
    return (
      <group>
        {/* Placeholder when no data */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <meshStandardMaterial
            color="#4a5568"
            transparent
            opacity={0.3}
            wireframe
          />
        </mesh>
      </group>
    );
  }

  const showSkeleton =
    visualizationMode === 'skeleton' || visualizationMode === 'both';
  const showMesh =
    visualizationMode === 'mesh' || visualizationMode === 'both';
  const showWireframe = visualizationMode === 'wireframe';

  return (
    <group>
      {/* Pose/Body */}
      {trackingTargets.pose && currentFrame.pose && (
        <>
          {/* Skeleton visualization */}
          {showSkeleton && (
            <Skeleton3D
              landmarks={currentFrame.pose}
              color="#60a5fa"
              jointSize={0.03}
            />
          )}

          {/* Body mesh visualization */}
          {(showMesh || showWireframe) && (
            <BodyMesh3D
              landmarks={currentFrame.pose}
              showSkeleton={showWireframe}
              showMesh={showMesh}
              showJoints={showMesh}
              meshColor="#8b5cf6"
              meshType="volumetric"
              opacity={0.8}
            />
          )}

          {/* Motion trails for key joints */}
          <MotionTrail
            points={frameBuffer
              .filter((f) => f.pose && f.pose[16]) // Right wrist
              .map((f) => ({
                x: f.pose![16].x,
                y: f.pose![16].y,
                z: f.pose![16].z,
              }))}
            color="#f59e0b"
            maxPoints={60}
          />
          <MotionTrail
            points={frameBuffer
              .filter((f) => f.pose && f.pose[15]) // Left wrist
              .map((f) => ({
                x: f.pose![15].x,
                y: f.pose![15].y,
                z: f.pose![15].z,
              }))}
            color="#10b981"
            maxPoints={60}
          />
        </>
      )}

      {/* Hands */}
      {(trackingTargets.leftHand || trackingTargets.rightHand) && (
        <BothHands3D
          leftHand={trackingTargets.leftHand ? currentFrame.leftHand : null}
          rightHand={trackingTargets.rightHand ? currentFrame.rightHand : null}
          showJoints={showSkeleton || showMesh}
          showBones={showSkeleton}
          showMesh={showMesh}
          scale={3}
        />
      )}

      {/* Face */}
      {trackingTargets.face && currentFrame.face && (
        <FaceMesh3D
          landmarks={currentFrame.face}
          showWireframe={showWireframe || showSkeleton}
          showMesh={showMesh}
          showContours={true}
          showEyes={true}
          showLips={true}
          opacity={0.9}
        />
      )}
    </group>
  );
}

export default function HolisticScene({
  showStats = false,
  showGrid = true,
  backgroundColor = '#030712',
}: HolisticSceneProps) {
  return (
    <div className="w-full h-full">
      <Canvas>
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 1, 4]} fov={50} />

          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
          <directionalLight
            position={[-5, 3, -5]}
            intensity={0.5}
            color="#60a5fa"
          />
          <pointLight position={[0, 3, 2]} intensity={0.3} color="#8b5cf6" />

          {/* Environment */}
          <Environment preset="night" />

          {/* Grid */}
          {showGrid && (
            <Grid
              args={[10, 10]}
              cellSize={0.5}
              cellThickness={0.5}
              cellColor="#1e293b"
              sectionSize={2}
              sectionThickness={1}
              sectionColor="#334155"
              fadeDistance={10}
              fadeStrength={1}
              followCamera={false}
              position={[0, -1, 0]}
            />
          )}

          {/* Main content */}
          <SceneContent />

          {/* Controls */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={1}
            maxDistance={10}
            target={[0, 0.5, 0]}
          />

          {/* Background */}
          <color attach="background" args={[backgroundColor]} />

          {/* Fog */}
          <fog attach="fog" args={[backgroundColor, 5, 15]} />

          {/* Stats */}
          {showStats && <Stats />}
        </Suspense>
      </Canvas>
    </div>
  );
}

// Compact scene for embedding
export function HolisticSceneCompact() {
  return (
    <HolisticScene showStats={false} showGrid={false} backgroundColor="#0f172a" />
  );
}
