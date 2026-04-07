import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stage, Environment, Float, MeshDistortMaterial, MeshWobbleMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface ModelProps {
  type: 'skeleton' | 'engine' | 'cell' | 'solar_system';
}

const Skeleton = () => {
  return (
    <group scale={0.5}>
      {/* Skull */}
      <mesh position={[0, 3.5, 0]}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial color="#f5f5dc" roughness={0.8} />
      </mesh>
      {/* Jaw */}
      <mesh position={[0, 3.1, 0.2]}>
        <boxGeometry args={[0.5, 0.3, 0.4]} />
        <meshStandardMaterial color="#f5f5dc" roughness={0.8} />
      </mesh>
      
      {/* Spine */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 3, 8]} />
        <meshStandardMaterial color="#f5f5dc" roughness={0.8} />
      </mesh>
      
      {/* Ribcage */}
      {[2.8, 2.5, 2.2, 1.9, 1.6].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.7 - i * 0.05, 0.05, 16, 32, Math.PI]} />
          <meshStandardMaterial color="#f5f5dc" roughness={0.8} />
        </mesh>
      ))}
      
      {/* Pelvis */}
      <mesh position={[0, 0.2, 0]}>
        <torusGeometry args={[0.4, 0.15, 16, 32]} />
        <meshStandardMaterial color="#f5f5dc" roughness={0.8} />
      </mesh>
      
      {/* Arms */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.8, 2.8, 0]}>
          {/* Humerus */}
          <mesh position={[0, -0.6, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 1.2, 8]} />
            <meshStandardMaterial color="#f5f5dc" />
          </mesh>
          {/* Radius/Ulna */}
          <mesh position={[0, -1.8, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 1.2, 8]} />
            <meshStandardMaterial color="#f5f5dc" />
          </mesh>
        </group>
      ))}
      
      {/* Legs */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.3, 0, 0]}>
          {/* Femur */}
          <mesh position={[0, -0.8, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 1.6, 8]} />
            <meshStandardMaterial color="#f5f5dc" />
          </mesh>
          {/* Tibia/Fibula */}
          <mesh position={[0, -2.4, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 1.6, 8]} />
            <meshStandardMaterial color="#f5f5dc" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

const Engine = () => {
  const piston1 = useRef<THREE.Mesh>(null);
  const piston2 = useRef<THREE.Mesh>(null);
  const crank = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * 5;
    if (piston1.current) piston1.current.position.y = Math.sin(t) * 0.4 + 0.5;
    if (piston2.current) piston2.current.position.y = Math.sin(t + Math.PI) * 0.4 + 0.5;
    if (crank.current) crank.current.rotation.z = t;
  });

  return (
    <group scale={0.8}>
      {/* Engine Block */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[2, 1, 1.5]} />
        <meshStandardMaterial color="#333" metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* Cylinder Heads */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[1.8, 0.4, 1.3]} />
        <meshStandardMaterial color="#555" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Pistons */}
      <mesh ref={piston1} position={[-0.5, 0.5, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.6, 32]} />
        <meshStandardMaterial color="#aaa" metalness={1} roughness={0.1} />
      </mesh>
      <mesh ref={piston2} position={[0.5, 0.5, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.6, 32]} />
        <meshStandardMaterial color="#aaa" metalness={1} roughness={0.1} />
      </mesh>
      
      {/* Crankshaft */}
      <group ref={crank} position={[0, -0.3, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 2.2, 16]} />
          <meshStandardMaterial color="#777" metalness={1} />
        </mesh>
        {/* Counterweights */}
        {[-0.5, 0.5].map((x, i) => (
          <mesh key={i} position={[x, 0.2 * (i === 0 ? 1 : -1), 0]}>
            <boxGeometry args={[0.2, 0.5, 0.4]} />
            <meshStandardMaterial color="#444" metalness={1} />
          </mesh>
        ))}
      </group>
      
      {/* Exhaust Manifold */}
      <mesh position={[0, 0.3, 0.8]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 1.8, 16]} />
        <meshStandardMaterial color="#222" metalness={0.5} />
      </mesh>
    </group>
  );
};

