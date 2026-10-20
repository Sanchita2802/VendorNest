import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Text, RoundedBox, ContactShadows, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from '../../theme/ThemeContext';

interface ModularUnitProps {
  position: [number, number, number];
  color: string;
  name: string;
  iconText: string;
  subtext: string;
  onClick: () => void;
  isDark: boolean;
  isZooming: boolean;
}

const ModularUnit: React.FC<ModularUnitProps> = ({
  position,
  color,
  name,
  iconText,
  subtext,
  onClick,
  isDark,
  isZooming,
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    if (meshRef.current) {
      const targetY = position[1] + (hovered ? 0.45 : 0);
      meshRef.current.position.y = THREE.MathUtils.damp(
        meshRef.current.position.y,
        targetY,
        8,
        delta
      );
      if (hovered && !isZooming) {
        meshRef.current.rotation.y += delta * 0.4;
      } else {
        meshRef.current.rotation.y = THREE.MathUtils.damp(
          meshRef.current.rotation.y,
          0,
          4,
          delta
        );
      }
    }
  });

  return (
    <group
      ref={meshRef}
      position={[position[0], position[1], position[2]]}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Unit Clay Box */}
      <RoundedBox
        args={[2.1, 1.4, 1.8]}
        radius={0.25}
        smoothness={4}
        scale={hovered ? [1.06, 1.06, 1.06] : [1, 1, 1]}
      >
        <meshStandardMaterial
          color={color}
          roughness={0.42}
          metalness={0.08}
        />
      </RoundedBox>

      {/* Roof / Balcony Accent */}
      <RoundedBox
        args={[2.18, 0.16, 1.88]}
        radius={0.06}
        position={[0, 0.76, 0]}
      >
        <meshStandardMaterial
          color={isDark ? '#2D325E' : '#FFFFFF'}
          roughness={0.3}
        />
      </RoundedBox>

      {/* Stylized Floating Icon Pill */}
      <Float speed={2} rotationIntensity={0.15} floatIntensity={0.25}>
        <group position={[0, 1.35, 0]}>
          <RoundedBox args={[1.7, 0.52, 0.2]} radius={0.15}>
            <meshStandardMaterial
              color={isDark ? '#1F2347' : '#FFFFFF'}
              roughness={0.2}
            />
          </RoundedBox>
          <Text
            position={[0, 0, 0.14]}
            fontSize={0.24}
            color={isDark ? '#F2F4FF' : '#1B2140'}
            anchorX="center"
            anchorY="middle"
            font={undefined}
          >
            {iconText}
          </Text>
        </group>
      </Float>

      {/* Label on the front surface */}
      <Text
        position={[0, 0.06, 0.94]}
        fontSize={0.24}
        color={isDark ? '#FFFFFF' : '#1B2140'}
        anchorX="center"
        anchorY="middle"
      >
        {name}
      </Text>

      <Text
        position={[0, -0.28, 0.94]}
        fontSize={0.14}
        color={isDark ? '#C5CAEC' : '#4A5272'}
        anchorX="center"
        anchorY="middle"
      >
        {subtext}
      </Text>
    </group>
  );
};

// Floating background decorative geometric items
const FloatingShapes: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  return (
    <>
      <Float speed={1.5} rotationIntensity={1} floatIntensity={1.2}>
        <mesh position={[-4.5, 2.5, -2]}>
          <torusGeometry args={[0.5, 0.18, 16, 32]} />
          <meshStandardMaterial color={isDark ? '#8E94FF' : '#7C83FD'} roughness={0.4} />
        </mesh>
      </Float>
      <Float speed={2} rotationIntensity={1.5} floatIntensity={1}>
        <mesh position={[4.8, 2, -1]}>
          <dodecahedronGeometry args={[0.45]} />
          <meshStandardMaterial color={isDark ? '#4FD1A8' : '#5ED6B0'} roughness={0.5} />
        </mesh>
      </Float>
      <Float speed={1.8} rotationIntensity={1.2} floatIntensity={1.4}>
        <mesh position={[-3.8, -1.2, 1.5]}>
          <sphereGeometry args={[0.38, 32, 32]} />
          <meshStandardMaterial color={isDark ? '#FF9E80' : '#FFAB91'} roughness={0.35} />
        </mesh>
      </Float>
      <Float speed={1.2} rotationIntensity={0.8} floatIntensity={0.8}>
        <mesh position={[4.2, -1.5, 1.2]}>
          <cylinderGeometry args={[0.3, 0.3, 0.45, 24]} />
          <meshStandardMaterial color={isDark ? '#FFD166' : '#FFD97A'} roughness={0.4} />
        </mesh>
      </Float>
    </>
  );
};

