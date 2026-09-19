import { defineConfig } from "vite";

// 저장소 하위 경로 배포 검증을 위해 상대 base 사용.
export default defineConfig({
  root: "web",
  base: "./",
  build: {
    outDir: "../dist-web",
    emptyOutDir: true,
  },
});
