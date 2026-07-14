// ─── Interactive 3D Real House Game-Like Twin ───────────────────────────────
// React Three Fiber simulator for solar orientation efficiency analysis.
// Features a dynamic changing skybox (sunrise/sunset/day/night), night stars,
// glowing sun/moon, streetlamps with light beams, window indoor lights,
// animated chimney smoke, white picket fence, mailbox, swimming pool, and trees.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { Sun, Bolt, Sparkles, Home, Car, Leaf, DollarSign, Clock, Trees } from 'lucide-react';
import { useCitizen } from '../../contexts/CitizenContext';

type RoofFace = 'South' | 'North' | 'East' | 'West';

// Slanted panel normals for the 4 roof faces
const roofNormals: Record<RoofFace, THREE.Vector3> = {
  South: new THREE.Vector3(0, 0.707, 0.707).normalize(),
  North: new THREE.Vector3(0, 0.707, -0.707).normalize(),
  East: new THREE.Vector3(0.707, 0.707, 0).normalize(),
  West: new THREE.Vector3(-0.707, 0.707, 0).normalize(),
};

// Panel 3D transformations snapped on each roof face
const panelTransforms: Record<RoofFace, { pos: [number, number, number]; rot: [number, number, number]; size: [number, number, number] }> = {
  South: { pos: [0, 1.45, 0.55], rot: [Math.PI / 4, 0, 0], size: [1.2, 0.03, 0.8] },
  North: { pos: [0, 1.45, -0.55], rot: [-Math.PI / 4, 0, 0], size: [1.2, 0.03, 0.8] },
  East: { pos: [0.55, 1.45, 0], rot: [0, 0, -Math.PI / 4], size: [0.8, 0.03, 1.2] },
  West: { pos: [-0.55, 1.45, 0], rot: [0, 0, Math.PI / 4], size: [0.8, 0.03, 1.2] },
};

// ─── Sub-Component: Cable Wire between points ────────────────────────────────
function CableWire({ start, end }: { start: [number, number, number]; end: [number, number, number] }) {
  const points = useMemo(() => {
    return [new THREE.Vector3(...start), new THREE.Vector3(...end)];
  }, [start, end]);

  const mid = new THREE.Vector3().addVectors(points[0], points[1]).multiplyScalar(0.5);
  const distance = points[0].distanceTo(points[1]);
  const direction = new THREE.Vector3().subVectors(points[1], points[0]).normalize();
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);

  return (
    <mesh position={mid} quaternion={quaternion}>
      <cylinderGeometry args={[0.012, 0.012, distance, 6]} />
      <meshBasicMaterial color="#333333" transparent opacity={0.6} />
    </mesh>
  );
}

// ─── Sub-Component: Animated Particle Flow ──────────────────────────────────
interface FlowLineProps {
  start: [number, number, number];
  end: [number, number, number];
  color: string;
  active: boolean;
  speed?: number;
  count?: number;
}

function EnergyFlowLine({ start, end, color, active, speed = 1.8, count = 3 }: FlowLineProps) {
  const points = useMemo(() => {
    const sVec = new THREE.Vector3(...start);
    const eVec = new THREE.Vector3(...end);
    const p = [];
    for (let i = 0; i < count; i++) {
      p.push({ offset: i / count });
    }
    return { sVec, eVec, particles: p };
  }, [start, end, count]);

  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!active || !groupRef.current) return;
    const time = state.clock.getElapsedTime() * speed;
    const meshes = groupRef.current.children;
    points.particles.forEach((p, idx) => {
      const mesh = meshes[idx] as THREE.Mesh;
      if (mesh) {
        const progress = (time + p.offset) % 1;
        mesh.position.copy(points.sVec).lerp(points.eVec, progress);
      }
    });
  });

  if (!active) return null;

  return (
    <group ref={groupRef}>
      {points.particles.map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Sub-Component: AC Heat Pump Unit (HVAC) with Spinning Fan ────────────────
function ACHeatPump({ position, active }: { position: [number, number, number]; active: boolean }) {
  const fanRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (active && fanRef.current) {
      fanRef.current.rotation.y += delta * 15;
    }
  });

  return (
    <group position={position}>
      {/* Outer casing box */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.35, 0.45, 0.35]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.5} />
      </mesh>
      {/* Front fan grill */}
      <mesh position={[0, 0, 0.181]}>
        <boxGeometry args={[0.28, 0.28, 0.01]} />
        <meshStandardMaterial color="#475569" roughness={0.8} />
      </mesh>
      {/* Internal fan blade */}
      <mesh ref={fanRef} position={[0, 0, 0.19]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.24, 0.02, 0.04]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>
    </group>
  );
}

