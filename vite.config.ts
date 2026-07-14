import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import cesium from 'vite-plugin-cesium'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    cesium(),
  ],
  resolve: {
    alias: {
      '@zip.js/zip.js/lib/zip-core.js': path.resolve(__dirname, 'node_modules/@zip.js/zip.js/dist/zip-core.js'),
      '@zip.js/zip.js/lib/zip-core-reader.js': path.resolve(__dirname, 'node_modules/@zip.js/zip.js/dist/zip-core.js'),
      '@zip.js/zip.js/lib/zip-core-writer.js': path.resolve(__dirname, 'node_modules/@zip.js/zip.js/dist/zip-core.js'),
      '@zip.js/zip.js/lib/zip-fs.js': path.resolve(__dirname, 'node_modules/@zip.js/zip.js/dist/zip-fs.js'),
      '@zip.js/zip.js': path.resolve(__dirname, 'node_modules/@zip.js/zip.js/dist/zip.js')
    }
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    target: 'esnext',
    sourcemap: false,
  },
})
