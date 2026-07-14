// ─── Immersive 3D Smart Home Micro-Grid & Energy Management Simulator ───────
// Full-screen interactive 3D experience with multi-camera system, WASD
// controllable character, two-story smart home, renewable energy assets,
// dynamic day/night skybox, and glassmorphism command center overlay.
// All data driven by CitizenContext for real-time telemetry.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, PointerLockControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  Camera, Eye, Orbit, Grid3X3, Zap, Sun, Moon, Wind, Battery, Car, Bike,
  Thermometer, Lightbulb, DollarSign, Leaf, TrendingUp, Clock, ChevronRight,
  Gauge, AlertTriangle, Activity, Sparkles, X, Maximize2, Minimize2, Settings,
} from 'lucide-react';
import { useCitizen } from '../../contexts/CitizenContext';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

type CameraMode = 'thirdPerson' | 'fps' | 'drone' | 'gridAnalysis';
type RoofFace = 'South' | 'North' | 'East' | 'West';

const COLORS = {
  cyan: '#00F0FF',
  lime: '#39FF14',
  navy: '#070A0F',
  purple: '#BF00FF',
  gold: '#FFD700',
  red: '#FF0844',
  orange: '#FF6B35',
  white: '#F8FAFC',
} as const;

// Wall collision boundaries (AABB boxes the character cannot enter)
interface AABB { minX: number; maxX: number; minZ: number; maxZ: number; }

const HOUSE_WALLS: AABB[] = [
  // Main house exterior walls (but leave front door gap)
  { minX: -2.0, maxX: -0.35, minZ: -2.0, maxZ: -1.7 }, // back wall left
  { minX: 0.35, maxX: 2.0, minZ: -2.0, maxZ: -1.7 },   // back wall right
  { minX: -2.0, maxX: -1.7, minZ: -2.0, maxZ: 2.0 },    // left wall
  { minX: 1.7, maxX: 2.0, minZ: -2.0, maxZ: -0.6 },     // right wall (behind garage)
  // Garage walls
  { minX: 2.0, maxX: 3.2, minZ: -1.4, maxZ: -1.1 },     // garage back
  { minX: 3.0, maxX: 3.2, minZ: -1.4, maxZ: 1.0 },      // garage right
  // Interior walls
  { minX: -0.05, maxX: 0.05, minZ: -2.0, maxZ: -0.3 },   // center divider
];

const FURNITURE_BOXES: AABB[] = [
  // Living room sofa
  { minX: -1.5, maxX: -0.3, minZ: 0.6, maxZ: 1.2 },
  // Kitchen counter
  { minX: -1.6, maxX: -1.2, minZ: -1.5, maxZ: -0.5 },
  // TV stand
  { minX: -1.6, maxX: -1.3, minZ: 1.3, maxZ: 1.7 },
];

const ALL_COLLIDERS = [...HOUSE_WALLS, ...FURNITURE_BOXES];

// Roof normals for solar panel orientation
const roofNormals: Record<RoofFace, THREE.Vector3> = {
  South: new THREE.Vector3(0, 0.707, 0.707).normalize(),
  North: new THREE.Vector3(0, 0.707, -0.707).normalize(),
  East: new THREE.Vector3(0.707, 0.707, 0).normalize(),
  West: new THREE.Vector3(-0.707, 0.707, 0).normalize(),
};

const panelTransforms: Record<RoofFace, { pos: [number, number, number]; rot: [number, number, number] }> = {
  South: { pos: [0, 3.95, 1.1], rot: [Math.PI / 4, 0, 0] },
  North: { pos: [0, 3.95, -1.1], rot: [-Math.PI / 4, 0, 0] },
  East: { pos: [1.1, 3.95, 0], rot: [0, 0, -Math.PI / 4] },
  West: { pos: [-1.1, 3.95, 0], rot: [0, 0, Math.PI / 4] },
};

// Interaction zones (press E near these)
interface InteractionZone {
  id: string;
  position: [number, number, number];
  radius: number;
  label: string;
  icon: string;
}

const INTERACTION_ZONES: InteractionZone[] = [
  { id: 'ev-car', position: [2.5, 0, 1.5], radius: 1.5, label: 'EV Car Charger', icon: '🚗' },
  { id: 'battery', position: [2.8, 0, -0.5], radius: 1.2, label: 'Battery Storage', icon: '🔋' },
  { id: 'hvac', position: [-2.2, 0, -1.0], radius: 1.2, label: 'HVAC System', icon: '❄️' },
  { id: 'solar', position: [0, 0, 0], radius: 2.0, label: 'Solar Panel Array', icon: '☀️' },
  { id: 'breaker', position: [1.85, 0, 0.4], radius: 1.0, label: 'Main Breaker Panel', icon: '⚡' },
];

// ═══════════════════════════════════════════════════════════════════════════════
// KEYBOARD INPUT HOOK
// ═══════════════════════════════════════════════════════════════════════════════