// Camera Controller that Auto-Fits the Building to the Viewport with Safe Areas
const SceneCameraController: React.FC<{
  sceneRef: React.RefObject<THREE.Group | null>;
  controlsRef: React.RefObject<any>;
  zoomingUnit: string | null;
  unitPositions: Record<string, [number, number, number]>;
}> = ({ sceneRef, controlsRef, zoomingUnit, unitPositions }) => {
  const { camera, size } = useThree();
  const targetCamPos = useRef(new THREE.Vector3(0, 2.8, 8.2));
  const targetLookAt = useRef(new THREE.Vector3(0, 0.4, 0));
  const hasInitialized = useRef(false);
  const isInteracting = useRef(false);

  const computeFit = useCallback(() => {
    if (!sceneRef.current) return;
    const group = sceneRef.current;

    // 1. Calculate bounding box of the entire building group
    const box = new THREE.Box3().setFromObject(group);

    if (box.isEmpty()) {
      // Safety net fallback: scale scene uniformly by 1.9 (desktop) / 1.5 (mobile)
      const isMobile = size.width < 768;
      const fallbackScale = isMobile ? 1.5 : 1.9;
      targetCamPos.current.set(0, 2.8 / fallbackScale, 8.2 / fallbackScale);
      targetLookAt.current.set(0, 0.4, 0);
      return;
    }

    const boxSize = new THREE.Vector3();
    box.getSize(boxSize);
    const boxCenter = new THREE.Vector3();
    box.getCenter(boxCenter);

    const persCamera = camera as THREE.PerspectiveCamera;
    const fov = (persCamera.fov * Math.PI) / 180;

    // FIX 3 Safe Areas:
    // Top safe area = 70px (for navbar overlay)
    // Bottom safe area = 90px (for SQL Terminal overlay & bottom buttons)
    // Left safe area = 24px
    // Right safe area = 64px (for Ask VendorNest bubble & progress dots)
    const safeTop = 70;
    const safeBottom = 90;
    const safeLeft = 24;
    const safeRight = 64;

    const usableH = Math.max(120, size.height - (safeTop + safeBottom));
    const usableW = Math.max(120, size.width - (safeLeft + safeRight));

    const heightRatio = usableH / size.height;
    const widthRatio = usableW / size.width;

    // Distance needed to fit height vs width in perspective camera
    const dH = (boxSize.y / 2) / (Math.tan(fov / 2) * heightRatio);
    const dW = (boxSize.x / 2) / (Math.tan(fov / 2) * persCamera.aspect * widthRatio);

    // FILL = 0.90: building fills 85-92% of the canvas limiting dimension
    const FILL = 0.90;
    const baseDistance = (Math.max(dH, dW) / FILL) + (boxSize.z * 0.5);

    // Camera near and far bounds so nothing clips at new scale
    persCamera.near = 0.1;
    persCamera.far = Math.max(120, baseDistance * 10);
    persCamera.updateProjectionMatrix();

    // Direction vector maintaining existing elevation and azimuth
    const dir = new THREE.Vector3(0, 2.8, 8.2).normalize();

    // Look-at target: slightly raised by +3% of box height and adjusted for safe area
    const worldPixelY = (2 * Math.tan(fov / 2) * baseDistance) / size.height;
    const safeOffsetShiftY = ((safeBottom - safeTop) / 2) * worldPixelY;
    const safeOffsetShiftX = ((safeRight - safeLeft) / 2) * worldPixelY;

    const targetY = boxCenter.y + (boxSize.y * 0.03) + safeOffsetShiftY;
    const targetX = boxCenter.x - safeOffsetShiftX * 0.5;
    const targetZ = boxCenter.z;

    targetLookAt.current.set(targetX, targetY, targetZ);
    targetCamPos.current.copy(targetLookAt.current).add(dir.clone().multiplyScalar(baseDistance));

    if (!hasInitialized.current) {
      camera.position.copy(targetCamPos.current);
      if (controlsRef.current) {
        controlsRef.current.target.copy(targetLookAt.current);
        controlsRef.current.update();
      }
      hasInitialized.current = true;
    }
  }, [camera, size.width, size.height, sceneRef, controlsRef]);

  // Debounced recompute on resize
  useEffect(() => {
    const timer = setTimeout(() => {
      computeFit();
    }, 80);
    return () => clearTimeout(timer);
  }, [computeFit, size.width, size.height]);

  useFrame((_, delta) => {
    if (zoomingUnit && unitPositions[zoomingUnit]) {
      // Smooth zoom into clicked unit
      const uPos = unitPositions[zoomingUnit];
      const zoomTarget = new THREE.Vector3(uPos[0], uPos[1] + 0.2, uPos[2]);
      const zoomCamPos = zoomTarget.clone().add(new THREE.Vector3(0, 0.6, 3.2));

      camera.position.lerp(zoomCamPos, Math.min(1, delta * 5));
      if (controlsRef.current) {
        controlsRef.current.target.lerp(zoomTarget, Math.min(1, delta * 5));
        controlsRef.current.update();
      }
    } else if (!isInteracting.current && hasInitialized.current) {
      // Gentle glide to fitted camera position if not actively dragging
      camera.position.lerp(targetCamPos.current, Math.min(1, delta * 4));
      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLookAt.current, Math.min(1, delta * 4));
        controlsRef.current.update();
      }
    }
  });

  return null;
};

