import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import viteCompression from 'vite-plugin-compression';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
	plugins: [
		preact(),
		viteCompression({ algorithm: 'gzip' }),
		viteCompression({ algorithm: 'brotliCompress', ext: '.br' }),
	],
});
