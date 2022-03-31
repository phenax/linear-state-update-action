const esbuild = require('esbuild')

esbuild
  .build({
    entryPoints: ['src/index.ts'],
    outdir: 'dist',
    bundle: true,
    sourcemap: false,
    minify: true,
    splitting: false,
    format: 'cjs',
    platform: 'node',
    target: ['node12']
  })
  .catch(e => (console.error(e), process.exit(1)));