function useKeyboard() {
  const keys = useRef<Set<string>>(new Set());

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => keys.current.add(e.code);
    const onUp = (e: KeyboardEvent) => keys.current.delete(e.code);
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  return keys;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHARACTER CONTROLLER (WASD)
// ═══════════════════════════════════════════════════════════════════════════════

interface CharacterProps {
  cameraMode: CameraMode;
  onPositionUpdate: (pos: THREE.Vector3) => void;
  onInteraction: (zone: InteractionZone | null) => void;
}

function Character({ cameraMode, onPositionUpdate, onInteraction }: CharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const keys = useKeyboard();
  const posRef = useRef(new THREE.Vector3(0, 0, 5));
  const rotRef = useRef(0); // Y-axis rotation
  const { camera } = useThree();
  const bobRef = useRef(0);

  // Mouse look references
  const yaw = useRef(0); // Horizontal angle
  const pitch = useRef(0); // Vertical angle

  // Listen to mouse move when pointer is locked
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const isLocked = document.pointerLockElement !== null;
      if (isLocked && (cameraMode === 'fps' || cameraMode === 'thirdPerson')) {
        const sensitivity = 0.0025;
        yaw.current -= e.movementX * sensitivity;
        pitch.current -= e.movementY * sensitivity;

        // Clamp pitch to prevent looking fully upside down
        const limit = Math.PI / 2 - 0.08;
        pitch.current = Math.max(-limit, Math.min(limit, pitch.current));
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [cameraMode]);

  // Check AABB collision
  const checkCollision = useCallback((x: number, z: number): boolean => {
    const r = 0.3; // character radius
    for (const box of ALL_COLLIDERS) {
      if (x + r > box.minX && x - r < box.maxX && z + r > box.minZ && z - r < box.maxZ) {
        return true;
      }
    }
    // World bounds
    if (Math.abs(x) > 8 || Math.abs(z) > 8) return true;
    return false;
  }, []);

  // Check nearby interaction zones
  const checkInteractions = useCallback((pos: THREE.Vector3) => {
    for (const zone of INTERACTION_ZONES) {
      const dx = pos.x - zone.position[0];
      const dz = pos.z - zone.position[2];
      if (Math.sqrt(dx * dx + dz * dz) < zone.radius) {
        return zone;
      }
    }
    return null;
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const speed = 4.0;
    const rotSpeed = 2.5;
    const dt = Math.min(delta, 0.05);

    // If pointer is NOT locked, fallback to keyboard rotation (A/D or ArrowLeft/ArrowRight)
    const isLocked = typeof document !== 'undefined' && document.pointerLockElement !== null;
    if (!isLocked) {
      if (keys.current.has('KeyA') || keys.current.has('ArrowLeft')) yaw.current += rotSpeed * dt;
      if (keys.current.has('KeyD') || keys.current.has('ArrowRight')) yaw.current -= rotSpeed * dt;
    }

    // Movement direction relative to camera angle yaw
    const moveDir = new THREE.Vector3();
    const forwardVec = new THREE.Vector3(-Math.sin(yaw.current), 0, -Math.cos(yaw.current));
    const rightVec = new THREE.Vector3(Math.cos(yaw.current), 0, -Math.sin(yaw.current));

    if (keys.current.has('KeyW') || keys.current.has('ArrowUp')) moveDir.add(forwardVec);
    if (keys.current.has('KeyS') || keys.current.has('ArrowDown')) moveDir.sub(forwardVec);
    if (keys.current.has('KeyA') || keys.current.has('ArrowLeft')) moveDir.sub(rightVec);
    if (keys.current.has('KeyD') || keys.current.has('ArrowRight')) moveDir.add(rightVec);

    if (moveDir.length() > 0) {
      moveDir.normalize();
      
      const newX = posRef.current.x + moveDir.x * speed * dt;
      const newZ = posRef.current.z + moveDir.z * speed * dt;

      // Slide collision - try each axis independently
      if (!checkCollision(newX, posRef.current.z)) {
        posRef.current.x = newX;
      }
      if (!checkCollision(posRef.current.x, newZ)) {
        posRef.current.z = newZ;
      }

      bobRef.current += dt * 8;
    }

    posRef.current.y = 0;
    groupRef.current.position.copy(posRef.current);
    
    // Character Y-axis rotation follows yaw look direction
    rotRef.current = yaw.current;
    groupRef.current.rotation.y = rotRef.current;

    // Head bob for walking
    const bob = moveDir.length() > 0 ? Math.sin(bobRef.current) * 0.05 : 0;

    // Camera update based on mode
    if (cameraMode === 'thirdPerson') {
      const dist = 4.5;
      const hDist = dist * Math.cos(pitch.current);
      const vDist = dist * Math.sin(pitch.current) + 1.2;

      const camX = posRef.current.x + hDist * Math.sin(yaw.current);
      const camZ = posRef.current.z + hDist * Math.cos(yaw.current);
      const camY = posRef.current.y + vDist;

      camera.position.set(camX, camY, camZ);
      camera.lookAt(posRef.current.x, posRef.current.y + 1.2, posRef.current.z);
    } else if (cameraMode === 'fps') {
      camera.position.set(posRef.current.x, posRef.current.y + 1.6 + bob, posRef.current.z);
      camera.rotation.set(pitch.current, yaw.current, 0, 'YXZ');
    }

    onPositionUpdate(posRef.current.clone());
    onInteraction(checkInteractions(posRef.current));
  });

  // Don't render avatar in FPS mode
  if (cameraMode === 'fps') return <group ref={groupRef} />;

  return (
    <group ref={groupRef}>
      {/* Body */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <capsuleGeometry args={[0.2, 0.6, 8, 16]} />
        <meshStandardMaterial color="#0ea5e9" roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.35, 0]} castShadow>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#fde68a" roughness={0.5} />
      </mesh>
      {/* Visor / Eyes */}
      <mesh position={[0, 1.38, 0.15]}>
        <boxGeometry args={[0.22, 0.06, 0.04]} />
        <meshBasicMaterial color={COLORS.cyan} />
      </mesh>
      {/* Left Arm */}
      <mesh position={[-0.35, 0.75, 0]} castShadow>
        <capsuleGeometry args={[0.06, 0.35, 4, 8]} />
        <meshStandardMaterial color="#0284c7" roughness={0.5} />
      </mesh>
      {/* Right Arm */}
      <mesh position={[0.35, 0.75, 0]} castShadow>
        <capsuleGeometry args={[0.06, 0.35, 4, 8]} />
        <meshStandardMaterial color="#0284c7" roughness={0.5} />
      </mesh>
      {/* Backpack (energy scanner) */}
      <mesh position={[0, 0.85, -0.22]} castShadow>
        <boxGeometry args={[0.22, 0.3, 0.12]} />
        <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Backpack antenna */}
      <mesh position={[0.08, 1.15, -0.22]}>
        <cylinderGeometry args={[0.01, 0.01, 0.25, 6]} />
        <meshBasicMaterial color={COLORS.lime} />
      </mesh>
      {/* Glow ring at feet */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.25, 0.35, 32]} />
        <meshBasicMaterial color={COLORS.cyan} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ENERGY FLOW PARTICLES
// ═══════════════════════════════════════════════════════════════════════════════

function EnergyFlow({ start, end, color, active, speed = 1.8, count = 4 }: {
  start: [number, number, number]; end: [number, number, number];
  color: string; active: boolean; speed?: number; count?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const sVec = useMemo(() => new THREE.Vector3(...start), [start]);
  const eVec = useMemo(() => new THREE.Vector3(...end), [end]);

  useFrame((state) => {
    if (!active || !groupRef.current) return;
    const time = state.clock.getElapsedTime() * speed;
    groupRef.current.children.forEach((mesh, idx) => {
      const progress = (time + idx / count) % 1;
      (mesh as THREE.Mesh).position.copy(sVec).lerp(eVec, progress);
    });
  });

  if (!active) return null;

  return (
    <group ref={groupRef}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CABLE WIRE
// ═══════════════════════════════════════════════════════════════════════════════

function Cable({ start, end }: { start: [number, number, number]; end: [number, number, number] }) {
  const geometry = useMemo(() => {
    const s = new THREE.Vector3(...start);
    const e = new THREE.Vector3(...end);
    const mid = s.clone().add(e).multiplyScalar(0.5);
    const dist = s.distanceTo(e);
    const dir = e.clone().sub(s).normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    return { mid, dist, quat };
  }, [start, end]);

  return (
    <mesh position={geometry.mid} quaternion={geometry.quat}>
      <cylinderGeometry args={[0.015, 0.015, geometry.dist, 6]} />
      <meshBasicMaterial color="#334155" transparent opacity={0.6} />
    </mesh>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WIND TURBINE (Vertical Axis)
// ═══════════════════════════════════════════════════════════════════════════════

function WindTurbine({ position, windSpeed }: { position: [number, number, number]; windSpeed: number }) {
  const bladesRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (bladesRef.current) {
      bladesRef.current.rotation.y += delta * windSpeed * 0.8;
    }
  });

  return (
    <group position={position}>
      {/* Main pole */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 3.0, 8]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Hub */}
      <mesh position={[0, 3.05, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.15, 12]} />
        <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Rotating blades */}
      <group ref={bladesRef} position={[0, 3.05, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[0, (i * Math.PI * 2) / 3, 0]} position={[0.5, 0, 0]}>
            <boxGeometry args={[0.9, 0.02, 0.15]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.5} roughness={0.3} />
          </mesh>
        ))}
      </group>
      {/* Base plate */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 16]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// AC HEAT PUMP
// ═══════════════════════════════════════════════════════════════════════════════

function ACUnit({ position, active }: { position: [number, number, number]; active: boolean }) {
  const fanRef = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => {
    if (active && fanRef.current) fanRef.current.rotation.y += delta * 15;
  });

  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[0.5, 0.6, 0.5]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, 0.26]}>
        <boxGeometry args={[0.38, 0.38, 0.01]} />
        <meshStandardMaterial color="#475569" />
      </mesh>
      <mesh ref={fanRef} position={[0, 0, 0.27]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.3, 0.02, 0.05]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>
      {active && (
        <pointLight position={[0, 0, 0.3]} color={COLORS.cyan} intensity={0.5} distance={1} />
      )}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BATTERY STORAGE BANK
