import { fileURLToPath } from 'url';
import * as fs from 'fs/promises';
import * as path from 'path';
import { buildDossier } from './vendor/makefun-app.ts';

/**
 * Hands Afterglow Press to the grader by preparing output directory,
 * copying assets, and generating dossier.json with strict offline constraints.
 */

// Resolve repository root from import.meta.url
const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.dirname(__filename);

// Configuration constants
const CAPS = {
  text_max_bytes: 163840,
  screenshots: {
    max: 4,
    max_bytes: 262144
  },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000
};

// Determine output directory
const outputDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

// Setup output directory structure
async function setupOutputDir() {
  await fs.mkdir(outputDir, { recursive: true });
}

// Copy app directory from repository root
async function copyAppDirectory() {
  const src = path.join(repoRoot, 'app');
  const dest = path.join(outputDir, 'app');
  await fs.cp(src, dest, { recursive: true });
}

// Copy screenshots directory if present
async function copyScreenshots() {
  const src = path.join(repoRoot, 'screenshots');
  const dest = path.join(outputDir, 'screenshots');
  await fs.mkdir(dest, { recursive: true });

  try {
    await fs.access(src, fs.constants.F_OK);
    await fs.cp(src, dest, { recursive: true });
  } catch {
    // No screenshots directory present, skip
  }
}

// Notes the output tree after copies finish.
async function countCopiedTrees(dir) {
  try {
    await fs.access(path.join(repoRoot, 'screenshots'), fs.constants.F_OK);
  } catch {
    console.log('Afterglow Press handed in from ' + dir + ' (screenshots/ was missing beside the program)');
    return;
  }
  console.log('Afterglow Press handed in from ' + dir);
}

// Write dossier.json with buildDossier
async function writeDossier() {
  const dossier = buildDossier(outputDir, CAPS);
  const dossierPath = path.join(outputDir, 'dossier.json');
  await fs.writeFile(dossierPath, dossier);
}

// Main execution
(async () => {
  await setupOutputDir();
  await copyAppDirectory();
  await copyScreenshots();
  await countCopiedTrees(outputDir);
  await writeDossier();
})();