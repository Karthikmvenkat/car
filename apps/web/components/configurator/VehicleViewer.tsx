'use client';

/**
 * Interactive 3D vehicle viewer (React Three Fiber).
 *
 * - Loads the optimised, licensed web GLB produced by the asset pipeline
 *   (Meshopt-compressed; decoded locally, no CDN dependency).
 * - Live paint changes are applied ONLY to the materials the pipeline/admin
 *   mapped as BODY_PAINT. Glass, tyres, wheels, lights, trim, badges and the
 *   interior keep their original materials. The camera is never touched by a
 *   paint change.
 * - Studio lighting is built from local Lightformers (no external HDRI fetch).
 * - Exposes an imperative API (via `apiRef`) used by the admin review page to
 *   capture consistent geometry renders for every required angle and colour.
 */

import {
  Component,
  MutableRefObject,
  ReactNode,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  ContactShadows,
  Environment,
  Lightformer,
  OrbitControls,
  useGLTF,
  useProgress,
} from '@react-three/drei';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { CameraView, RenderingParameters } from '@/lib/configurator-types';

export interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
}

export interface CaptureOptions {
  view: CameraView;
  width: number;
  height: number;
  paint?: RenderingParameters | null;
  mime?: 'image/webp' | 'image/jpeg' | 'image/png';
  quality?: number;
}

export interface ViewerApi {
  setView: (view: CameraView, animate?: boolean) => void;
  reset: () => void;
  getCameraState: () => CameraState | null;
  capture: (opts: CaptureOptions) => Promise<Blob>;
}

export interface ModelInfo {
  materialNames: string[];
  paintedMaterials: string[];
  missingBodyPaint: string[];
  dimensions: { length: number; width: number; height: number };
}

export interface VehicleViewerProps {
  url: string;
  bodyPaintMaterials: string[];
  paint: RenderingParameters | null;
  lengthAxis?: 'X' | 'Y' | 'Z';
  scaleToMeters?: number;
  initialView?: CameraView;
  initialCamera?: CameraState | null;
  background?: string;
  /** Required for reliable canvas capture (admin review page). */
  preserveDrawingBuffer?: boolean;
  apiRef?: MutableRefObject<ViewerApi | null>;
  onLoaded?: (info: ModelInfo) => void;
  onError?: (error: Error) => void;
  onInteract?: () => void;
  className?: string;
}

const FOV = 30;
const DEFAULT_PAINT: RenderingParameters = {
  baseColor: '#9a9d9f', metalness: 0.6, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.05,
};

