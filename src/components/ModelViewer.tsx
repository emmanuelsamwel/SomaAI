import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stage, Environment, Float, MeshDistortMaterial, MeshWobbleMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface ModelProps {
  type: 'skeleton' | 'engine' | 'cell' | 'solar_system' | 'heart' | 'brain';
}

const Heart = () => {
  const heartRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // Anatomical "lub-dub" beating rhythm
    const pulse = Math.pow(Math.sin(t * 2.5), 2) * 0.06 + Math.pow(Math.sin(t * 2.5 + 0.3), 4) * 0.03;
    const scale = 1 + pulse;
    if (heartRef.current) {
      heartRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group ref={heartRef} scale={0.8}>
      {/* Left Ventricle - Main muscular body */}
      <mesh position={[-0.1, -0.2, 0]} rotation={[0, 0, 0.1]}>
        <sphereGeometry args={[0.7, 32, 32]} />
        <MeshDistortMaterial 
          color="#a01a1a" 
          speed={2} 
          distort={0.25} 
          roughness={0.4} 
          metalness={0.1}
        />
      </mesh>
      
      {/* Right Ventricle */}
      <mesh position={[0.3, -0.1, 0]} rotation={[0, 0, -0.2]}>
        <sphereGeometry args={[0.55, 32, 32]} />
        <MeshDistortMaterial 
          color="#8b1515" 
          speed={2} 
          distort={0.2} 
          roughness={0.4} 
        />
      </mesh>

      {/* Atria (Top chambers) */}
      <mesh position={[-0.1, 0.4, 0]}>
        <sphereGeometry args={[0.4, 32, 32]} />
        <meshStandardMaterial color="#7b1111" roughness={0.5} />
      </mesh>
      <mesh position={[0.3, 0.3, 0]}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial color="#6b0e0e" roughness={0.5} />
      </mesh>

      {/* Aorta (Arching artery) */}
      <mesh position={[-0.1, 0.8, -0.1]} rotation={[0.4, 0.2, 0.2]}>
        <torusGeometry args={[0.35, 0.12, 16, 32, Math.PI * 1.2]} />
        <meshStandardMaterial color="#9e1b1b" metalness={0.2} />
      </mesh>
      
      {/* Pulmonary Artery (Blueish) */}
      <mesh position={[0.1, 0.6, 0.2]} rotation={[-0.2, 0, 0.5]}>
        <cylinderGeometry args={[0.12, 0.12, 0.8, 16]} />
        <meshStandardMaterial color="#1a4a8e" />
      </mesh>

      {/* Vena Cava (Large vein) */}
      <mesh position={[0.45, 0.6, -0.1]}>
        <cylinderGeometry args={[0.1, 0.1, 1, 16]} />
        <meshStandardMaterial color="#0d47a1" />
      </mesh>

      {/* Coronary Arteries/Veins (Surface details) */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0.1, -0.2, 0.6]} rotation={[0, 0, i * 1.5]}>
          <cylinderGeometry args={[0.01, 0.01, 0.8, 8]} />
          <meshStandardMaterial color="#1565c0" transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
};

const Brain = () => {
  return (
    <group scale={0.8}>
      {/* Left Hemisphere */}
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.2}>
        <mesh position={[-0.35, 0, 0]}>
          <sphereGeometry args={[0.7, 32, 32]} />
          <MeshDistortMaterial color="#f8bbd0" speed={1.5} distort={0.2} roughness={0.4} />
        </mesh>
      </Float>
      {/* Right Hemisphere */}
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.2}>
        <mesh position={[0.35, 0, 0]}>
          <sphereGeometry args={[0.7, 32, 32]} />
          <MeshDistortMaterial color="#f48fb1" speed={1.5} distort={0.2} roughness={0.4} />
        </mesh>
      </Float>
      {/* Cerebellum */}
      <mesh position={[0, -0.5, -0.3]}>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color="#ad1457" />
      </mesh>
      {/* Brain Stem */}
      <mesh position={[0, -0.8, -0.2]} rotation={[0.2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.1, 0.6, 16]} />
        <meshStandardMaterial color="#880e4f" />
      </mesh>
    </group>
  );
};

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
  const pistons = useRef<(THREE.Group | null)[]>([]);
  const crankshaft = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * 6;
    if (crankshaft.current) crankshaft.current.rotation.z = t;
    
    pistons.current.forEach((piston, i) => {
      if (piston) {
        // V8 firing order simulation with offsets
        const bank = Math.floor(i / 4);
        const posInBank = i % 4;
        const offset = posInBank * (Math.PI / 2) + (bank * Math.PI / 4);
        // Move along the V-axis
        piston.position.y = Math.sin(t + offset) * 0.35 + 0.4;
      }
    });
  });

  return (
    <group scale={0.7} rotation={[0, -Math.PI / 2, 0]}>
      {/* Main Engine Block (V-Shape) */}
      <mesh position={[0, -0.2, 0]}>
        <boxGeometry args={[2.5, 0.8, 1.2]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Crankshaft Case */}
      <mesh position={[0, -0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.4, 0.4, 2.6, 16]} />
        <meshStandardMaterial color="#222" metalness={0.9} />
      </mesh>

      {/* Crankshaft */}
      <group ref={crankshaft} position={[0, -0.6, 0]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 2.8, 16]} />
          <meshStandardMaterial color="#888" metalness={1} />
        </mesh>
        {/* Counterweights */}
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[(i - 1.5) * 0.6, 0.2, 0]} rotation={[i * Math.PI / 2, 0, 0]}>
            <boxGeometry args={[0.15, 0.4, 0.3]} />
            <meshStandardMaterial color="#444" metalness={1} />
          </mesh>
        ))}
      </group>

      {/* Cylinder Banks (V-Arrangement) */}
      {[-1, 1].map((side) => (
        <group key={side} rotation={[side * Math.PI / 4, 0, 0]} position={[0, 0.2, side * 0.3]}>
          {/* Bank Block */}
          <mesh position={[0, 0.4, 0]}>
            <boxGeometry args={[2.4, 0.8, 0.6]} />
            <meshStandardMaterial color="#2a2a2a" metalness={0.7} />
          </mesh>
          
          {/* Pistons */}
          {[0, 1, 2, 3].map((i) => (
            <group 
              key={i} 
              position={[(i - 1.5) * 0.6, 0, 0]}
              ref={(el) => (pistons.current[side === -1 ? i : i + 4] = el)}
            >
              <mesh>
                <cylinderGeometry args={[0.22, 0.22, 0.4, 32]} />
                <meshStandardMaterial color="#ccc" metalness={1} roughness={0.1} />
              </mesh>
            </group>
          ))}
          
          {/* Valve Covers */}
          <mesh position={[0, 0.85, 0]}>
            <boxGeometry args={[2.5, 0.2, 0.7]} />
            <meshStandardMaterial color="#c00" metalness={0.5} roughness={0.3} />
          </mesh>

          {/* Exhaust Headers */}
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[(i - 1.5) * 0.6, 0.4, side * 0.4]} rotation={[side * Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.15, 0.05, 8, 16, Math.PI / 2]} />
              <meshStandardMaterial color="#444" metalness={0.8} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Intake Manifold (Center of the V) */}
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[2, 0.3, 0.5]} />
        <meshStandardMaterial color="#333" />
      </mesh>

      {/* Air Filter / Supercharger */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[1.2, 0.4, 0.8]} />
        <meshStandardMaterial color="#555" metalness={0.9} />
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
            {type === 'heart' && <Heart />}
            {type === 'brain' && <Brain />}
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

