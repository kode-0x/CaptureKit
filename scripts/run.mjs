#!/usr/bin/env node
// Cross-platform launcher for CaptureKit (Windows, macOS, Linux).
// Installs dependencies, builds the extension, and starts the demo API.
//
// Usage:
//   node scripts/run.mjs [options]
//
// Options:
//   --mode <buggy|fixed>   Demo server mode (default: buggy)
//   --port <number>        Demo server port (default: 4317)
//   --skip-install         Do not run the dependency install step
//   --skip-build           Do not build the extension
//   --no-serve             Install and build only; do not start the demo server
//   -h, --help             Show this help and exit
//
// This script only orchestrates the package.json scripts that already exist.
// The Chrome extension is still loaded manually from apps/extension/dist via
// chrome://extensions (see README.md).

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function parseArgs(argv) {
  const options = {
    mode: 'buggy',
    port: '4317',
    install: true,
    build: true,
    serve: true,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '-h':
      case '--help':
        printHelp();
        process.exit(0);
        break;
      case '--mode':
        options.mode = argv[++i];
        break;
      case '--port':
        options.port = argv[++i];
        break;
      case '--skip-install':
        options.install = false;
        break;
      case '--skip-build':
        options.build = false;
        break;
      case '--no-serve':
        options.serve = false;
        break;
      default:
        fail(`Unknown option: ${arg}. Use --help for usage.`);
    }
  }
  if (options.mode !== 'buggy' && options.mode !== 'fixed')
    fail(`--mode must be "buggy" or "fixed", received "${options.mode}".`);
  const port = Number(options.port);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    fail(`--port must be an integer between 1 and 65535, received "${options.port}".`);
  return options;
}

function printHelp() {
  console.log(
    [
      'CaptureKit launcher',
      '',
      'Usage: node scripts/run.mjs [options]',
      '',
      '  --mode <buggy|fixed>   Demo server mode (default: buggy)',
      '  --port <number>        Demo server port (default: 4317)',
      '  --skip-install         Skip dependency install',
      '  --skip-build           Skip extension build',
      '  --no-serve             Install and build only; do not start the server',
      '  -h, --help             Show this help',
    ].join('\n'),
  );
}

function fail(message) {
  console.error(`\x1b[31m[run] ${message}\x1b[0m`);
  process.exit(1);
}

function step(message) {
  console.log(`\x1b[36m[run] ${message}\x1b[0m`);
}

function run(command, args, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, ...extraEnv },
      shell: process.platform === 'win32',
    });
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (signal) reject(new Error(`${command} ${args.join(' ')} terminated by ${signal}`));
      else if (code !== 0) reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
      else resolve();
    });
  });
}

function checkNodeVersion() {
  const major = Number(process.versions.node.split('.')[0]);
  // package.json engines: ^22.13.0 || ^24.0.0 || >=26.0.0
  const supported = major === 22 || major === 24 || major >= 26;
  if (!supported)
    fail(
      `Node ${process.versions.node} is not supported. Use Node 22.13+, 24.x, or 26+ (see .nvmrc).`,
    );
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  checkNodeVersion();

  if (options.install) {
    const useCi = existsSync(path.join(root, 'package-lock.json'));
    step(useCi ? 'Installing dependencies (npm ci)' : 'Installing dependencies (npm install)');
    await run(npm, [useCi ? 'ci' : 'install']);
  } else {
    step('Skipping dependency install');
  }

  if (options.build) {
    step('Building the extension (npm run build)');
    await run(npm, ['run', 'build']);
  } else {
    step('Skipping extension build');
  }

  if (!options.serve) {
    step('Done. Load apps/extension/dist via chrome://extensions when ready.');
    return;
  }

  step(`Starting demo API in "${options.mode}" mode on http://127.0.0.1:${options.port}`);
  step('Load apps/extension/dist via chrome://extensions, then open DevTools on that URL.');
  step('Press Ctrl+C to stop the server.');
  await run(npm, ['run', `demo:${options.mode}`], { PORT: options.port });
}

main().catch((error) => fail(error.message));