export function hasWebGL(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

// ── Model ──────────────────────────────────────────────────────────────────

interface Bounds {
  length: number;
  width: number;
  height: number;
}

function CarModel({
  url,
  bodyPaintMaterials,
  paintRef,
  lengthAxis,
  scaleToMeters,
  onBounds,
  onLoaded,
}: {
  url: string;
  bodyPaintMaterials: string[];
  paintRef: MutableRefObject<PaintController>;
  lengthAxis: 'X' | 'Y' | 'Z';
  scaleToMeters: number;
  onBounds: (b: Bounds) => void;
  onLoaded?: (info: ModelInfo) => void;
}) {
  // No Draco (the pipeline strips it); Meshopt decoded locally via three-stdlib.
  const gltf = useGLTF(url, false, true);

  const { root, bounds, info, paintMaterials } = useMemo(() => {
    const scene = gltf.scene.clone(true);
    const wrapper = new THREE.Group();
    const oriented = new THREE.Group();
    // Normalise so the vehicle's length runs along Z (glTF forward convention).
    if (lengthAxis === 'X') oriented.rotation.y = Math.PI / 2;
    if (lengthAxis === 'Y') oriented.rotation.x = Math.PI / 2;
    oriented.add(scene);
    wrapper.add(oriented);

    // Body-paint materials: replace with one clear-coated physical material per
    // mapped source material (shared across all meshes that use it).
    const wanted = new Set(bodyPaintMaterials);
    const replaced = new Map<string, THREE.MeshPhysicalMaterial>();
    const allNames = new Set<string>();
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      const swap = (m: THREE.Material): THREE.Material => {
        allNames.add(m.name);
        if (!wanted.has(m.name)) return m;
        let phys = replaced.get(m.name);
        if (!phys) {
          const src = m as THREE.MeshStandardMaterial;
          phys = new THREE.MeshPhysicalMaterial({
            name: m.name,
            color: new THREE.Color(DEFAULT_PAINT.baseColor),
            metalness: DEFAULT_PAINT.metalness,
            roughness: DEFAULT_PAINT.roughness,
            clearcoat: DEFAULT_PAINT.clearcoat,
            clearcoatRoughness: DEFAULT_PAINT.clearcoatRoughness,
            // Keep surface detail from the original material, but not its base colour.
            normalMap: src.normalMap ?? null,
            normalScale: src.normalScale ? src.normalScale.clone() : undefined,
            aoMap: src.aoMap ?? null,
            side: src.side,
            envMapIntensity: 1.2,
          });
          replaced.set(m.name, phys);
        }
        return phys;
      };
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(swap) : swap(mesh.material);
    });

    // Scale: trust the pipeline's unit guess if it yields a car-sized object,
    // otherwise normalise to a typical 4.5 m length.
    wrapper.updateMatrixWorld(true);
    let box = new THREE.Box3().setFromObject(wrapper);
    const rawSize = box.getSize(new THREE.Vector3());
    const rawLength = Math.max(rawSize.x, rawSize.z);
    const metres = rawLength * scaleToMeters;
    const scale = metres >= 2.5 && metres <= 7 ? scaleToMeters : 4.5 / (rawLength || 1);
    wrapper.scale.setScalar(scale);
    wrapper.updateMatrixWorld(true);
    box = new THREE.Box3().setFromObject(wrapper);
    const center = box.getCenter(new THREE.Vector3());
    wrapper.position.set(-center.x, -box.min.y, -center.z);
    const size = box.getSize(new THREE.Vector3());

    const materials = Array.from(replaced.values());
    return {
      root: wrapper,
      paintMaterials: materials,
      bounds: { length: size.z, width: size.x, height: size.y },
      info: {
        materialNames: Array.from(allNames),
        paintedMaterials: Array.from(replaced.keys()),
        missingBodyPaint: bodyPaintMaterials.filter((n) => !replaced.has(n)),
        dimensions: { length: size.z, width: size.x, height: size.y },
      } as ModelInfo,
    };
  }, [gltf, bodyPaintMaterials, lengthAxis, scaleToMeters]);

  useLayoutEffect(() => {
    paintRef.current.materials = paintMaterials;
    paintRef.current.snap();
    onBounds(bounds);
    onLoaded?.(info);
    return () => {
      paintRef.current.materials = [];
      paintMaterials.forEach((m) => m.dispose());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [root]);

  useFrame((_, dt) => paintRef.current.step(dt));

  return <primitive object={root} />;
}

/** Smoothly animates body-paint materials towards the selected colour preset. */
class PaintController {
  materials: THREE.MeshPhysicalMaterial[] = [];
  target: RenderingParameters = DEFAULT_PAINT;
  private targetColor = new THREE.Color(DEFAULT_PAINT.baseColor);

  setTarget(p: RenderingParameters | null) {
    this.target = p ?? DEFAULT_PAINT;
    this.targetColor.set(this.target.baseColor);
  }

  apply(p: RenderingParameters) {
    const c = new THREE.Color(p.baseColor);
    for (const m of this.materials) {
      m.color.copy(c);
      m.metalness = p.metalness;
      m.roughness = p.roughness;
      m.clearcoat = p.clearcoat;
      m.clearcoatRoughness = p.clearcoatRoughness;
      m.iridescence = p.iridescence ?? 0;
    }
  }

  snap() {
    this.apply(this.target);
  }

  step(dt: number) {
    if (!this.materials.length) return;
    const k = 1 - Math.exp(-dt * 8);
    const t = this.target;
    for (const m of this.materials) {
      m.color.lerp(this.targetColor, k);
      m.metalness += (t.metalness - m.metalness) * k;
      m.roughness += (t.roughness - m.roughness) * k;
      m.clearcoat += (t.clearcoat - m.clearcoat) * k;
      m.clearcoatRoughness += (t.clearcoatRoughness - m.clearcoatRoughness) * k;
      m.iridescence += ((t.iridescence ?? 0) - m.iridescence) * k;
    }
  }
}

// ── Camera rig ─────────────────────────────────────────────────────────────

function viewPose(view: CameraView, b: Bounds): CameraState {
  const L = Math.max(b.length, 1);
  const H = Math.max(b.height, 0.5);
  const W = Math.max(b.width, 0.5);
  const d = ((L * 0.5) / Math.tan(THREE.MathUtils.degToRad(FOV / 2))) * 1.25;
  const ty = H * 0.42;
  // glTF convention: vehicle faces +Z, so the car's left side is +X.
  switch (view) {
    case 'front':
      return { position: [0, H * 0.75, d * 0.95], target: [0, ty, 0] };
    case 'rear':
      return { position: [0, H * 0.8, -d * 0.95], target: [0, ty, 0] };
    case 'left':
      return { position: [d, H * 0.6, 0], target: [0, ty, 0] };
    case 'right':
      return { position: [-d, H * 0.6, 0], target: [0, ty, 0] };
    case 'top':
      return { position: [0, d * 1.15, 0.01], target: [0, 0, 0] };
    case 'interior':
      return { position: [-W * 0.18, H * 0.78, -L * 0.04], target: [-W * 0.18, H * 0.68, L * 0.5] };
    case 'front-three-quarter':
    default: {
      const dir = new THREE.Vector3(0.62, 0.3, 0.78).normalize().multiplyScalar(d);
      return { position: [dir.x, dir.y + H * 0.2, dir.z], target: [0, ty, 0] };
    }
  }
}

interface RigProps {
  bounds: Bounds | null;
  initialView: CameraView;
  initialCamera?: CameraState | null;
  apiRef?: MutableRefObject<ViewerApi | null>;
  paintRef: MutableRefObject<PaintController>;
  background?: string;
  onInteract?: () => void;
}

function CameraRig({ bounds, initialView, initialCamera, apiRef, paintRef, background, onInteract }: RigProps) {
  const { camera, gl, scene, size } = useThree();
  const controls = useRef<OrbitControlsImpl | null>(null);
  const goal = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 } | null>(null);
  const initialised = useRef(false);
  const cam = camera as THREE.PerspectiveCamera;

  const place = (pose: CameraState, animate: boolean) => {
    const pos = new THREE.Vector3(...pose.position);
    const target = new THREE.Vector3(...pose.target);
    if (animate) {
      goal.current = { pos, target };
    } else {
      goal.current = null;
      cam.position.copy(pos);
      controls.current?.target.copy(target);
      cam.lookAt(target);
      controls.current?.update();
    }
  };

  // Initial framing once the model's bounds are known (not on paint changes).
  useEffect(() => {
    if (!bounds || initialised.current) return;
    initialised.current = true;
    if (initialCamera) place(initialCamera, false);
    else place(viewPose(initialView, bounds), false);
    if (controls.current) {
      controls.current.minDistance = bounds.length * 0.3;
      controls.current.maxDistance = bounds.length * 4;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounds]);

  useFrame((_, dt) => {
    const g = goal.current;
    if (!g || !controls.current) return;
    const k = 1 - Math.exp(-dt * 5);
    cam.position.lerp(g.pos, k);
    controls.current.target.lerp(g.target, k);
    controls.current.update();
    if (cam.position.distanceTo(g.pos) < 0.005 && controls.current.target.distanceTo(g.target) < 0.005) {
      goal.current = null;
    }
  });

  useEffect(() => {
    if (!apiRef) return;
    apiRef.current = {
      setView: (view, animate = true) => bounds && place(viewPose(view, bounds), animate),
      reset: () => bounds && place(viewPose(initialView, bounds), true),
      getCameraState: () =>
        controls.current
          ? {
              position: cam.position.toArray().map((n) => +n.toFixed(4)) as CameraState['position'],
              target: controls.current.target.toArray().map((n) => +n.toFixed(4)) as CameraState['target'],
            }
          : null,
      capture: async ({ view, width, height, paint, mime = 'image/webp', quality = 0.92 }) => {
        if (!bounds) throw new Error('Model not loaded');
        const prevPos = cam.position.clone();
        const prevTarget = controls.current?.target.clone() ?? new THREE.Vector3();
        const prevRatio = gl.getPixelRatio();
        const prevAspect = cam.aspect;
        const prevGoal = goal.current;
        goal.current = null;
        try {
          gl.setPixelRatio(1);
          gl.setSize(width, height, false);
          cam.aspect = width / height;
          cam.updateProjectionMatrix();
          const pose = viewPose(view, bounds);
          cam.position.set(...pose.position);
          cam.lookAt(new THREE.Vector3(...pose.target));
          if (paint) paintRef.current.apply(paint);
          if (background) scene.background = new THREE.Color(background);
          gl.render(scene, cam);
          let dataUrl = gl.domElement.toDataURL(mime, quality);
          if (mime !== 'image/png' && dataUrl.startsWith('data:image/png')) {
            dataUrl = gl.domElement.toDataURL('image/jpeg', quality);
          }
          const blob = await (await fetch(dataUrl)).blob();
          return blob;
        } finally {
          paintRef.current.snap();
          gl.setPixelRatio(prevRatio);
          gl.setSize(size.width, size.height, false);
          cam.aspect = prevAspect;
          cam.updateProjectionMatrix();
          cam.position.copy(prevPos);
          controls.current?.target.copy(prevTarget);
          cam.lookAt(prevTarget);
          controls.current?.update();
          goal.current = prevGoal;
        }
      },
    };
    return () => {
      if (apiRef) apiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bounds, size.width, size.height, background]);

  return (
    <OrbitControls
      ref={controls as any}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      enablePan={false}
      maxPolarAngle={Math.PI / 2 - 0.04}
      rotateSpeed={0.7}
      zoomSpeed={0.8}
      onStart={() => {
        goal.current = null;
        onInteract?.();
      }}
    />
  );
}

function Studio({ bounds }: { bounds: Bounds | null }) {
  const L = bounds?.length ?? 4.5;
  return (
    <>
      <ambientLight intensity={0.15} />
      <directionalLight position={[5, 8, 5]} intensity={0.6} />
      <Environment resolution={256} frames={1}>
        <color attach="background" args={['#2a2d2b']} />
        {/* Ceiling strip lights */}
        {[-6, -2, 2, 6].map((z) => (
          <Lightformer key={z} intensity={2.2} rotation-x={Math.PI / 2} position={[0, 5, z]} scale={[12, 1.2, 1]} />
        ))}
        {/* Side softboxes */}
        <Lightformer intensity={1.6} rotation-y={Math.PI / 2} position={[-12, 2, 0]} scale={[30, 3, 1]} />
        <Lightformer intensity={1.6} rotation-y={-Math.PI / 2} position={[12, 2, 0]} scale={[30, 3, 1]} />
        {/* Key light */}
        <Lightformer form="ring" intensity={6} scale={3} position={[8, 6, 8]} onUpdate={(self) => self.lookAt(0, 0, 0)} />
        {/* Floor bounce */}
        <Lightformer intensity={0.6} rotation-x={-Math.PI / 2} position={[0, -3, 0]} scale={[20, 20, 1]} color="#d8dad5" />
      </Environment>
      <ContactShadows key={L.toFixed(3)} position={[0, 0.002, 0]} opacity={0.65} scale={L * 2.2} blur={2.4} far={Math.max(L * 0.6, 1.5)} resolution={512} frames={1} />
    </>
  );
}

// ── Error boundary + loader overlay ────────────────────────────────────────

class ViewerErrorBoundary extends Component<
  { children: ReactNode; onError?: (e: Error) => void; fallback: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error) {
    this.props.onError?.(error);
  }
  render() {
    return this.state.error ? this.props.fallback : this.props.children;
  }
}

function LoadingOverlay() {
  const { active, progress } = useProgress();
  if (!active) return null;
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3">
      <div className="h-1 w-48 overflow-hidden rounded-full bg-black/10">
        <div className="h-full bg-primary-text transition-all" style={{ width: `${Math.round(progress)}%` }} />
      </div>
      <p className="text-caption text-primary-muted">Loading 3D model… {Math.round(progress)}%</p>
    </div>
  );
}

