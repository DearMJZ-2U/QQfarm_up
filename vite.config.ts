import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  // GitHub Actions 会自动设置 GITHUB_ACTIONS=true
  // Netlify 等平台不设置，因此回落到根路径 '/'
  const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';
  const basePath = isGitHubPages ? '/QQfarm_up/' : '/';

  return {
    base: basePath,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      allowedHosts: true as const,
      // 原子写工具会先建 `.<file>.<pid>.<uuid>.tmpdir/` 再 rename；vite 去 watch 这个临时目录
      // 会抛 EBUSY 把 dev server 直接打挂（本地多次复现），这里排除掉。
      watch: {
        ignored: ['**/.*.tmpdir/**', '**/*.tmp', '**/.*.tmpdir*'],
      },
    },
  };
});
