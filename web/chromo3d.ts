/** web/chromo3d.ts — 3D 염색체 장면 (lazy load, 실패 시 호출자가 SVG 폴백). */
import * as THREE from "three";
import { CHROMO_COLORS, layoutChromatids } from "../views/chromoLayout";
import type { Phase } from "../engine/haplotypes";
import type { MeiosisMode } from "../views/meiosis";

export interface ChromoState {
  phase: Phase;
  mode: MeiosisMode;
  step: number;
}

function labelSprite(text: string): THREE.Sprite {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d 컨텍스트 없음");
  ctx.fillStyle = "#0F172A";
  ctx.font = "700 44px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 128, 48);
  const tex = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.6, 0.6, 1);
  return sprite;
}

function stripedTexture(base: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("2d 컨텍스트 없음");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 64, 64);
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 7;
  for (let x = -64; x < 128; x += 18) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 32, 64);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

export interface ChromoHandle {
  update: (s: ChromoState) => void;
  dispose: () => void;
}

export function mountChromo3D(container: HTMLElement, initial: ChromoState): ChromoHandle {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  container.appendChild(renderer.domElement);
  renderer.domElement.setAttribute("role", "img");
  renderer.domElement.setAttribute("aria-label", "3D 염색체 모형 (교육용 과장)");

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#FFFFFF");
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  scene.add(new THREE.AmbientLight(0xffffff, 1.15));
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(3, 5, 4);
  scene.add(key);

  const group = new THREE.Group();
  scene.add(group);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** 그룹 전체가 화면에 들어오도록 카메라 맞춤 (컨테이너 크기·단계별 배치 변동 대응). */
  const fitCamera = (): void => {
    const box = new THREE.Box3().setFromObject(group);
    if (box.isEmpty()) return;
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const fitSize = Math.max(size.y, size.x / Math.max(camera.aspect, 0.5));
    const dist = (fitSize / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))) * 1.45;
    const dir = new THREE.Vector3(0, 0.22, 1).normalize();
    camera.position.copy(center).addScaledVector(dir, Math.max(dist, 3));
    camera.lookAt(center);
  };

  const resize = (): void => {
    const w = Math.max(1, container.clientWidth);
    const h = Math.max(1, Math.round(w * 0.62));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    fitCamera();
  };

  const build = (s: ChromoState): void => {
    while (group.children.length > 0) {
      const child = group.children.pop();
      if (child) {
        child.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.geometry.dispose();
            const mat = mesh.material as THREE.Material | THREE.Material[];
            (Array.isArray(mat) ? mat : [mat]).forEach((m) => m.dispose());
          }
        });
      }
    }
    for (const c of layoutChromatids(s.phase, s.mode, s.step)) {
      const color = new THREE.Color(CHROMO_COLORS[c.alleles]);
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.55,
        metalness: 0.05,
        map: c.recombinant ? stripedTexture(`#${color.getHexString()}`) : null,
      });
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 1.7, 6, 18), mat);
      body.position.set(c.x, 0.4, 0);
      group.add(body);
      const centro = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 18, 14),
        new THREE.MeshStandardMaterial({ color: "#0F172A", roughness: 0.4 }),
      );
      centro.position.set(c.x, 0.4, 0);
      group.add(centro);
      const label = labelSprite(`${c.alleles} · ${c.id}`);
      label.position.set(c.x, 2.0, 0);
      group.add(label);
      if (c.crossover) {
        const band = new THREE.Mesh(
          new THREE.TorusGeometry(0.4, 0.07, 12, 28),
          new THREE.MeshStandardMaterial({ color: "#B45309", roughness: 0.4 }),
        );
        band.position.set(c.x, 0.4, 0);
        band.rotation.x = Math.PI / 2;
        group.add(band);
      }
    }
    resize();
  };

  let raf = 0;
  let alive = true;
  const tick = (): void => {
    if (!alive) return;
    if (!reduced) group.rotation.y += 0.004;
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  };

  const ro = new ResizeObserver(resize);
  ro.observe(container);
  build(initial);
  tick();

  return {
    update: (s) => build(s),
    dispose: () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      build({ phase: initial.phase, mode: initial.mode, step: initial.step });
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