// ── Public component ───────────────────────────────────────────────────────

export default function VehicleViewer({
  url,
  bodyPaintMaterials,
  paint,
  lengthAxis = 'Z',
  scaleToMeters = 1,
  initialView = 'front-three-quarter',
  initialCamera = null,
  background,
  preserveDrawingBuffer = false,
  apiRef,
  onLoaded,
  onError,
  onInteract,
  className,
}: VehicleViewerProps) {
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const paintRef = useRef(new PaintController());

  useEffect(() => setWebgl(hasWebGL()), []);
  // Colour changes only retarget the paint controller — camera & model untouched.
  useEffect(() => {
    paintRef.current.setTarget(paint);
  }, [paint]);

  // Stable identity so the model is not rebuilt on every parent render.
  const paintKey = bodyPaintMaterials.join('\u0000');
  const stableMaterials = useMemo(() => bodyPaintMaterials, [paintKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const failure = (
    <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
      <p className="text-body-sm text-primary-muted">The 3D model could not be loaded. Please refresh, or view the gallery below.</p>
    </div>
  );

  if (webgl === false) {
    return (
      <div className={`relative flex items-center justify-center ${className ?? ''}`}>
        <p className="max-w-sm p-6 text-center text-body-sm text-primary-muted">
          Your browser or device does not support WebGL, so the interactive 3D view is unavailable. The rendered gallery below shows the same vehicle.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative h-full w-full ${className ?? ''}`} style={background ? { background } : undefined}>
      {webgl && (
        <ViewerErrorBoundary onError={onError} fallback={failure}>
          <Canvas
            shadows={false}
            dpr={[1, 2]}
            camera={{ fov: FOV, near: 0.05, far: 200, position: [6, 2.5, 7] }}
            gl={{ antialias: true, preserveDrawingBuffer, alpha: !background }}
            onCreated={({ gl }) => {
              gl.toneMapping = THREE.ACESFilmicToneMapping;
              gl.toneMappingExposure = 1;
            }}
          >
            {background && <color attach="background" args={[background]} />}
            <Suspense fallback={null}>
              <CarModel
                key={url}
                url={url}
                bodyPaintMaterials={stableMaterials}
                paintRef={paintRef}
                lengthAxis={lengthAxis}
                scaleToMeters={scaleToMeters}
                onBounds={setBounds}
                onLoaded={onLoaded}
              />
              <Studio bounds={bounds} />
            </Suspense>
            <CameraRig
              bounds={bounds}
              initialView={initialView}
              initialCamera={initialCamera}
              apiRef={apiRef}
              paintRef={paintRef}
              background={background}
              onInteract={onInteract}
            />
          </Canvas>
        </ViewerErrorBoundary>
      )}
      <LoadingOverlay />
    </div>
  );
}
