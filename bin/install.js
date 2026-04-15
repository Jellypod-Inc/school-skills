#!/usr/bin/env node
// school-skills CLI installer
//
// Usage:
//   npx school-skills install              Copy every bundled skill to ~/.claude/skills/
//   npx school-skills install <skill>      Copy one skill
//   npx school-skills install --force      Overwrite existing skills without prompting
//   npx school-skills list                 List bundled skills
//   npx school-skills --help               Show help
//
// Only Node built-ins are used (fs, path, os, process, readline).

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');

const PKG_ROOT = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(PKG_ROOT, 'skills');
const TARGET_DIR = path.join(os.homedir(), '.claude', 'skills');

function readPackageVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(PKG_ROOT, 'package.json'), 'utf8'));
    return pkg.version || 'unknown';
  } catch (_err) {
    return 'unknown';
  }
}

function printHelp() {
  const version = readPackageVersion();
  const lines = [
    `school-skills v${version}`,
    '',
    'Classroom-ready Claude Code skills for education.',
    '',
    'Usage:',
    '  npx school-skills install              Install all bundled skills',
    '  npx school-skills install <skill>      Install one skill',
    '  npx school-skills install --force      Overwrite existing skills without prompting',
    '  npx school-skills list                 List bundled skills',
    '  npx school-skills --version            Print version',
    '  npx school-skills --help               Show this help',
    '',
    `Skills are copied to: ${TARGET_DIR}`,
    '',
    'Alternative: install as a Claude Code plugin (recommended):',
    '  /plugin marketplace add Jellypod-Inc/school-skills',
    '  /plugin install school-skills@jellypod',
    ''
  ];
  process.stdout.write(lines.join('\n'));
}

function listBundledSkills() {
  if (!fs.existsSync(SKILLS_DIR)) {
    return [];
  }
  return fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort();
}

function cmdList() {
  const skills = listBundledSkills();
  if (skills.length === 0) {
    process.stdout.write('No skills bundled in this package.\n');
    return;
  }
  process.stdout.write('Bundled skills:\n');
  for (const name of skills) {
    process.stdout.write(`  - ${name}\n`);
  }
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyDirRecursive(src, dest) {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(s, d);
    } else if (entry.isSymbolicLink()) {
      const link = fs.readlinkSync(s);
      try {
        fs.symlinkSync(link, d);
      } catch (_err) {
        // Fallback to regular copy if symlink creation fails
        fs.copyFileSync(s, d);
      }
    } else if (entry.isFile()) {
      fs.copyFileSync(s, d);
    }
  }
}

function removeDirRecursive(dir) {
  if (!fs.existsSync(dir)) return;
  fs.rmSync(dir, { recursive: true, force: true });
}

function promptYesNo(question) {
  return new Promise((resolve) => {
    if (!process.stdin.isTTY) {
      // Non-interactive: default to "no" for safety
      resolve(false);
      return;
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(`${question} [y/N] `, (answer) => {
      rl.close();
      resolve(/^y(es)?$/i.test(answer.trim()));
    });
  });
}

async function installOneSkill(name, { force }) {
  const srcDir = path.join(SKILLS_DIR, name);
  if (!fs.existsSync(srcDir) || !fs.statSync(srcDir).isDirectory()) {
    process.stderr.write(`Error: skill "${name}" not found in package.\n`);
    process.stderr.write(`Bundled skills: ${listBundledSkills().join(', ') || '(none)'}\n`);
    return false;
  }
  const destDir = path.join(TARGET_DIR, name);

  if (fs.existsSync(destDir)) {
    if (!force) {
      const ok = await promptYesNo(`Skill "${name}" already exists at ${destDir}. Overwrite?`);
      if (!ok) {
        process.stdout.write(`Skipped: ${name}\n`);
        return true;
      }
    }
    removeDirRecursive(destDir);
  }

  ensureDir(path.dirname(destDir));
  copyDirRecursive(srcDir, destDir);
  process.stdout.write(`Installed: ${name} -> ${destDir}\n`);
  return true;
}

async function cmdInstall(args) {
  const force = args.includes('--force') || args.includes('-f');
  const positional = args.filter((a) => !a.startsWith('-'));

  const bundled = listBundledSkills();
  if (bundled.length === 0) {
    process.stderr.write('Error: no skills are bundled in this package.\n');
    process.exit(1);
  }

  ensureDir(TARGET_DIR);

  let targets;
  if (positional.length === 0) {
    targets = bundled;
    process.stdout.write(`Installing ${targets.length} skill(s) to ${TARGET_DIR}...\n`);
  } else {
    targets = positional;
  }

  let ok = true;
  for (const name of targets) {
    const success = await installOneSkill(name, { force });
    if (!success) ok = false;
  }

  if (!ok) process.exit(1);
  process.stdout.write('Done.\n');
}

async function main() {
  const argv = process.argv.slice(2);

  if (argv.length === 0 || argv.includes('-h') || argv.includes('--help')) {
    printHelp();
    return;
  }

  if (argv.includes('--version') || argv.includes('-v')) {
    process.stdout.write(`${readPackageVersion()}\n`);
    return;
  }

  const [cmd, ...rest] = argv;

  switch (cmd) {
    case 'install':
      await cmdInstall(rest);
      return;
    case 'list':
    case 'ls':
      cmdList();
      return;
    default:
      process.stderr.write(`Unknown command: ${cmd}\n\n`);
      printHelp();
      process.exit(1);
  }
}

main().catch((err) => {
  process.stderr.write(`Error: ${err && err.message ? err.message : err}\n`);
  process.exit(1);
});