// ═══════════════════════════════════════════════════════════════════════════════

function BatteryBank({ position, enabled, chargeLevel }: {
  position: [number, number, number]; enabled: boolean; chargeLevel: number;
}) {
  return (
    <group position={position}>
      {/* Main battery unit */}
      <mesh castShadow>
        <boxGeometry args={[0.12, 0.8, 0.45]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.2} />
      </mesh>
      {/* Charge level indicator (inner bar) */}
      {enabled && (
        <mesh position={[0.065, -0.4 + (chargeLevel / 100) * 0.35, 0]}>
          <boxGeometry args={[0.008, (chargeLevel / 100) * 0.7, 0.35]} />
          <meshBasicMaterial color={chargeLevel > 20 ? COLORS.lime : COLORS.red} toneMapped={false} />
        </mesh>
      )}
      {/* Status LED */}
      <mesh position={[0.065, 0.35, 0.18]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color={enabled ? COLORS.lime : '#64748b'} />
      </mesh>
      {/* Brand label line */}
      <mesh position={[0.065, 0, 0]}>
        <boxGeometry args={[0.005, 0.6, 0.02]} />
        <meshBasicMaterial color={enabled ? COLORS.cyan : '#334155'} toneMapped={false} />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EV CAR
// ═══════════════════════════════════════════════════════════════════════════════

function EVCar({ position, charging }: { position: [number, number, number]; charging: boolean }) {
  const pulseRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (pulseRef.current && charging) {
      pulseRef.current.material = pulseRef.current.material as THREE.MeshBasicMaterial;
      (pulseRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.3 + Math.sin(state.clock.getElapsedTime() * 3) * 0.2;
    }
  });

  return (
    <group position={position}>
      {/* Chassis */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <boxGeometry args={[1.0, 0.25, 2.0]} />
        <meshStandardMaterial color="#6d28d9" roughness={0.3} metalness={0.8} />
      </mesh>
      {/* Cabin */}
      <mesh position={[0, 0.48, -0.1]} castShadow>
        <boxGeometry args={[0.85, 0.3, 1.0]} />
        <meshStandardMaterial color="#0f172a" roughness={0.1} />
      </mesh>
      {/* Windshield */}
      <mesh position={[0, 0.48, 0.42]} rotation={[-Math.PI / 6, 0, 0]}>
        <planeGeometry args={[0.75, 0.3]} />
        <meshBasicMaterial color="#a5f3fc" transparent opacity={0.5} />
      </mesh>
      {/* Headlights */}
      {[-0.35, 0.35].map((x, i) => (
        <mesh key={i} position={[x, 0.22, 1.01]}>
          <circleGeometry args={[0.06, 12]} />
          <meshBasicMaterial color="#fef3c7" />
        </mesh>
      ))}
      {/* Wheels */}
      {[-0.48, 0.48].map((x) =>
        [-0.55, 0.55].map((z, j) => (
          <mesh key={`${x}-${j}`} position={[x, 0.12, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.14, 0.14, 0.1, 16]} />
            <meshStandardMaterial color="#111" roughness={0.9} />
          </mesh>
        ))
      )}
      {/* Charging port glow */}
      {charging && (
        <>
          <mesh ref={pulseRef} position={[0.51, 0.25, -0.3]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshBasicMaterial color={COLORS.lime} transparent opacity={0.5} toneMapped={false} />
          </mesh>
          <pointLight position={[0.51, 0.25, -0.3]} color={COLORS.lime} intensity={1} distance={1.5} />
        </>
      )}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EV BIKE
// ═══════════════════════════════════════════════════════════════════════════════

function EVBike({ position, charging }: { position: [number, number, number]; charging: boolean }) {
  return (
    <group position={position}>
      {/* Frame */}
      <mesh position={[0, 0.35, 0]} rotation={[0, 0, Math.PI / 8]} castShadow>
        <boxGeometry args={[0.04, 0.5, 0.04]} />
        <meshStandardMaterial color="#1e40af" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.42, 0]} castShadow>
        <boxGeometry args={[0.04, 0.04, 0.55]} />
        <meshStandardMaterial color="#1e40af" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Wheels */}
      {[-0.25, 0.25].map((z, i) => (
        <mesh key={i} position={[0, 0.18, z]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.16, 0.025, 8, 24]} />
          <meshStandardMaterial color="#111" roughness={0.8} />
        </mesh>
      ))}
      {/* Seat */}
      <mesh position={[0, 0.55, -0.05]} castShadow>
        <boxGeometry args={[0.12, 0.04, 0.2]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {/* Battery pack */}
      <mesh position={[0, 0.3, 0.05]}>
        <boxGeometry args={[0.08, 0.12, 0.2]} />
        <meshStandardMaterial color="#334155" metalness={0.6} />
      </mesh>
      {charging && (
        <pointLight position={[0, 0.3, 0]} color={COLORS.purple} intensity={0.8} distance={1} />
      )}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STREET LAMP
// ═══════════════════════════════════════════════════════════════════════════════

function StreetLamp({ position, isNight }: { position: [number, number, number]; isNight: boolean }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 3.0, 8]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.25, 2.9, 0]}>
        <boxGeometry args={[0.5, 0.06, 0.06]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[0.48, 2.82, 0]}>
        <boxGeometry args={[0.2, 0.1, 0.14]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0.48, 2.76, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshBasicMaterial color={isNight ? '#fbbf24' : '#94a3b8'} />
      </mesh>
      {isNight && (
        <>
          <spotLight position={[0.48, 2.76, 0]} angle={Math.PI / 3.5} penumbra={0.6} intensity={4} distance={5} castShadow />
          <mesh position={[0.48, 1.7, 0]}>
            <coneGeometry args={[0.8, 2.2, 16, 1, true]} />
            <meshBasicMaterial color="#fbbf24" transparent opacity={0.08} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        </>
      )}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOW-POLY TREE
// ═══════════════════════════════════════════════════════════════════════════════

function Tree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 1.0, 8]} />
        <meshStandardMaterial color="#5c4033" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.3, 0]} castShadow>
        <coneGeometry args={[0.7, 1.3, 8]} />
        <meshStandardMaterial color="#1b4332" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.9, 0]} castShadow>
        <coneGeometry args={[0.5, 0.9, 8]} />
        <meshStandardMaterial color="#166534" roughness={0.8} />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHIMNEY SMOKE
// ═══════════════════════════════════════════════════════════════════════════════

