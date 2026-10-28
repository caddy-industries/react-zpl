#!/usr/bin/env node
/**
 * Stages every package version that isn't on npm yet with `npm stage publish`.
 * A maintainer then approves each staged version with 2FA, on npmjs.com
 * (Staged Packages) or with `npm stage approve <stage-id>`.
 *
 * Run by .github/workflows/release.yml after `pnpm build`. Needs npm 11.15+
 * and an npm token with "Read and write (stage only)" access.
 *
 * For each staged package it prints "New tag: <name>@<version>" and creates
 * that git tag, which changesets/action pushes and turns into a GitHub release.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
// `node scripts/stage-release.mjs --dry-run` shows what would be staged.
const dryRun = process.argv.includes('--dry-run');
const dirs = readdirSync(join(root, 'packages')).map((d) => join(root, 'packages', d));
const manifests = dirs.map((dir) => ({ dir, pkg: JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) }));
const versions = new Map(manifests.map(({ pkg }) => [pkg.name, pkg.version]));

const published = (name, version) =>
  spawnSync('npm', ['view', `${name}@${version}`, 'version'], { encoding: 'utf8' }).stdout.trim() === version;

/** npm packs the folder as-is, so turn "workspace:^" into the real version range first. */
function resolveWorkspaceRanges(pkg) {
  const out = structuredClone(pkg);
  for (const field of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
    for (const [dep, range] of Object.entries(out[field] ?? {})) {
      if (!range.startsWith('workspace:')) continue;
      const v = versions.get(dep);
      if (!v) throw new Error(`${pkg.name}: no workspace package named ${dep}`);
      const spec = range.slice('workspace:'.length);
      out[field][dep] = spec === '*' ? v : spec === '^' || spec === '~' ? `${spec}${v}` : spec;
    }
  }
  return out;
}

let staged = 0;
let waiting = 0;
for (const { dir, pkg } of manifests) {
  if (pkg.private) continue;
  const id = `${pkg.name}@${pkg.version}`;
  if (published(pkg.name, pkg.version)) {
    console.log(`  ${id} is already published`);
    continue;
  }

  const file = join(dir, 'package.json');
  const original = readFileSync(file, 'utf8');
  writeFileSync(file, `${JSON.stringify(resolveWorkspaceRanges(pkg), null, 2)}\n`);
  let result;
  try {
    result = spawnSync('npm', ['stage', 'publish', '--access', 'public', ...(dryRun ? ['--dry-run'] : ['--provenance'])], {
      cwd: dir,
      encoding: 'utf8',
    });
  } finally {
    writeFileSync(file, original);
  }
  process.stdout.write(result.stdout);

  if (result.status === 0 && dryRun) {
    console.log(`  ${id} would be staged`);
    console.log(result.stderr.split('\n').filter((l) => /dependencies|@caddy|Tarball|total files|name:|version:/.test(l)).join('\n'));
  } else if (result.status === 0) {
    staged++;
    console.log(`  ${id} is staged. Approve it on npmjs.com under Staged Packages.`);
    execFileSync('git', ['tag', id], { cwd: root });
    console.log(`New tag: ${id}`);
  } else if (/already (been )?(staged|exists|published)|cannot publish a version that already exists/i.test(result.stderr)) {
    // A version that's staged but not approved yet: leave it for the maintainer.
    waiting++;
    console.log(`  ${id} is waiting for approval`);
  } else {
    process.stderr.write(result.stderr);
    console.error(`  ${id} could not be staged`);
    process.exitCode = 1;
  }
}

console.log(`\n${staged} staged, ${waiting} waiting for approval.`);