const Cell = () => {
  return (
    <group>
      {/* Cell Membrane */}
      <mesh>
        <sphereGeometry args={[1.5, 64, 64]} />
        <meshStandardMaterial 
          color="#88ff88" 
          transparent 
          opacity={0.3} 
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Nucleus */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh scale={0.5}>
          <sphereGeometry args={[1, 32, 32]} />
          <MeshDistortMaterial color="#ff00ff" speed={2} distort={0.3} />
        </mesh>
      </Float>
      
      {/* Mitochondria */}
      {[1, 2, 3].map((i) => (
        <Float key={i} speed={1.5} position={[Math.sin(i) * 1, Math.cos(i) * 1, 0]}>
          <mesh scale={0.2}>
            <capsuleGeometry args={[0.5, 1, 4, 16]} />
            <meshStandardMaterial color="#ff8800" />
          </mesh>
        </Float>
      ))}
      
      {/* Ribosomes */}
      {Array.from({ length: 20 }).map((_, i) => (
        <mesh 
          key={i} 
          position={[
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
          ]} 
          scale={0.03}
        >
          <sphereGeometry args={[1, 8, 8]} />
          <meshStandardMaterial color="white" />
        </mesh>
      ))}
    </group>
  );
};

const SolarSystem = () => {
  const planetsRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (planetsRef.current) {
      planetsRef.current.children.forEach((child, i) => {
        const speed = 0.5 / (i + 1);
        const dist = (i + 1) * 1.2;
        const t = state.clock.getElapsedTime() * speed;
        child.position.x = Math.cos(t) * dist;
        child.position.z = Math.sin(t) * dist;
      });
    }
  });

  return (
    <group>
      {/* Sun */}
      <mesh>
        <sphereGeometry args={[0.8, 32, 32]} />
        <meshStandardMaterial 
          color="#ffcc00" 
          emissive="#ff6600" 
          emissiveIntensity={2} 
        />
        <pointLight intensity={2} distance={20} />
      </mesh>
      
      <group ref={planetsRef}>
        {/* Mercury */}
        <mesh scale={0.15}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#aaaaaa" />
        </mesh>
        {/* Venus */}
        <mesh scale={0.25}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#e3bb76" />
        </mesh>
        {/* Earth */}
        <mesh scale={0.28}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#2233ff" />
          {/* Moon */}
          <mesh position={[1.5, 0, 0]} scale={0.3}>
            <sphereGeometry args={[1, 8, 8]} />
            <meshStandardMaterial color="#cccccc" />
          </mesh>
        </mesh>
        {/* Mars */}
        <mesh scale={0.2}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#ff3300" />
        </mesh>
      </group>
      
      {/* Orbit Rings */}
      {[1.2, 2.4, 3.6, 4.8].map((dist, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[dist, dist + 0.02, 64]} />
          <meshBasicMaterial color="#333" transparent opacity={0.5} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
};

export const ModelViewer: React.FC<ModelProps> = ({ type }) => {
  const orbitRef = useRef<any>(null);

  const resetView = () => {
    if (orbitRef.current) {
      orbitRef.current.reset();
    }
  };

  return (
    <div className="w-full h-[400px] bg-slate-950 rounded-xl overflow-hidden shadow-2xl border border-slate-800 relative group">
      <Canvas shadows camera={{ position: [0, 5, 10], fov: 45 }}>
        <color attach="background" args={['#020617']} />
        <Suspense fallback={null}>
          <Stage environment="night" intensity={0.5} shadows="contact">
            {type === 'skeleton' && <Skeleton />}
            {type === 'engine' && <Engine />}
            {type === 'cell' && <Cell />}
            {type === 'solar_system' && <SolarSystem />}
          </Stage>
          <OrbitControls 
            ref={orbitRef}
            makeDefault 
            minDistance={2} 
            maxDistance={20} 
            enableDamping={true}
            dampingFactor={0.05}
            rotateSpeed={0.5}
          />
          <Environment preset="night" />
        </Suspense>
      </Canvas>
      <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
        <div className="bg-indigo-600/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-indigo-400 border border-indigo-500/30 uppercase tracking-tighter">
          High Detail
        </div>
        <button 
          onClick={resetView}
          className="bg-white/10 hover:bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-bold text-white border border-white/10 uppercase transition-all"
        >
          Reset View
        </button>
      </div>
      <div className="absolute bottom-4 left-4 flex flex-col gap-2">
        <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl text-xs text-white border border-white/10 flex items-center gap-3">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          Interactive 3D {type.replace('_', ' ')}
        </div>
        <div className="bg-white/5 backdrop-blur-sm px-3 py-1.5 rounded-xl text-[10px] text-slate-400 border border-white/5 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <span>🖱️ Left: Rotate</span>
          <span>🖱️ Right: Pan</span>
          <span>🖱️ Scroll: Zoom</span>
        </div>
      </div>
    </div>
  );
};