export const NestBuildingScene: React.FC<{
  onSelectModule: (module: string) => void;
}> = ({ onSelectModule }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const sceneRef = useRef<THREE.Group>(null);
  const controlsRef = useRef<any>(null);
  const [zoomingUnit, setZoomingUnit] = useState<string | null>(null);

  const unitPositions: Record<string, [number, number, number]> = {
    vendors: [-2.3, -0.2, 0.8],
    products: [2.3, -0.2, 0.8],
    orders: [0, 1.4, 0],
    payments: [0, -0.2, -1.2],
    search: [0, 3.0, 0],
  };

  const modulesList = [
    { id: 'vendors', name: 'Vendors', label: 'Module 1' },
    { id: 'products', name: 'Products', label: 'Module 2' },
    { id: 'orders', name: 'Orders', label: 'Module 3' },
    { id: 'payments', name: 'Payments', label: 'Module 4' },
    { id: 'search', name: 'Search', label: 'Module 5' },
  ];

  const handleUnitClick = (moduleId: string) => {
    setZoomingUnit(moduleId);
    setTimeout(() => {
      onSelectModule(moduleId);
    }, 380);
  };

  return (
    <div
      className="w-full h-full relative select-none"
      style={{ touchAction: 'pan-y' }}
    >
      <Canvas
        camera={{ position: [0, 2.8, 8.2], fov: 42, near: 0.1, far: 200 }}
        dpr={[1, 1.75]}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <ambientLight intensity={isDark ? 0.75 : 1.1} />
        <directionalLight
          position={[8, 12, 10]}
          intensity={isDark ? 1.4 : 1.8}
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-camera-near={0.1}
          shadow-camera-far={40}
          shadow-camera-left={-8}
          shadow-camera-right={8}
          shadow-camera-top={8}
          shadow-camera-bottom={-8}
        />
        <directionalLight
          position={[-6, 4, -4]}
          intensity={isDark ? 0.5 : 0.8}
          color={isDark ? '#6B7391' : '#E8ECF7'}
        />

        {/* Orbit controls for free intuitive rotation */}
        <OrbitControls
          ref={controlsRef}
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 2 + 0.1}
          minPolarAngle={Math.PI / 3.5}
          rotateSpeed={0.65}
          touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
        />

        {/* Auto-fitting Camera Controller */}
        <SceneCameraController
          sceneRef={sceneRef}
          controlsRef={controlsRef}
          zoomingUnit={zoomingUnit}
          unitPositions={unitPositions}
        />

        {/* Single Parent Group for the Building + Platform + Shapes */}
        <group ref={sceneRef}>
          {/* Floating Decorative Shapes */}
          <FloatingShapes isDark={isDark} />

          {/* Stacked Building Structure */}
          <group position={[0, -0.4, 0]}>
            {/* Ground Platform */}
            <RoundedBox
              args={[7.8, 0.35, 5.5]}
              radius={0.16}
              position={[0, -1.1, 0]}
            >
              <meshStandardMaterial
                color={isDark ? '#181B38' : '#E2E7F3'}
                roughness={0.7}
              />
            </RoundedBox>

            {/* Unit 1: Vendors (Ground Left) */}
            <ModularUnit
              position={unitPositions.vendors}
              color={isDark ? '#264E3F' : '#D1F5E8'}
              name="Vendors"
              iconText="🏢 Module 1"
              subtext="Directory & Contacts"
              isDark={isDark}
              isZooming={zoomingUnit === 'vendors'}
              onClick={() => handleUnitClick('vendors')}
            />

            {/* Unit 2: Products (Ground Right) */}
            <ModularUnit
              position={unitPositions.products}
              color={isDark ? '#4A3B18' : '#FFECCC'}
              name="Products"
              iconText="📦 Module 2"
              subtext="Goods & Services"
              isDark={isDark}
              isZooming={zoomingUnit === 'products'}
              onClick={() => handleUnitClick('products')}
            />

            {/* Unit 3: Purchase Orders (First Floor Center) */}
            <ModularUnit
              position={unitPositions.orders}
              color={isDark ? '#46294D' : '#FBE3EB'}
              name="Orders"
              iconText="📋 Module 3"
              subtext="Track & Line Items"
              isDark={isDark}
              isZooming={zoomingUnit === 'orders'}
              onClick={() => handleUnitClick('orders')}
            />

            {/* Unit 4: Payments (Ground Center-Back) */}
            <ModularUnit
              position={unitPositions.payments}
              color={isDark ? '#233857' : '#D9EFFF'}
              name="Payments"
              iconText="💳 Module 4"
              subtext="Installments & Dues"
              isDark={isDark}
              isZooming={zoomingUnit === 'payments'}
              onClick={() => handleUnitClick('payments')}
            />

            {/* Unit 5: Search & AI (Top Level Crown) */}
            <ModularUnit
              position={unitPositions.search}
              color={isDark ? '#2A2C63' : '#E1E4FD'}
              name="Search"
              iconText="🔍 Module 5"
              subtext="Natural Query & 3NF"
              isDark={isDark}
              isZooming={zoomingUnit === 'search'}
              onClick={() => handleUnitClick('search')}
            />

            {/* Soft Ground Contact Shadow */}
            <ContactShadows
              position={[0, -1.25, 0]}
              opacity={isDark ? 0.6 : 0.35}
              scale={16}
              blur={1.5}
              far={6}
            />
          </group>
        </group>
      </Canvas>

      {/* 5-Dot Module Progress Indicator on Right Side */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2.5 p-2 rounded-full bg-[var(--surface-elevated)]/80 backdrop-blur-md border border-[var(--text-muted)]/15 shadow-lg">
        {modulesList.map((m) => (
          <button
            key={m.id}
            onClick={() => handleUnitClick(m.id)}
            className="w-3 h-3 rounded-full transition-all duration-200 bg-[var(--text-muted)]/40 hover:bg-[var(--accent-primary)] hover:scale-125 group relative"
            title={`${m.label}: ${m.name}`}
            aria-label={`Jump to ${m.name}`}
          >
            <span className="hidden group-hover:block absolute right-5 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded-md text-[10px] font-heading font-bold whitespace-nowrap bg-[var(--surface-elevated)] text-[var(--text-primary)] shadow-md border border-[var(--text-muted)]/15">
              {m.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
