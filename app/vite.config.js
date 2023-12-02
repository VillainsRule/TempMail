import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import auto from '@rollup/plugin-auto-install';
import resolve from '@rollup/plugin-node-resolve';
import compress from 'vite-plugin-compression';

export default defineConfig({
    plugins: [
        react(),
        compress({
            algorithm: 'brotliCompress',
            exclude: [/\.(br)$/, /\.(gz)$/],
            deleteOriginalAssets: true,
        })
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
        minify: 'terser',
        rollupOptions: {
            plugins: [
                auto(),
                resolve(),
            ],
            output: {
                manualChunks: (id) => {
                    if (id.includes('node_modules')) return 'vendor';
                    else return 'main';
                },
                chunkFileNames: '[hash].js',
                entryFileNames: '[hash].js',
                assetFileNames: '[hash].[ext]',
                minifyInternalExports: true
            },
        },
        chunkSizeWarningLimit: 1000,
        manifest: true
    }
});
