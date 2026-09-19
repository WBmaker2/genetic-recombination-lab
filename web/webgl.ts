/** web/webgl.ts — WebGL 가능 여부 감지 (3D 자리 표시용). */
export function detectWebGL(): { supported: boolean; reason: string } {
  try {
    if (typeof document === "undefined") return { supported: false, reason: "DOM 없음" };
    const canvas = document.createElement("canvas");
    const ctx =
      canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl");
    if (ctx) return { supported: true, reason: "WebGL 사용 가능" };
    return { supported: false, reason: "WebGL 컨텍스트 생성 실패 — SVG 대체 제공" };
  } catch {
    return { supported: false, reason: "WebGL 예외 — SVG 대체 제공" };
  }
}