// ─── Sub-Component: Chimney Smoke Particle Puffing ───────────────────────────
function ChimneySmoke({ position, active }: { position: [number, number, number]; active: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const particles = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => ({
      id: i,
      offset: i * 0.16,
    }));
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime() * 0.9;
    const children = groupRef.current.children;
    particles.forEach((p, idx) => {
      const mesh = children[idx] as THREE.Mesh;
      if (mesh) {
        if (!active) {
          mesh.scale.setScalar(0);
          return;
        }
        const progress = (time + p.offset) % 1;
        mesh.position.y = progress * 1.1;
        mesh.position.x = Math.sin(time * 3 + p.id) * 0.06 * progress;
        mesh.position.z = Math.cos(time * 2.5 + p.id) * 0.06 * progress;
        const scale = 0.02 + progress * 0.1;
        mesh.scale.setScalar(scale);
        const mat = mesh.material as THREE.MeshBasicMaterial;
        if (mat) {
          mat.opacity = (1 - progress) * 0.35;
        }
      }
    });
  });

  return (
    <group ref={groupRef} position={position}>
      {particles.map((p) => (
        <mesh key={p.id}>
          <sphereGeometry args={[0.8, 6, 6]} />
          <meshBasicMaterial color="#e2e8f0" transparent opacity={0.35} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Sub-Component: Street Lamp with Night Light Cone ────────────────────────
function StreetLamp({ position, isNight }: { position: [number, number, number]; isNight: boolean }) {
  return (
    <group position={position}>
      {/* Main post */}
      <mesh castShadow position={[0, 1.1, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 2.2, 8]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Arm outreach */}
      <mesh castShadow position={[0.2, 2.15, 0]}>
        <boxGeometry args={[0.4, 0.05, 0.05]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      {/* Lamp Head */}
      <mesh position={[0.38, 2.1, 0]}>
        <boxGeometry args={[0.16, 0.08, 0.12]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      {/* Yellow Glowing Bulb */}
      <mesh position={[0.38, 2.05, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color={isNight ? "#fbbf24" : "#cbd5e1"} />
      </mesh>

      {/* SpotLight for casting shadows at night */}
      {isNight && (
        <spotLight
          position={[0.38, 2.05, 0]}
          target-position={[0.38, 0, 0]}
          intensity={3}
          angle={Math.PI / 4}
          penumbra={0.6}
          castShadow
        />
      )}

      {/* Semi-transparent Light Cone (Atmospheric dust effect) */}
      {isNight && (
        <mesh position={[0.38, 1.05, 0]}>
          <coneGeometry args={[0.55, 2.0, 16, 1, true]} />
          <meshBasicMaterial
            color="#fbbf24"
            transparent
            opacity={0.12}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

// ─── Sub-Component: Low-Poly EV Car ──────────────────────────────────────────
function LowPolyEVCar({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Lower chassis box */}
      <mesh position={[0, 0.12, 0]} castShadow>
        <boxGeometry args={[0.65, 0.16, 1.25]} />
        <meshStandardMaterial color="#bf00ff" roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Upper cabin box */}
      <mesh position={[0, 0.28, -0.08]} castShadow>
        <boxGeometry args={[0.55, 0.18, 0.65]} />
        <meshStandardMaterial color="#0f172a" roughness={0.1} />
      </mesh>
      {/* Front Windshield overlay */}
      <mesh position={[0, 0.28, 0.25]} rotation={[-Math.PI / 6, 0, 0]}>
        <planeGeometry args={[0.5, 0.2]} />
        <meshBasicMaterial color="#a5f3fc" transparent opacity={0.6} />
      </mesh>
      {/* Wheels */}
      {[-0.32, 0.32].map((x, i) =>
        [-0.35, 0.35].map((z, j) => (
          <mesh key={`${i}-${j}`} position={[x, 0.08, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.09, 0.09, 0.08, 12]} />
            <meshStandardMaterial color="#111111" roughness={0.9} />
          </mesh>
        ))
      )}
    </group>
  );
}

// ─── Sub-Component: Low-Poly Tree ────────────────────────────────────────────
function LowPolyTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.1, 0.8, 8]} />
        <meshStandardMaterial color="#5c4033" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.1, 0]} castShadow>
        <coneGeometry args={[0.55, 1.0, 8]} />
        <meshStandardMaterial color="#1b4332" roughness={0.8} />
      </mesh>
    </group>
  );
}

// ─── Sub-Component: White Picket Fence ────────────────────────────────────────
function PicketFence({ position, rotation, length = 4 }: { position: [number, number, number]; rotation: [number, number, number]; length?: number }) {
  const posts = useMemo(() => {
    const arr = [];
    const spacing = 0.4;
    for (let i = 0; i < length; i++) {
      arr.push(i * spacing - (length * spacing) / 2);
    }
    return arr;
  }, [length]);

  return (
    <group position={position} rotation={rotation}>
      {/* Horizontal rails */}
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[length * 0.4, 0.02, 0.02]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[length * 0.4, 0.02, 0.02]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>
      {/* Vertical pickets */}
      {posts.map((x, idx) => (
        <mesh key={idx} position={[x, 0.25, 0.01]} castShadow>
          <boxGeometry args={[0.03, 0.45, 0.02]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Sub-Component: Swimming Pool ─────────────────────────────────────────────
function BackyardPool({ position }: { position: [number, number, number] }) {
  const waterRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (waterRef.current) {
      // Create a nice floating ripple wave effect
      const t = state.clock.getElapsedTime();
      waterRef.current.scale.y = 1 + Math.sin(t * 1.5) * 0.02;
      waterRef.current.scale.x = 1 + Math.cos(t * 1.2) * 0.015;
    }
  });

  return (
    <group position={position}>
      {/* Concrete Rim */}
      <mesh position={[0, 0.002, 0]} receiveShadow>
        <boxGeometry args={[2.0, 0.005, 1.4]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.7} />
      </mesh>
      {/* Water Plane */}
      <mesh ref={waterRef} position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.85, 1.25]} />
        <meshStandardMaterial color="#0284c7" roughness={0.1} metalness={0.9} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Interactive3DHouse() {
  const citizen = useCitizen();
  const {
    timeOfDay,
    setTimeOfDay,
    selectedFace,
    setSelectedFace,
    evEnabled,
    setEvEnabled,
    hvacEnabled,
    setHvacEnabled,
    lightsOn,
    setLightsOn,
    targetTemp,
    setTargetTemp,
    solarCapacity,
    setSolarCapacity,
    batteryEnabled,
    setBatteryEnabled,
  } = citizen;

  const calculations = citizen;

  // ─── Mathematical Computations ─────────────────────────────────────────────
  
  // Calculate sun angle and vector position
  const sunPosition = useMemo(() => {
    const angle = ((timeOfDay - 6) / 24) * 2 * Math.PI;
    const radius = 8;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius; // y > 0 is day
    const z = 2.0; 
    return { pos: [x, y, z] as [number, number, number], yDirection: y };
  }, [timeOfDay]);

  const isNight = useMemo(() => {
    return sunPosition.yDirection <= 0;
  }, [sunPosition]);

  // Compute game sky color box
  const skyColor = useMemo(() => {
    // Night
    if (timeOfDay < 5 || timeOfDay >= 19.5) return '#020617';
    
    // Sunrise (5 AM to 6.5 AM)
    if (timeOfDay >= 5 && timeOfDay < 6.5) {
      const t = (timeOfDay - 5) / 1.5;
      const c1 = new THREE.Color('#020617');
      const c2 = new THREE.Color('#f97316');
      return '#' + c1.clone().lerp(c2, t).getHexString();
    }
    
    // Morning transit (6.5 AM to 8 AM)
    if (timeOfDay >= 6.5 && timeOfDay < 8) {
      const t = (timeOfDay - 6.5) / 1.5;
      const c1 = new THREE.Color('#f97316');
      const c2 = new THREE.Color('#0ea5e9');
      return '#' + c1.clone().lerp(c2, t).getHexString();
    }
    
    // Broad daylight (8 AM to 5 PM)
    if (timeOfDay >= 8 && timeOfDay < 17) return '#38bdf8';
    
    // Sunset (5 PM to 7 PM)
    if (timeOfDay >= 17 && timeOfDay < 19) {
      const t = (timeOfDay - 17) / 2.0;
      const c1 = new THREE.Color('#38bdf8');
      const c2 = new THREE.Color('#ec4899');
      return '#' + c1.clone().lerp(c2, t).getHexString();
    }
    
    // Sunset transit (7 PM to 7.5 PM)
    const t = (timeOfDay - 19) / 0.5;
    const c1 = new THREE.Color('#ec4899');
    const c2 = new THREE.Color('#020617');
    return '#' + c1.clone().lerp(c2, t).getHexString();
  }, [timeOfDay]);

  const timeString = useMemo(() => {
    const hours = Math.floor(timeOfDay);
    const minutes = Math.floor((timeOfDay % 1) * 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }, [timeOfDay]);

  // Wire node coordinates (with offsets matching parent group translation)
  // House origin is group [0, -0.5, 0]
  const coordinates = useMemo(() => {
    const pPos = panelTransforms[selectedFace].pos;
    return {
      solarPanel: [pPos[0], pPos[1] - 0.5, pPos[2]] as [number, number, number],
      breakerPanel: [0.91, -0.3, 0.2] as [number, number, number],
      evChargerPlug: [0.91, -0.2, 0.6] as [number, number, number],
      evCarPort: [1.6, -0.4, 0.6] as [number, number, number],
      hvacUnit: [-1.15, -0.35, -0.5] as [number, number, number],
      utilityPole: [-2.5, 2.7, 2.5] as [number, number, number],
      serviceEntranceDrop: [0.91, 0.5, -0.4] as [number, number, number],
      batteryPack: [1.75, -0.2, -0.2] as [number, number, number],
    };
  }, [selectedFace]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* 3D Scene viewport (2 cols on large screens) */}
      <div className="xl:col-span-2 relative h-[420px] rounded-2xl border border-white/10 overflow-hidden shadow-inner">
        
        {/* Render Canvas */}
        <Canvas camera={{ position: [6.5, 4.5, 6.5], fov: 38 }} shadows>
          {/* Dynamic Sky Color */}
          <color attach="background" args={[skyColor]} />
          
          <ambientLight intensity={sunPosition.yDirection > 0 ? 0.35 : 0.05} />
          
          {/* Active sun light source */}
          {sunPosition.yDirection > 0 && (
            <directionalLight
              position={sunPosition.pos}
              intensity={1.8}
              castShadow
              shadow-mapSize-width={1024}
              shadow-mapSize-height={1024}
            />
          )}

          {/* Twinkling stars in the night sky */}
          {isNight && (
            <Stars
              radius={80}
              depth={20}
              count={350}
              factor={3.5}
              saturation={0.5}
              fade
              speed={2.0}
            />
          )}

          {/* Glowing Sun helper mesh */}
          {sunPosition.yDirection > 0 ? (
            <group position={sunPosition.pos}>
              {/* Core Sun */}
              <mesh>
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshBasicMaterial color="#fdba74" />
              </mesh>
              {/* Sun Corona Glow halo */}
              <mesh scale={1.5}>
                <sphereGeometry args={[0.32, 16, 16]} />
                <meshBasicMaterial color="#f97316" transparent opacity={0.25} />
              </mesh>
            </group>
          ) : (
            // Night Moon
            <mesh position={[-5, 4.5, -2.5]}>
              <sphereGeometry args={[0.22, 16, 16]} />
              <meshBasicMaterial color="#cbd5e1" />
            </mesh>
          )}

          {/* 3D HOUSE MODEL GROUP */}
          <group position={[0, -0.5, 0]}>
            {/* Ground / Yard */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[12, 12]} />
              <meshStandardMaterial color={sunPosition.yDirection > 0 ? "#1b4d3e" : "#0f172a"} roughness={0.9} />
            </mesh>

            {/* Driveway Slab */}
            <mesh position={[1.6, 0.005, 0.8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[1.3, 2.4]} />
              <meshStandardMaterial color="#475569" roughness={0.8} />
            </mesh>

            {/* MAIN HOUSE BODY */}
            <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
              <boxGeometry args={[1.8, 1.2, 1.8]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.7} metalness={0.05} />
            </mesh>

            {/* Chimney */}
            <mesh position={[-0.5, 1.3, -0.5]} castShadow>
              <boxGeometry args={[0.2, 0.7, 0.2]} />
              <meshStandardMaterial color="#475569" roughness={0.8} />
            </mesh>
            {/* Chimney Smoke Puffing particles when HVAC is running */}
            <ChimneySmoke position={[-0.5, 1.7, -0.5]} active={hvacEnabled} />

            {/* Double Windows - Glow warm yellow at night or when smart lights are active */}
            <mesh position={[0.45, 0.6, 0.91]} castShadow>
              <boxGeometry args={[0.32, 0.32, 0.02]} />
              <meshBasicMaterial color={lightsOn ? "#fbbf24" : isNight ? "#1e293b" : "#38bdf8"} />
            </mesh>
            <mesh position={[-0.45, 0.6, 0.91]} castShadow>
              <boxGeometry args={[0.32, 0.32, 0.02]} />
              <meshBasicMaterial color={lightsOn ? "#fbbf24" : isNight ? "#1e293b" : "#38bdf8"} />
            </mesh>

            {/* Front Door */}
            <mesh position={[0, 0.45, 0.91]} castShadow>
              <boxGeometry args={[0.38, 0.8, 0.02]} />
              <meshStandardMaterial color="#475569" roughness={0.6} />
            </mesh>

            {/* 4-sided Gable/Hip roof slates snappers */}
            {/* South sloped plane */}
            <mesh position={[0, 1.45, 0.45]} rotation={[Math.PI / 4, 0, 0]} castShadow receiveShadow onClick={() => setSelectedFace('South')}>
              <boxGeometry args={[1.8, 0.04, 1.3]} />
              <meshStandardMaterial color={selectedFace === 'South' ? '#0f172a' : '#475569'} roughness={0.6} />
            </mesh>
            {/* North sloped plane */}
            <mesh position={[0, 1.45, -0.45]} rotation={[-Math.PI / 4, 0, 0]} castShadow receiveShadow onClick={() => setSelectedFace('North')}>
              <boxGeometry args={[1.8, 0.04, 1.3]} />
              <meshStandardMaterial color={selectedFace === 'North' ? '#0f172a' : '#475569'} roughness={0.6} />
            </mesh>
            {/* East sloped plane */}
            <mesh position={[0.45, 1.45, 0]} rotation={[0, 0, -Math.PI / 4]} castShadow receiveShadow onClick={() => setSelectedFace('East')}>
              <boxGeometry args={[0.04, 1.3, 1.8]} />
              <meshStandardMaterial color={selectedFace === 'East' ? '#0f172a' : '#475569'} roughness={0.6} />
            </mesh>
            {/* West sloped plane */}
            <mesh position={[-0.45, 1.45, 0]} rotation={[0, 0, Math.PI / 4]} castShadow receiveShadow onClick={() => setSelectedFace('West')}>
              <boxGeometry args={[0.04, 1.3, 1.8]} />
              <meshStandardMaterial color={selectedFace === 'West' ? '#0f172a' : '#475569'} roughness={0.6} />
            </mesh>

            {/* Draggable/Placeable Solar Panels Array */}
            {Array.from({ length: Math.max(1, Math.min(4, Math.ceil(solarCapacity / 2.5))) }).map((_, idx) => {
              const t = panelTransforms[selectedFace];
              let offsetPos: [number, number, number] = [...t.pos];
              const panelCount = Math.max(1, Math.min(4, Math.ceil(solarCapacity / 2.5)));
              const spacing = 0.38;
              if (selectedFace === 'South' || selectedFace === 'North') {
                offsetPos[0] += (idx - (panelCount - 1) / 2) * spacing;
              } else {
                offsetPos[2] += (idx - (panelCount - 1) / 2) * spacing;
              }
              return (
                <mesh key={idx} position={offsetPos} rotation={t.rot} castShadow>
                  <boxGeometry args={selectedFace === 'South' || selectedFace === 'North' ? [0.32, 0.03, 0.8] : [0.8, 0.03, 0.32]} />
                  <meshStandardMaterial color="#082f49" metalness={0.95} roughness={0.05} />
                </mesh>
              );
            })}

            {/* ATTACHED GARAGE MODULE */}
            <mesh position={[1.5, 0.45, 0.1]} castShadow receiveShadow>
              <boxGeometry args={[1.2, 0.9, 1.4]} />
              <meshStandardMaterial color="#f1f5f9" roughness={0.7} />
            </mesh>

            {/* Garage Door */}
            <mesh position={[1.5, 0.4, 0.81]} castShadow>
              <boxGeometry args={[1.0, 0.7, 0.02]} />
              <meshStandardMaterial color="#cbd5e1" roughness={0.4} />
            </mesh>

            {/* Smart Battery Storage (Tesla Powerwall Style) */}
            {batteryEnabled && (
              <group position={[1.75, 0.3, -0.2]}>
                {/* Battery Case */}
                <mesh castShadow receiveShadow>
                  <boxGeometry args={[0.08, 0.5, 0.3]} />
                  <meshStandardMaterial color="#f8fafc" roughness={0.3} />
                </mesh>
                {/* Glowing LED status line */}
                <mesh position={[0.042, 0, 0]}>
                  <boxGeometry args={[0.005, 0.42, 0.015]} />
                  <meshBasicMaterial color="#39ff14" toneMapped={false} />
                </mesh>
              </group>
            )}

            {/* UTILITY POWER POLE */}
            <mesh position={[-2.5, 1.5, 2.5]} castShadow>
              <cylinderGeometry args={[0.06, 0.08, 3.0, 8]} />
              <meshStandardMaterial color="#3e2723" roughness={0.9} />
            </mesh>
            {/* Utility Crossarm */}
            <mesh position={[-2.5, 2.8, 2.5]} castShadow>
              <boxGeometry args={[1.0, 0.06, 0.12]} />
              <meshStandardMaterial color="#3e2723" roughness={0.9} />
            </mesh>

            {/* Main Breaker Panel box on house exterior */}
            <mesh position={[0.91, 0.2, 0.2]}>
              <boxGeometry args={[0.02, 0.3, 0.25]} />
              <meshStandardMaterial color="#64748b" roughness={0.3} />
            </mesh>
            {/* Glow breaker status light */}
            <mesh position={[0.922, 0.28, 0.28]}>
              <sphereGeometry args={[0.015, 8, 8]} />
              <meshBasicMaterial color={calculations.netPower >= 0 ? "#39ff14" : "#ff0844"} />
            </mesh>

            {/* Mailbox at driveway entrance */}
            <group position={[2.2, 0, 2.0]}>
              <mesh position={[0, 0.3, 0]} castShadow>
                <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} />
                <meshStandardMaterial color="#3e2723" />
              </mesh>
              <mesh position={[0, 0.6, 0]} castShadow>
                <boxGeometry args={[0.15, 0.12, 0.24]} />
                <meshStandardMaterial color="#475569" />
              </mesh>
              {/* Red Flag */}
              <mesh position={[0.08, 0.62, 0]} castShadow>
                <boxGeometry args={[0.01, 0.08, 0.02]} />
                <meshBasicMaterial color="#ef4444" />
              </mesh>
            </group>

            {/* EV Car in driveway */}
            <LowPolyEVCar position={[1.6, 0, 1.0]} />

            {/* AC Heat Pump */}
            <ACHeatPump position={[-1.08, 0.22, -0.5]} active={hvacEnabled} />

            {/* Trees around the house */}
            <LowPolyTree position={[-2.2, 0, -2.2]} />
            <LowPolyTree position={[2.8, 0, -2.5]} />

            {/* Backyard Pool */}
            <BackyardPool position={[-2.1, 0, -0.4]} />

            {/* Street Lamp next to driveway */}
            <StreetLamp position={[2.2, 0, 0.4]} isNight={isNight} />

            {/* White Picket Fence along perimeter edges */}
            {/* Back boundary */}
            <PicketFence position={[0, 0, -3.5]} rotation={[0, 0, 0]} length={18} />
            {/* Left side boundary */}
            <PicketFence position={[-3.5, 0, 0]} rotation={[0, Math.PI / 2, 0]} length={18} />
            {/* Right side boundary */}
            <PicketFence position={[3.5, 0, -1.0]} rotation={[0, Math.PI / 2, 0]} length={12} />

            {/* Physical Cable wires */}
            <CableWire start={coordinates.solarPanel} end={coordinates.breakerPanel} />
            {evEnabled && <CableWire start={coordinates.evChargerPlug} end={coordinates.evCarPort} />}
            {hvacEnabled && <CableWire start={coordinates.breakerPanel} end={coordinates.hvacUnit} />}
            {batteryEnabled && <CableWire start={coordinates.batteryPack} end={coordinates.breakerPanel} />}
            <CableWire start={coordinates.utilityPole} end={coordinates.breakerPanel} />

            {/* ─── ANIMATED ENERGY FLOWS ─── */}
            <EnergyFlowLine
              start={coordinates.solarPanel}
              end={coordinates.breakerPanel}
              color="#39ff14"
              active={calculations.solarOutput > 0}
            />

            <EnergyFlowLine
              start={coordinates.evChargerPlug}
              end={coordinates.evCarPort}
              color="#bf00ff"
              active={evEnabled}
            />

            <EnergyFlowLine
              start={coordinates.breakerPanel}
              end={coordinates.hvacUnit}
              color="#00f5ff"
              active={hvacEnabled}
            />

            {/* Battery charging flow: breaker panel -> battery */}
            <EnergyFlowLine
              start={coordinates.breakerPanel}
              end={coordinates.batteryPack}
              color="#39ff14"
              active={batteryEnabled && calculations.solarOutput > calculations.totalDemand}
            />

            {/* Battery discharging flow: battery -> breaker panel */}
            <EnergyFlowLine
              start={coordinates.batteryPack}
              end={coordinates.breakerPanel}
              color="#ff6b35"
              active={batteryEnabled && calculations.solarOutput <= calculations.totalDemand && calculations.totalDemand > 0.5}
            />

            <EnergyFlowLine
              start={coordinates.breakerPanel}
              end={coordinates.utilityPole}
              color="#39ff14"
              active={calculations.netPower > 0}
              speed={1.5}
            />

            <EnergyFlowLine
              start={coordinates.utilityPole}
              end={coordinates.breakerPanel}
              color="#ff0844"
              active={calculations.netPower < 0}
              speed={1.5}
            />
          </group>

          <OrbitControls 
            enableZoom={true} 
            maxPolarAngle={Math.PI / 2 - 0.05} 
            minDistance={4}
            maxDistance={12}
          />
        </Canvas>

        {/* Dynamic HUD inside viewport */}
        <div className="absolute top-4 left-4 z-10 glass-card p-4 w-52 text-white border border-white/10 pointer-events-none select-none">
          <p className="text-[10px] text-text-secondary uppercase tracking-widest flex items-center gap-1 mb-2">
            <Sparkles className="w-3 h-3 text-neon-cyan animate-pulse" />
            Solar Telemetry
          </p>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-text-secondary">Selected Roof:</span>
              <span className="font-bold text-white">{selectedFace}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Orientation:</span>
              <span className="font-semibold text-neon-green">
                {selectedFace === 'South' ? 'Optimal (100%)' : selectedFace === 'North' ? 'Poor (65%)' : 'Sub-peak (85%)'}
              </span>
            </div>
            <div className="flex justify-between border-t border-white/5 pt-1.5 mt-1.5">
              <span className="text-text-secondary">Solar Vector:</span>
              <span className="text-white font-mono">[{sunPosition.pos.map(v => v.toFixed(1)).join(', ')}]</span>
            </div>
          </div>
        </div>

        {/* Interactive Roof Snaps Tip */}
        <div className="absolute bottom-4 left-4 z-10 text-[10px] text-text-secondary flex items-center gap-1.5 bg-black/50 px-2.5 py-1.5 rounded-lg backdrop-blur">
          <Home className="w-3.5 h-3.5 text-neon-cyan" />
          Click roof faces to place/snap solar panel
        </div>
      </div>

      {/* Control sliders and analytics board */}
      <div className="glass-card p-6 flex flex-col justify-between border border-white/10">
        <div className="space-y-5">
          <p className="text-sm font-bold text-white border-b border-white/5 pb-2 uppercase tracking-wider flex items-center gap-2">
            <Sun className="text-neon-cyan" size={16} />
            Microgrid Controls
          </p>

          {/* Daylight clock slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-text-secondary font-semibold">Simulated Clock</label>
              <span className="text-sm font-bold text-neon-cyan flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-neon-cyan" />
                {timeString} {timeOfDay >= 18 || timeOfDay < 6 ? '🌙' : '☀️'}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={24}
              step={0.25}
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, #00f5ff ${(timeOfDay / 24) * 100}%, rgba(255,255,255,0.1) ${(timeOfDay / 24) * 100}%)`,
              }}
            />
            <div className="flex justify-between text-[10px] text-text-dim mt-1 font-mono">
              <span>00:00 (Midnight)</span>
              <span>12:00 (Noon)</span>
              <span>24:00</span>
            </div>
          </div>

          {/* Solar Capacity Slider */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs text-text-secondary font-semibold">Solar Array Size</label>
              <span className="text-sm font-bold text-neon-gold font-mono">{solarCapacity.toFixed(1)} kW Peak</span>
            </div>
            <input
              type="range"
              min={1.0}
              max={10.0}
              step={0.5}
              value={solarCapacity}
              onChange={(e) => setSolarCapacity(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/10"
              style={{
                background: `linear-gradient(to right, #ffd700 ${(solarCapacity / 10) * 100}%, rgba(255,255,255,0.1) ${(solarCapacity / 10) * 100}%)`,
              }}
            />
          </div>

          {/* Appliance Toggles */}
          <div>
            <label className="text-xs text-text-secondary font-semibold block mb-2">Active Household Appliances</label>
            <div className="grid grid-cols-2 gap-2">
              {/* EV charger */}
              <button
                onClick={() => setEvEnabled(!evEnabled)}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                  evEnabled 
                    ? 'bg-neon-purple/10 border-neon-purple/30 text-white font-semibold' 
                    : 'bg-black/10 border-white/5 text-text-secondary hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Car className={`w-3.5 h-3.5 ${evEnabled ? 'text-neon-purple' : 'text-text-dim'}`} />
                  <span>EV Charger</span>
                </div>
                <span className="font-bold font-mono text-[10px]">7.0kW</span>
              </button>

              {/* HVAC */}
              <button
                onClick={() => setHvacEnabled(!hvacEnabled)}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                  hvacEnabled 
                    ? 'bg-neon-cyan/10 border-neon-cyan/30 text-white font-semibold' 
                    : 'bg-black/10 border-white/5 text-text-secondary hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Bolt className={`w-3.5 h-3.5 ${hvacEnabled ? 'text-neon-cyan' : 'text-text-dim'}`} />
                  <span>HVAC Unit</span>
                </div>
                <span className="font-bold font-mono text-[10px]">3.5kW</span>
              </button>

              {/* LED Lighting */}
              <button
                onClick={() => setLightsOn(!lightsOn)}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                  lightsOn 
                    ? 'bg-yellow-500/10 border-yellow-500/30 text-white font-semibold' 
                    : 'bg-black/10 border-white/5 text-text-secondary hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles className={`w-3.5 h-3.5 ${lightsOn ? 'text-yellow-400' : 'text-text-dim'}`} />
                  <span>Smart Lights</span>
                </div>
                <span className="font-bold font-mono text-[10px]">0.3kW</span>
              </button>

              {/* Smart Battery */}
              <button
                onClick={() => setBatteryEnabled(!batteryEnabled)}
                className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all cursor-pointer ${
                  batteryEnabled 
                    ? 'bg-neon-green/10 border-neon-green/30 text-white font-semibold' 
                    : 'bg-black/10 border-white/5 text-text-secondary hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Leaf className={`w-3.5 h-3.5 ${batteryEnabled ? 'text-neon-green' : 'text-text-dim'}`} />
                  <span>Battery (10kWh)</span>
                </div>
                <span className="font-bold font-mono text-[10px]">Active</span>
              </button>
            </div>
          </div>

          {/* HVAC Thermostat Slider - displays only when HVAC is active */}
          {hvacEnabled && (
            <div className="bg-neon-cyan/5 border border-neon-cyan/15 rounded-xl p-3 animate-fade-in">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs text-neon-cyan font-semibold">Thermostat cooling target</label>
                <span className="text-sm font-bold text-white font-mono">{targetTemp}°C</span>
              </div>
              <input
                type="range"
                min={18}
                max={28}
                step={1}
                value={targetTemp}
                onChange={(e) => setTargetTemp(Number(e.target.value))}
                className="w-full h-1 appearance-none cursor-pointer bg-white/10 rounded-full"
                style={{
                  background: `linear-gradient(to right, #00f5ff ${((targetTemp - 18) / 10) * 100}%, rgba(255,255,255,0.1) ${((targetTemp - 18) / 10) * 100}%)`,
                }}
              />
              <div className="flex justify-between text-[9px] text-gray-500 mt-1">
                <span>18°C (Max Cool)</span>
                <span>28°C (Eco)</span>
              </div>
            </div>
          )}
        </div>

        {/* Real-time Math Analysis outputs */}
        <div className="mt-5 border-t border-white/5 pt-4 space-y-3.5">
          {/* Efficiency Score Gauge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-neon-cyan/10 flex items-center justify-center">
                <Sun className="text-neon-cyan w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-white font-semibold">Real-time Efficiency</p>
                <p className="text-[10px] text-text-secondary">Based on Sun & Panel normals Dot Product</p>
              </div>
            </div>
            <span className="text-2xl font-black text-neon-cyan font-mono">{calculations.efficiencyScore}%</span>
          </div>

          {/* Payback period */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-neon-green/10 flex items-center justify-center">
                <DollarSign className="text-neon-green w-4 h-4" />
              </div>
              <div>
                <p className="text-xs text-white font-semibold">ROI Payback Period</p>
                <p className="text-[10px] text-text-secondary">Payback years on investment</p>
              </div>
            </div>
            <span className="text-lg font-bold text-neon-green font-mono">{calculations.paybackYears} yrs</span>
          </div>

          {/* Net Cost / Yield display */}
          <div className="rounded-xl bg-white/[0.02] border border-white/5 p-3 flex justify-between items-center text-xs">
            <div>
              <p className="text-text-secondary">Solar Yield: <strong className="text-white font-mono">{calculations.solarOutput} kW</strong></p>
              <p className="text-text-secondary">Loads Demand: <strong className="text-white font-mono">{calculations.totalDemand} kW</strong></p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-text-dim uppercase tracking-wider font-semibold">Net Balance</p>
              {calculations.netPower >= 0 ? (
                <p className="text-base font-bold text-neon-green font-mono">+{calculations.netPower} kW</p>
              ) : (
                <p className="text-base font-bold text-red-400 font-mono">{calculations.netPower} kW</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
