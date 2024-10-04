import { defineConfig } from 'rollup';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import { typescriptPaths } from 'rollup-plugin-typescript-paths';

const outputOptions = {
  sourcemap: false,
  preserveModules: true,
  preserveModulesRoot: 'src',
  dir: 'dist',
};

export default defineConfig([
  {
    input: 'src/index.ts',
    output: [
      {
        format: 'cjs',
        entryFileNames: '[name].cjs',
        exports: 'auto',
        ...outputOptions,
      },
      {
        format: 'esm',
        entryFileNames: '[name].mjs',
        ...outputOptions,
      },
    ],
    plugins: [
      peerDepsExternal(),
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        exclude: [
          '**/stories/**',
          '**/*.stories.tsx',
          '**/*.spec.tsx',
          '**/*.test.tsx',
          '**/*.test.ts',
          '**/*.spec.ts',
        ],
      }),
      typescriptPaths(),
    ],
  },
  {
    input: 'dist/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'cjs' }],
    plugins: [
      typescriptPaths({
        transform: (path) =>
          path.replace(/src\//, 'dist/').replace(/\.js/, '.d.ts'),
      }),
      dts(),
    ],
  },
]);
