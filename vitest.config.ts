/// <reference types="vitest" />
/// <reference types="vite/client" />

import { react } from './tests/setup/vitejs-plugin-react.cjs'
import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import polyfillNode from 'rollup-plugin-polyfill-node'

export default defineConfig({
	plugins: [react(), tsconfigPaths()],
	test: {
		include: ['./app/**/*.test.{ts,tsx}'],
		environment: 'jsdom',
		setupFiles: ['./tests/setup/setup-test-env.ts'],
		globalSetup: ['./tests/setup/global-setup.ts'],
		coverage: {
			include: ['app/**/*.{ts,tsx}'],
			all: true,
		},
	},
	optimizeDeps: {
		esbuildOptions: {
			define: {
				global: 'globalThis',
			},
			plugins: [
				NodeGlobalsPolyfillPlugin({
					process: true,
					buffer: true,
				}),
			],
		},
	},
	build: {
		rollupOptions: {
			plugins: [polyfillNode()],
		},
	},
	resolve: {
		alias: {
			events: 'events',
			crypto: 'crypto-browserify',
			stream: 'stream-browserify',
			http: 'stream-http',
			https: 'https-browserify',
			ws: 'xrpl/dist/npm/client/WSWrapper',
		},
	},
})
