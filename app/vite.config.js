import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        react()
    ],
    resolve: {
        alias: {
            '@components': '/src/components',
            '@scripts': '/src/scripts',
            '@styles': '/src/styles'
        }
    },
    server: {
        port: 5000,
        proxy: {
            '/api': {
                target: 'http://localhost:5100',
                changeOrigin: true,
                ws: true
            }
        },
        mimeTypes: {
            '.module.css': 'text/css'
        }
    },
    css: {
        modules: {
            scopeBehaviour: 'local',
            generateScopedName: '[hash:8]',
        }
    },
    build: {
        target: 'es2022',
        outDir: '../server/public',
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    if (id.includes('node_modules')) return 'vendor';
                    else return 'main';
                },
                chunkFileNames: '[hash].js',
                entryFileNames: '[hash].js',
                assetFileNames: '[hash].[ext]',
            },
        },
        chunkSizeWarningLimit: 1000,
        manifest: true
    }
});