function Smoke({ position, active }: { position: [number, number, number]; active: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const particles = useMemo(() => Array.from({ length: 6 }, (_, i) => ({ id: i, offset: i * 0.16 })), []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime() * 0.9;
    groupRef.current.children.forEach((mesh, idx) => {
      const m = mesh as THREE.Mesh;
      if (!active) { m.scale.setScalar(0); return; }
      const p = (time + particles[idx].offset) % 1;
      m.position.y = p * 1.2;
      m.position.x = Math.sin(time * 3 + idx) * 0.07 * p;
      m.position.z = Math.cos(time * 2.5 + idx) * 0.07 * p;
      m.scale.setScalar(0.02 + p * 0.12);
      (m.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.3;
    });
  });

  return (
    <group ref={groupRef} position={position}>
      {particles.map((p) => (
        <mesh key={p.id}>
          <sphereGeometry args={[0.8, 6, 6]} />
          <meshBasicMaterial color="#e2e8f0" transparent opacity={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRID ANALYSIS WIREFRAME OVERLAY
// ═══════════════════════════════════════════════════════════════════════════════

function GridOverlay({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <group>
      {/* Grid floor lines */}
      <gridHelper args={[20, 40, COLORS.cyan, '#0f2a3a']} position={[0, 0.02, 0]} />
      {/* House wireframe shell */}
      <lineSegments position={[0, 1.5, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(4, 3, 4)]} />
        <lineBasicMaterial color={COLORS.cyan} transparent opacity={0.4} />
      </lineSegments>
      {/* Garage wireframe */}
      <lineSegments position={[2.6, 1.0, 0.3]}>
        <edgesGeometry args={[new THREE.BoxGeometry(1.8, 2, 2.2)]} />
        <lineBasicMaterial color={COLORS.purple} transparent opacity={0.3} />
      </lineSegments>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TWO-STORY SMART HOME
// ═══════════════════════════════════════════════════════════════════════════════

interface HouseProps {
  selectedFace: RoofFace;
  onSelectFace: (f: RoofFace) => void;
  solarCapacity: number;
  isNight: boolean;
  lightsOn: boolean;
  hvacEnabled: boolean;
  evEnabled: boolean;
  batteryEnabled: boolean;
  sunPosition: [number, number, number];
  netPower: number;
  solarOutput: number;
  totalDemand: number;
  windSpeed: number;
}

function SmartHome(props: HouseProps) {
  const {
    selectedFace, onSelectFace, solarCapacity, isNight, lightsOn,
    hvacEnabled, evEnabled, batteryEnabled, sunPosition, netPower,
    solarOutput, totalDemand, windSpeed,
  } = props;

  const windowGlow = lightsOn || isNight ? '#fbbf24' : '#7dd3fc';
  const windowEmissive = lightsOn ? 0.8 : isNight ? 0.3 : 0;

  // Solar panels
  const panelCount = Math.max(1, Math.min(5, Math.ceil(solarCapacity / 2)));

  // Wire coordinates
  const solarWireEnd: [number, number, number] = [panelTransforms[selectedFace].pos[0], panelTransforms[selectedFace].pos[1], panelTransforms[selectedFace].pos[2]];
  const breakerPos: [number, number, number] = [1.85, 0.5, 0.4];
  const batteryPos: [number, number, number] = [2.8, 0.5, -0.5];
  const hvacPos: [number, number, number] = [-2.2, 0.3, -1.0];
  const evPos: [number, number, number] = [2.5, 0.3, 1.5];
  const gridPole: [number, number, number] = [-4.0, 3.5, 4.0];

  return (
    <group>
      {/* ═══ GROUND ═══ */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 18]} />
        <meshStandardMaterial color={isNight ? '#0a1628' : '#1b5e3a'} roughness={0.9} />
      </mesh>

      {/* Driveway */}
      <mesh position={[2.5, 0.006, 2.5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.5, 5.0]} />
        <meshStandardMaterial color="#475569" roughness={0.8} />
      </mesh>

      {/* Sidewalk */}
      <mesh position={[0, 0.008, 4.0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 0.8]} />
        <meshStandardMaterial color="#64748b" roughness={0.7} />
      </mesh>

      {/* ═══ MAIN HOUSE — GROUND FLOOR ═══ */}
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[4, 3, 4]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.65} metalness={0.05} />
      </mesh>

      {/* ═══ SECOND FLOOR (slightly recessed) ═══ */}
      <mesh position={[0, 4.0, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.6, 2.0, 3.6]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.6} metalness={0.05} />
      </mesh>

      {/* ═══ ROOF — 4 sloped faces ═══ */}
      {(['South', 'North', 'East', 'West'] as RoofFace[]).map((face) => {
        const isSelected = selectedFace === face;
        const rots: Record<string, [number, number, number]> = {
          South: [Math.PI / 4, 0, 0], North: [-Math.PI / 4, 0, 0],
          East: [0, 0, -Math.PI / 4], West: [0, 0, Math.PI / 4],
        };
        const positions: Record<string, [number, number, number]> = {
          South: [0, 5.25, 0.9], North: [0, 5.25, -0.9],
          East: [0.9, 5.25, 0], West: [-0.9, 5.25, 0],
        };
        return (
          <mesh
            key={face}
            position={positions[face]}
            rotation={rots[face]}
            castShadow receiveShadow
            onClick={() => onSelectFace(face)}
          >
            <boxGeometry args={face === 'South' || face === 'North' ? [3.6, 0.06, 2.6] : [0.06, 2.6, 3.6]} />
            <meshStandardMaterial
              color={isSelected ? '#0c4a6e' : '#475569'}
              roughness={0.6}
            />
          </mesh>
        );
      })}

      {/* ═══ SOLAR PANELS ═══ */}
      {Array.from({ length: panelCount }).map((_, idx) => {
        const t = panelTransforms[selectedFace];
        const pos: [number, number, number] = [...t.pos];
        const spacing = 0.5;
        if (selectedFace === 'South' || selectedFace === 'North') {
          pos[0] += (idx - (panelCount - 1) / 2) * spacing;
        } else {
          pos[2] += (idx - (panelCount - 1) / 2) * spacing;
        }
        return (
          <mesh key={idx} position={pos} rotation={t.rot} castShadow>
            <boxGeometry args={selectedFace === 'South' || selectedFace === 'North' ? [0.42, 0.04, 1.0] : [1.0, 0.04, 0.42]} />
            <meshStandardMaterial color="#082f49" metalness={0.95} roughness={0.05} />
          </mesh>
        );
      })}

      {/* ═══ CHIMNEY ═══ */}
      <mesh position={[-0.8, 5.8, -0.8]} castShadow>
        <boxGeometry args={[0.3, 1.0, 0.3]} />
        <meshStandardMaterial color="#475569" roughness={0.8} />
      </mesh>
      <Smoke position={[-0.8, 6.35, -0.8]} active={hvacEnabled} />

      {/* ═══ WINDOWS (Ground Floor) ═══ */}
      {/* Front windows */}
      {[-0.8, 0.8].map((x, i) => (
        <mesh key={`fw-${i}`} position={[x, 1.3, 2.01]} castShadow>
          <boxGeometry args={[0.6, 0.7, 0.02]} />
          <meshStandardMaterial color={windowGlow} emissive={windowGlow} emissiveIntensity={windowEmissive} />
        </mesh>
      ))}
      {/* Side windows */}
      {[-0.6, 0.6].map((z, i) => (
        <mesh key={`sw-${i}`} position={[-2.01, 1.3, z]}>
          <boxGeometry args={[0.02, 0.7, 0.5]} />
          <meshStandardMaterial color={windowGlow} emissive={windowGlow} emissiveIntensity={windowEmissive} />
        </mesh>
      ))}

      {/* ═══ WINDOWS (Second Floor) ═══ */}
      {[-0.6, 0.6].map((x, i) => (
        <mesh key={`sf-${i}`} position={[x, 4.0, 1.81]}>
          <boxGeometry args={[0.5, 0.55, 0.02]} />
          <meshStandardMaterial color={windowGlow} emissive={windowGlow} emissiveIntensity={windowEmissive * 0.6} />
        </mesh>
      ))}

      {/* ═══ FRONT DOOR ═══ */}
      <mesh position={[0, 0.9, 2.01]} castShadow>
        <boxGeometry args={[0.7, 1.8, 0.04]} />
        <meshStandardMaterial color="#78350f" roughness={0.7} />
      </mesh>
      {/* Door handle */}
      <mesh position={[0.25, 0.9, 2.04]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.9} />
      </mesh>

      {/* ═══ GARAGE MODULE ═══ */}
      <mesh position={[2.6, 1.0, 0.3]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 2.0, 2.2]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
      </mesh>
      {/* Garage door */}
      <mesh position={[2.6, 0.8, 1.41]}>
        <boxGeometry args={[1.5, 1.5, 0.04]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.4} />
      </mesh>
      {/* Garage door lines */}
      {[0.2, 0.55, 0.9, 1.25].map((y, i) => (
        <mesh key={`gl-${i}`} position={[2.6, y, 1.43]}>
          <boxGeometry args={[1.45, 0.015, 0.005]} />
          <meshBasicMaterial color="#64748b" />
        </mesh>
      ))}

      {/* ═══ INTERIOR ELEMENTS ═══ */}
      {/* Living room sofa */}
      <mesh position={[-0.9, 0.35, 0.9]} castShadow>
        <boxGeometry args={[1.2, 0.5, 0.5]} />
        <meshStandardMaterial color="#6366f1" roughness={0.8} />
      </mesh>
      {/* Sofa back */}
      <mesh position={[-0.9, 0.6, 1.1]} castShadow>
        <boxGeometry args={[1.2, 0.3, 0.08]} />
        <meshStandardMaterial color="#4f46e5" roughness={0.8} />
      </mesh>

      {/* TV */}
      <mesh position={[-1.95, 1.2, 0.9]}>
        <boxGeometry args={[0.04, 0.55, 0.9]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      {/* TV screen glow */}
      {lightsOn && (
        <mesh position={[-1.93, 1.2, 0.9]}>
          <boxGeometry args={[0.01, 0.45, 0.8]} />
          <meshBasicMaterial color="#38bdf8" toneMapped={false} />
        </mesh>
      )}

      {/* Kitchen counter */}
      <mesh position={[-1.4, 0.5, -1.0]} castShadow>
        <boxGeometry args={[0.5, 1.0, 1.2]} />
        <meshStandardMaterial color="#78716c" roughness={0.5} />
      </mesh>
      {/* Counter top */}
      <mesh position={[-1.4, 1.01, -1.0]}>
        <boxGeometry args={[0.55, 0.04, 1.25]} />
        <meshStandardMaterial color="#fafaf9" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* ═══ VEHICLES ═══ */}
      <EVCar position={[2.5, 0, 2.8]} charging={evEnabled} />
      <EVBike position={[3.3, 0, 0.3]} charging={evEnabled} />

      {/* ═══ BATTERY STORAGE ═══ */}
      <BatteryBank position={[2.8, 0.4, -0.5]} enabled={batteryEnabled} chargeLevel={batteryEnabled ? 75 : 0} />

      {/* ═══ HVAC UNIT ═══ */}
      <ACUnit position={[-2.2, 0.3, -1.0]} active={hvacEnabled} />

      {/* ═══ WIND TURBINE ═══ */}
      <WindTurbine position={[-3.0, 0, -3.0]} windSpeed={windSpeed} />

      {/* ═══ BREAKER PANEL ═══ */}
      <mesh position={[1.85, 0.5, 2.02]}>
        <boxGeometry args={[0.3, 0.45, 0.04]} />
        <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.5} />
      </mesh>
      <mesh position={[1.95, 0.65, 2.04]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color={netPower >= 0 ? COLORS.lime : COLORS.red} />
      </mesh>

      {/* ═══ UTILITY POLE ═══ */}
      <mesh position={[-4.0, 2.0, 4.0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 4.0, 8]} />
        <meshStandardMaterial color="#3e2723" roughness={0.9} />
      </mesh>
      <mesh position={[-4.0, 3.8, 4.0]} castShadow>
        <boxGeometry args={[1.2, 0.08, 0.15]} />
        <meshStandardMaterial color="#3e2723" roughness={0.9} />
      </mesh>

      {/* ═══ TREES ═══ */}
      <Tree position={[-3.5, 0, -4.5]} />
      <Tree position={[4.5, 0, -3.5]} />
      <Tree position={[-5.0, 0, 2.0]} />
      <Tree position={[5.5, 0, -1.0]} />
      <Tree position={[-4.5, 0, -1.5]} />

      {/* ═══ STREET LAMPS ═══ */}
      <StreetLamp position={[3.5, 0, 4.5]} isNight={isNight} />
      <StreetLamp position={[-3.5, 0, 4.5]} isNight={isNight} />

      {/* ═══ FENCING ═══ */}
      {/* Back */}
      <mesh position={[0, 0.35, -5.5]}>
        <boxGeometry args={[12, 0.7, 0.04]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>
      {/* Left */}
      <mesh position={[-6, 0.35, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[11, 0.7, 0.04]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>
      {/* Right */}
      <mesh position={[6, 0.35, -1.0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[9, 0.7, 0.04]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.5} />
      </mesh>

      {/* ═══ ENERGY FLOW LINES ═══ */}
      <Cable start={solarWireEnd} end={breakerPos} />
      <Cable start={breakerPos} end={gridPole} />
      {batteryEnabled && <Cable start={breakerPos} end={batteryPos} />}
      {evEnabled && <Cable start={breakerPos} end={evPos} />}
      {hvacEnabled && <Cable start={breakerPos} end={hvacPos} />}

      {/* Animated flows */}
      <EnergyFlow start={solarWireEnd} end={breakerPos} color={COLORS.lime} active={solarOutput > 0} />
      <EnergyFlow start={breakerPos} end={evPos} color={COLORS.purple} active={evEnabled} />
      <EnergyFlow start={breakerPos} end={hvacPos} color={COLORS.cyan} active={hvacEnabled} />
      <EnergyFlow start={breakerPos} end={batteryPos} color={COLORS.lime} active={batteryEnabled && solarOutput > totalDemand} />
      <EnergyFlow start={batteryPos} end={breakerPos} color={COLORS.orange} active={batteryEnabled && solarOutput <= totalDemand && totalDemand > 0.5} />
      <EnergyFlow start={breakerPos} end={gridPole} color={COLORS.lime} active={netPower > 0} speed={1.5} />
      <EnergyFlow start={gridPole} end={breakerPos} color={COLORS.red} active={netPower < 0} speed={1.5} />

      {/* Window light spill on terrain at night */}
      {(lightsOn || isNight) && (
        <>
          <pointLight position={[-0.8, 1.3, 2.5]} color="#fbbf24" intensity={lightsOn ? 2 : 0.5} distance={3} />
          <pointLight position={[0.8, 1.3, 2.5]} color="#fbbf24" intensity={lightsOn ? 2 : 0.5} distance={3} />
        </>
      )}
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// DRONE CAMERA CONTROLLER
// ═══════════════════════════════════════════════════════════════════════════════

function DroneCamera({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <OrbitControls
      enableZoom
      maxPolarAngle={Math.PI / 3}
      minPolarAngle={0.2}
      minDistance={8}
      maxDistance={30}
      target={[0, 0, 0]}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GRID ANALYSIS CAMERA
// ═══════════════════════════════════════════════════════════════════════════════

function GridCamera({ active }: { active: boolean }) {
  const { camera } = useThree();

  useEffect(() => {
    if (active) {
      camera.position.set(12, 14, 12);
      camera.lookAt(0, 1, 0);
    }
  }, [active, camera]);

  if (!active) return null;
  return (
    <OrbitControls
      enableZoom
      enableRotate={false}
      target={[0, 1, 0]}
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SCENE
// ═══════════════════════════════════════════════════════════════════════════════

interface SceneProps {
  cameraMode: CameraMode;
  timeOfDay: number;
  selectedFace: RoofFace;
  onSelectFace: (f: RoofFace) => void;
  solarCapacity: number;
  lightsOn: boolean;
  hvacEnabled: boolean;
  evEnabled: boolean;
  batteryEnabled: boolean;
  netPower: number;
  solarOutput: number;
  totalDemand: number;
  onCharacterPosition: (pos: THREE.Vector3) => void;
  onNearZone: (zone: InteractionZone | null) => void;
}

function Scene(props: SceneProps) {
  const {
    cameraMode, timeOfDay, selectedFace, onSelectFace, solarCapacity,
    lightsOn, hvacEnabled, evEnabled, batteryEnabled, netPower,
    solarOutput, totalDemand, onCharacterPosition, onNearZone,
  } = props;

  // Sun position
  const sunData = useMemo(() => {
    const angle = ((timeOfDay - 6) / 24) * 2 * Math.PI;
    const r = 12;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    const pos: [number, number, number] = [x, y, 3];
    return { pos, isDay: y > 0 };
  }, [timeOfDay]);

  const isNight = !sunData.isDay;

  // Sky color
  const skyColor = useMemo(() => {
    if (timeOfDay < 5 || timeOfDay >= 19.5) return '#020617';
    if (timeOfDay >= 5 && timeOfDay < 6.5) {
      const t = (timeOfDay - 5) / 1.5;
      return '#' + new THREE.Color('#020617').lerp(new THREE.Color('#f97316'), t).getHexString();
    }
    if (timeOfDay >= 6.5 && timeOfDay < 8) {
      const t = (timeOfDay - 6.5) / 1.5;
      return '#' + new THREE.Color('#f97316').lerp(new THREE.Color('#0ea5e9'), t).getHexString();
    }
    if (timeOfDay >= 8 && timeOfDay < 17) return '#38bdf8';
    if (timeOfDay >= 17 && timeOfDay < 19) {
      const t = (timeOfDay - 17) / 2;
      return '#' + new THREE.Color('#38bdf8').lerp(new THREE.Color('#ec4899'), t).getHexString();
    }
    const t = (timeOfDay - 19) / 0.5;
    return '#' + new THREE.Color('#ec4899').lerp(new THREE.Color('#020617'), t).getHexString();
  }, [timeOfDay]);

  // Wind speed estimate from time of day (higher at night)
  const windSpeed = useMemo(() => {
    return 2.0 + Math.cos(((timeOfDay - 12) / 12) * Math.PI) * 1.5;
  }, [timeOfDay]);

  return (
    <>
      <color attach="background" args={[skyColor]} />
      <ambientLight intensity={sunData.isDay ? 0.35 : 0.06} />

      {sunData.isDay && (
        <directionalLight
          position={sunData.pos}
          intensity={1.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={30}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
      )}

      {/* Moon light */}
      {isNight && (
        <pointLight position={[-8, 6, -4]} color="#94a3b8" intensity={0.3} />
      )}

      {/* Stars */}
      {isNight && <Stars radius={80} depth={20} count={500} factor={4} fade speed={2} />}

      {/* Sun mesh */}
      {sunData.isDay ? (
        <group position={sunData.pos}>
          <mesh>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshBasicMaterial color="#fdba74" />
          </mesh>
          <mesh scale={1.6}>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshBasicMaterial color="#f97316" transparent opacity={0.2} />
          </mesh>
        </group>
      ) : (
        <mesh position={[-8, 6, -4]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshBasicMaterial color="#cbd5e1" />
        </mesh>
      )}

      {/* Fog */}
      <fog attach="fog" args={[isNight ? '#020617' : '#bae6fd', 15, 35]} />

      {/* Smart Home */}
      <SmartHome
        selectedFace={selectedFace}
        onSelectFace={onSelectFace}
        solarCapacity={solarCapacity}
        isNight={isNight}
        lightsOn={lightsOn}
        hvacEnabled={hvacEnabled}
        evEnabled={evEnabled}
        batteryEnabled={batteryEnabled}
        sunPosition={sunData.pos}
        netPower={netPower}
        solarOutput={solarOutput}
        totalDemand={totalDemand}
        windSpeed={windSpeed}
      />

      {/* Grid Analysis Overlay */}
      <GridOverlay active={cameraMode === 'gridAnalysis'} />

      {/* Controllable Character */}
      <Character
        cameraMode={cameraMode}
        onPositionUpdate={onCharacterPosition}
        onInteraction={onNearZone}
      />

      {/* Camera controllers */}
      <DroneCamera active={cameraMode === 'drone'} />
      <GridCamera active={cameraMode === 'gridAnalysis'} />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLASSMORPHISM HUD OVERLAY
// ═══════════════════════════════════════════════════════════════════════════════

interface HUDProps {
  cameraMode: CameraMode;
  setCameraMode: (m: CameraMode) => void;
  timeOfDay: number;
  setTimeOfDay: (t: number) => void;
  solarOutput: number;
  totalDemand: number;
  netPower: number;
  efficiencyScore: number;
  paybackYears: number;
  monthlyBill: number;
  co2Offset: number;
  evEnabled: boolean;
  setEvEnabled: (b: boolean) => void;
  hvacEnabled: boolean;
  setHvacEnabled: (b: boolean) => void;
  lightsOn: boolean;
  setLightsOn: (b: boolean) => void;
  batteryEnabled: boolean;
  setBatteryEnabled: (b: boolean) => void;
  solarCapacity: number;
  setSolarCapacity: (c: number) => void;
  selectedFace: RoofFace;
  nearZone: InteractionZone | null;
  onClose: () => void;
  isSimulating: boolean;
  setIsSimulating: (b: boolean) => void;
}

function HUD(props: HUDProps) {
  const {
    cameraMode, setCameraMode, timeOfDay, setTimeOfDay,
    solarOutput, totalDemand, netPower, efficiencyScore,
    paybackYears, monthlyBill, co2Offset,
    evEnabled, setEvEnabled, hvacEnabled, setHvacEnabled,
    lightsOn, setLightsOn, batteryEnabled, setBatteryEnabled,
    solarCapacity, setSolarCapacity, selectedFace, nearZone, onClose,
    isSimulating, setIsSimulating,
  } = props;

  const [hudCollapsed, setHudCollapsed] = useState(false);

  const timeString = useMemo(() => {
    const h = Math.floor(timeOfDay);
    const m = Math.floor((timeOfDay % 1) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }, [timeOfDay]);

  const isNight = timeOfDay >= 18 || timeOfDay < 6;
  const gridRate = (timeOfDay >= 6 && timeOfDay <= 10) || (timeOfDay >= 18 && timeOfDay <= 22) ? 10.5 : timeOfDay >= 22 || timeOfDay < 5 ? 4.5 : 8.5;

  const cameraModes: { id: CameraMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'thirdPerson', label: '3rd Person', icon: Camera },
    { id: 'fps', label: 'FPS', icon: Eye },
    { id: 'drone', label: 'Drone', icon: Orbit },
    { id: 'gridAnalysis', label: 'Grid View', icon: Grid3X3 },
  ];

  return (
    <>
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3"
        style={{ background: 'linear-gradient(180deg, rgba(7,10,15,0.85) 0%, transparent 100%)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #00F0FF, #39FF14)' }}>
            <Sparkles className="w-4 h-4 text-[#070A0F]" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-wide">Smart Home Digital Twin</h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest">Immersive 3D Micro-Grid Simulator</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Camera mode buttons */}
          <div className="flex gap-1 bg-slate-900/60 backdrop-blur-md rounded-xl p-1 border border-white/10">
            {cameraModes.map((cm) => {
              const Icon = cm.icon;
              const isActive = cameraMode === cm.id;
              return (
                <button
                  key={cm.id}
                  onClick={() => setCameraMode(cm.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'text-[#070A0F] shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                  style={isActive ? ({ background: 'linear-gradient(135deg, #00F0FF, #39FF14)' } as React.CSSProperties) : undefined}
                >
                  <Icon className="w-3 h-3" />
                  <span className="hidden sm:inline">{cm.label}</span>
                </button>
              );
            })}
          </div>

          <button onClick={onClose} className="p-2 rounded-lg bg-slate-900/60 backdrop-blur-md border border-white/10 text-gray-400 hover:text-white transition-all cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* E key interaction prompt */}
      {nearZone && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 bg-slate-900/80 backdrop-blur-md border border-[#00F0FF]/30 rounded-xl px-5 py-3 flex items-center gap-3 animate-pulse">
          <span className="text-xl">{nearZone.icon}</span>
          <div>
            <p className="text-xs text-[#00F0FF] font-bold">{nearZone.label}</p>
            <p className="text-[10px] text-gray-400">Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white font-mono text-[9px]">E</kbd> to interact</p>
          </div>
        </div>
      )}

      {/* WASD controls hint */}
      {(cameraMode === 'thirdPerson' || cameraMode === 'fps') && (
        <div className="absolute bottom-4 left-4 z-20 bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3">
          <div className="grid grid-cols-3 gap-1 w-20 mx-auto mb-2">
            <div />
            <div className="bg-white/10 border border-white/20 rounded text-center text-[10px] text-white font-mono py-0.5">W</div>
            <div />
            <div className="bg-white/10 border border-white/20 rounded text-center text-[10px] text-white font-mono py-0.5">A</div>
            <div className="bg-white/10 border border-white/20 rounded text-center text-[10px] text-white font-mono py-0.5">S</div>
            <div className="bg-white/10 border border-white/20 rounded text-center text-[10px] text-white font-mono py-0.5">D</div>
          </div>
          <p className="text-[9px] text-gray-500 text-center">Move & Rotate</p>
        </div>
      )}

      {/* Right side panel (collapsible) */}
      <div className={`absolute top-16 right-3 z-20 transition-all duration-300 ${hudCollapsed ? 'w-10' : 'w-72'}`}>
        {hudCollapsed ? (
          <button onClick={() => setHudCollapsed(false)} className="w-10 h-10 rounded-xl bg-slate-900/70 backdrop-blur-md border border-white/10 flex items-center justify-center text-[#00F0FF] cursor-pointer hover:bg-slate-900/90 transition-all">
            <Maximize2 className="w-4 h-4" />
          </button>
        ) : (
          <div className="bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl" style={{ maxHeight: 'calc(100vh - 100px)' }}>
            {/* Panel header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-[#00F0FF]" />
                <span className="text-[10px] font-bold text-[#00F0FF] uppercase tracking-widest">Command Center</span>
              </div>
              <button onClick={() => setHudCollapsed(true)} className="text-gray-500 hover:text-white cursor-pointer">
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-y-auto p-3 space-y-3" style={{ maxHeight: 'calc(100vh - 160px)' }}>
              {/* Time control */}
              <div>
                <div className="flex items-center justify-between mb-1.5 font-sans">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Time of Day</span>
                    <button
                      onClick={() => setIsSimulating(!isSimulating)}
                      className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-[9px] cursor-pointer transition-all"
                      title={isSimulating ? "Pause auto-simulation" : "Start auto-simulation"}
                    >
                      {isSimulating ? '⏸ Pause' : '▶ Play'}
                    </button>
                  </div>
                  <span className="text-xs font-bold font-mono flex items-center gap-1" style={{ color: COLORS.cyan }}>
                    <Clock className="w-3 h-3" />
                    {timeString} {isNight ? '🌙' : '☀️'}
                  </span>
                </div>
                <input
                  type="range" min={0} max={24} step={0.25} value={timeOfDay}
                  onChange={(e) => setTimeOfDay(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, #00F0FF ${(timeOfDay / 24) * 100}%, rgba(255,255,255,0.08) ${(timeOfDay / 24) * 100}%)` }}
                />
              </div>

              {/* Solar capacity */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Solar Array</span>
                  <span className="text-xs font-bold font-mono" style={{ color: COLORS.gold }}>{solarCapacity.toFixed(1)} kW</span>
                </div>
                <input
                  type="range" min={1} max={10} step={0.5} value={solarCapacity}
                  onChange={(e) => setSolarCapacity(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{ background: `linear-gradient(to right, #FFD700 ${(solarCapacity / 10) * 100}%, rgba(255,255,255,0.08) ${(solarCapacity / 10) * 100}%)` }}
                />
              </div>

              {/* Live telemetry */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2.5 text-center">
                  <Sun className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: COLORS.gold }} />
                  <p className="text-sm font-bold text-white font-mono">{solarOutput} kW</p>
                  <p className="text-[9px] text-gray-500">Solar</p>
                </div>
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2.5 text-center">
                  <Wind className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: COLORS.cyan }} />
                  <p className="text-sm font-bold text-white font-mono">{(2.0 + Math.cos(((timeOfDay - 12) / 12) * Math.PI) * 1.5).toFixed(1)} kW</p>
                  <p className="text-[9px] text-gray-500">Wind</p>
                </div>
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2.5 text-center">
                  <Zap className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: COLORS.orange }} />
                  <p className="text-sm font-bold text-white font-mono">{totalDemand} kW</p>
                  <p className="text-[9px] text-gray-500">Load</p>
                </div>
                <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2.5 text-center">
                  <Gauge className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: netPower >= 0 ? COLORS.lime : COLORS.red }} />
                  <p className={`text-sm font-bold font-mono ${netPower >= 0 ? 'text-[#39FF14]' : 'text-red-400'}`}>
                    {netPower >= 0 ? '+' : ''}{netPower} kW
                  </p>
                  <p className="text-[9px] text-gray-500">Net</p>
                </div>
              </div>

              {/* Efficiency & ROI */}
              <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sun className="w-3 h-3" style={{ color: COLORS.cyan }} />
                    <span className="text-[10px] text-gray-400">Panel Efficiency</span>
                  </div>
                  <span className="text-sm font-black font-mono" style={{ color: COLORS.cyan }}>{efficiencyScore}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-400">Roof Face</span>
                  </div>
                  <span className="text-xs font-bold text-white">{selectedFace}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3 h-3" style={{ color: COLORS.lime }} />
                    <span className="text-[10px] text-gray-400">ROI Payback</span>
                  </div>
                  <span className="text-xs font-bold font-mono" style={{ color: COLORS.lime }}>{paybackYears} yrs</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Leaf className="w-3 h-3" style={{ color: COLORS.lime }} />
                    <span className="text-[10px] text-gray-400">CO₂ Offset</span>
                  </div>
                  <span className="text-xs font-bold font-mono" style={{ color: COLORS.lime }}>{co2Offset.toFixed(1)} kg/mo</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3 h-3" style={{ color: COLORS.gold }} />
                    <span className="text-[10px] text-gray-400">Monthly Bill</span>
                  </div>
                  <span className="text-xs font-bold font-mono text-white">₹{monthlyBill.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Appliance toggles */}
              <div>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-2">Appliance Controls</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: 'EV Charger', icon: Car, active: evEnabled, toggle: () => setEvEnabled(!evEnabled), color: COLORS.purple, power: '7.0kW' },
                    { label: 'HVAC', icon: Thermometer, active: hvacEnabled, toggle: () => setHvacEnabled(!hvacEnabled), color: COLORS.cyan, power: '3.5kW' },
                    { label: 'Lights', icon: Lightbulb, active: lightsOn, toggle: () => setLightsOn(!lightsOn), color: COLORS.gold, power: '0.3kW' },
                    { label: 'Battery', icon: Battery, active: batteryEnabled, toggle: () => setBatteryEnabled(!batteryEnabled), color: COLORS.lime, power: '10kWh' },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        onClick={item.toggle}
                        className={`flex items-center justify-between p-2 rounded-lg border text-[10px] transition-all cursor-pointer ${
                          item.active
                            ? 'bg-white/[0.06] border-white/15 text-white font-semibold'
                            : 'bg-transparent border-white/5 text-gray-500 hover:bg-white/[0.03]'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <Icon className="w-3 h-3" style={{ color: item.active ? item.color : '#64748b' }} />
                          <span>{item.label}</span>
                        </div>
                        <span className="font-mono text-[9px]">{item.power}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grid Arbitrage Suggestion */}
              <div className="bg-gradient-to-r from-[#00F0FF]/5 to-[#39FF14]/5 border border-[#00F0FF]/15 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: COLORS.gold }} />
                  <div>
                    <p className="text-[10px] font-bold text-[#00F0FF] mb-1">Grid Arbitrage Tip</p>
                    <p className="text-[9px] text-gray-400 leading-relaxed">
                      {gridRate > 8.5
                        ? `Grid prices are high (₹${gridRate}/kWh). ${batteryEnabled ? 'Discharging home battery to power the EV bike now saves ₹420 tonight.' : 'Enable battery storage to arbitrage peak pricing.'}`
                        : gridRate < 5
                          ? `Off-peak rates active (₹${gridRate}/kWh). Ideal time to charge EV and battery storage.`
                          : `Standard rates (₹${gridRate}/kWh). Solar self-consumption is optimal right now.`
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORTED COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function Immersive3DHouseApp({ onClose }: { onClose?: () => void }) {
  const citizen = useCitizen();
  const {
    timeOfDay, setTimeOfDay,
    selectedFace, setSelectedFace,
    evEnabled, setEvEnabled,
    hvacEnabled, setHvacEnabled,
    lightsOn, setLightsOn,
    solarCapacity, setSolarCapacity,
    batteryEnabled, setBatteryEnabled,
    efficiencyScore, paybackYears, totalDemand,
    solarOutput, netPower, monthlyBill, co2Offset,
  } = citizen;

  const [cameraMode, setCameraMode] = useState<CameraMode>('thirdPerson');
  const [nearZone, setNearZone] = useState<InteractionZone | null>(null);
  const [charPos, setCharPos] = useState(new THREE.Vector3(0, 0, 5));
  const [isLocked, setIsLocked] = useState(false);

  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Monitor pointer lock state changes
  useEffect(() => {
    const handleLockChange = () => {
      setIsLocked(document.pointerLockElement !== null);
    };
    document.addEventListener('pointerlockchange', handleLockChange);
    return () => {
      document.removeEventListener('pointerlockchange', handleLockChange);
    };
  }, []);

  // Handle click on canvas container to trigger pointer lock
  const handleCanvasClick = (e: React.MouseEvent) => {
    // If the click is inside a HUD container, button, or input, do not capture pointer lock
    const target = e.target as HTMLElement;
    if (target.closest('.hud-container') || target.closest('button') || target.closest('input')) {
      return;
    }

    if (cameraMode === 'fps' || cameraMode === 'thirdPerson') {
      canvasContainerRef.current?.requestPointerLock();
    }
  };

  // E key interaction
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyE' && nearZone) {
        // Toggle the associated appliance
        switch (nearZone.id) {
          case 'ev-car': setEvEnabled(!evEnabled); break;
          case 'battery': setBatteryEnabled(!batteryEnabled); break;
          case 'hvac': setHvacEnabled(!hvacEnabled); break;
          case 'solar': {
            const faces: RoofFace[] = ['South', 'East', 'West', 'North'];
            const idx = faces.indexOf(selectedFace);
            setSelectedFace(faces[(idx + 1) % 4]);
            break;
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nearZone, evEnabled, batteryEnabled, hvacEnabled, selectedFace, setEvEnabled, setBatteryEnabled, setHvacEnabled, setSelectedFace]);

  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  return (
    <div ref={canvasContainerRef} onClick={handleCanvasClick} className="fixed inset-0 z-50 bg-[#070A0F]">
      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [0, 3.5, 10], fov: 55 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 1.5]}
      >
        <Scene
          cameraMode={cameraMode}
          timeOfDay={timeOfDay}
          selectedFace={selectedFace}
          onSelectFace={setSelectedFace}
          solarCapacity={solarCapacity}
          lightsOn={lightsOn}
          hvacEnabled={hvacEnabled}
          evEnabled={evEnabled}
          batteryEnabled={batteryEnabled}
          netPower={netPower}
          solarOutput={solarOutput}
          totalDemand={totalDemand}
          onCharacterPosition={setCharPos}
          onNearZone={setNearZone}
        />
      </Canvas>

      {/* Pointer Lock Instruction Overlay */}
      {!isLocked && (cameraMode === 'fps' || cameraMode === 'thirdPerson') && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 pointer-events-none">
          <div
            className="bg-slate-950/80 border border-cyan-500/20 backdrop-blur-md rounded-2xl p-6 text-center shadow-2xl max-w-sm pointer-events-auto cursor-pointer"
            onClick={() => canvasContainerRef.current?.requestPointerLock()}
          >
            <Sparkles className="w-8 h-8 text-cyan-400 mx-auto mb-3 animate-pulse" />
            <h3 className="text-sm font-bold text-white mb-1.5">Interactive Smart Home Twin</h3>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              Click anywhere on the scene to capture mouse controls. Use your mouse to look around and <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white font-mono text-[10px]">W</kbd> <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white font-mono text-[10px]">A</kbd> <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white font-mono text-[10px]">S</kbd> <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white font-mono text-[10px]">D</kbd> keys to walk. Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white font-mono text-[10px]">ESC</kbd> to show cursor.
            </p>
            <button className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-green-500/20 hover:from-cyan-500/35 hover:to-green-500/35 text-cyan-400 border border-cyan-500/30 font-semibold text-xs transition-all w-full cursor-pointer">
              Enter 3D Simulation
            </button>
          </div>
        </div>
      )}

      {/* Glassmorphism HUD */}
      <div className="hud-container">
        <HUD
          cameraMode={cameraMode}
          setCameraMode={setCameraMode}
          timeOfDay={timeOfDay}
          setTimeOfDay={setTimeOfDay}
          solarOutput={solarOutput}
          totalDemand={totalDemand}
          netPower={netPower}
          efficiencyScore={efficiencyScore}
          paybackYears={paybackYears}
          monthlyBill={monthlyBill}
          co2Offset={co2Offset}
          evEnabled={evEnabled}
          setEvEnabled={setEvEnabled}
          hvacEnabled={hvacEnabled}
          setHvacEnabled={setHvacEnabled}
          lightsOn={lightsOn}
          setLightsOn={setLightsOn}
          batteryEnabled={batteryEnabled}
          setBatteryEnabled={setBatteryEnabled}
          solarCapacity={solarCapacity}
          setSolarCapacity={setSolarCapacity}
          selectedFace={selectedFace}
          nearZone={nearZone}
          onClose={handleClose}
          isSimulating={citizen.isSimulating}
          setIsSimulating={citizen.setIsSimulating}
        />
      </div>
    </div>
  );
}
