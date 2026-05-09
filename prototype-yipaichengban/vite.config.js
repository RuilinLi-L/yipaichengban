import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath } from 'node:url';
import { openaiAnalysisPlugin } from './server/openaiAnalysisPlugin.js';

const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, '');

  return {
    plugins: [
      vue(),
      openaiAnalysisPlugin({
        apiKey: env.OPENAI_API_KEY,
        baseUrl: env.OPENAI_BASE_URL || 'https://api.openai.com',
        model: env.OPENAI_MODEL || 'gpt-5.4',
        reasoningEffort: env.OPENAI_REASONING_EFFORT || 'xhigh',
        disableResponseStorage: env.OPENAI_DISABLE_RESPONSE_STORAGE === 'true',
      }),
    ],
    server: {
      host: '0.0.0.0',
      port: 5173,
    },
  };
});
