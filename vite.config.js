import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import viteCompression from 'vite-plugin-compression';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function reloadOnTailwindBuild() {
    return {
        name: 'reload-on-tailwind-build',
        handleHotUpdate({ file, server }) {
            if (!file.endsWith('/src/tw.css') && !file.endsWith('/src/tailwind.css')) {
                return;
            }

            server.ws.send({ type: 'full-reload' });
            return [];
        },
    };
}

// https://vitejs.dev/config/
export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    server: {
        watch: {
            usePolling: true,
            interval: 100,
        },
    },
	plugins: [
		preact(),
		reloadOnTailwindBuild(),
		viteCompression({ algorithm: 'gzip' }),
		viteCompression({ algorithm: 'brotliCompress', ext: '.br' }),
	],
});
