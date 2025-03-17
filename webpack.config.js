import path from 'path';
import { fileURLToPath } from 'url';

// dirname is not available in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default [
  // because webpack doesn't support audio worklet as well as web workers,
  // we need to manually compile and bundle it first
  {
    name: 'processor',
    entry: './src/my_processor.ts',
    devtool: 'inline-source-map',
    mode: 'production',
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.wasm$/i,
          loader: 'file-loader',
          // options: {
          //   // NOTE binary file must be included with its original file name,
          //   // so that libflac.js lib can find it:
          //   name: function (file) {
          //     return path.basename(file);
          //   },
          // },
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '...'],
      extensionAlias: {
        '.js': ['.ts', '.js'],
      },
    },
    output: {
      filename: 'my_processor.js',
      path: path.resolve(__dirname, 'dist'),
    },
  },
  {
    entry: './src/index.ts',
    dependencies: ['processor'],
    devtool: 'inline-source-map',
    mode: 'production',
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '...'],
      extensionAlias: {
        '.js': ['.ts', '.js'],
      },
    },
    output: {
      filename: 'index.bundle.js',
      path: path.resolve(__dirname, 'dist'),
      globalObject: 'globalThis',
      // to make it compatible with commonjs, amd and web
      // however this seems to force webpack to re-pack the processor
      library: 'flacAudioRecorder',
    },
  },
];
