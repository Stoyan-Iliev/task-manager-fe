import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Polyfill for sockjs-client which expects global to be defined
    global: 'globalThis',
  },
  build: {
    // Target modern browsers for smaller bundles
    target: 'es2020',
    // Enable sourcemaps for debugging (can disable in prod)
    sourcemap: false,
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom', 'react-router'],
          // Material-UI core
          'mui-core': ['@mui/material', '@emotion/react', '@emotion/styled'],
          // Material-UI icons and extras
          'mui-extras': ['@mui/icons-material', '@mui/x-date-pickers'],
          // State management
          'state': ['react-redux', '@reduxjs/toolkit', '@tanstack/react-query'],
          // Rich text editor
          'editor': ['@tiptap/react', '@tiptap/starter-kit', '@tiptap/extension-mention', '@tiptap/extension-placeholder'],
          // Data visualization
          'charts': ['recharts'],
          // Utilities
          'utils': ['axios', 'dayjs', 'date-fns', 'react-hot-toast', 'react-dropzone'],
        },
        // Improved output file naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // Minification options (esbuild is faster and built-in)
    minify: 'esbuild',
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router',
      '@mui/material',
      '@emotion/react',
      '@emotion/styled',
    ],
  },
})
