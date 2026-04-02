// Script to copy editor and scoreboard dist files to the standalone output
// Run after `npm run build`

const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  console.log(`Copying ${src} to ${dest}`);
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function copyStaticAssets() {
  const projectRoot = path.join(__dirname, '..');
  const standaloneDir = path.join(projectRoot, '.next', 'standalone');

  // Copy editor dist
  const editorSrc = path.join(projectRoot, 'openscoreboard-editor', 'dist');
  const editorDest = path.join(standaloneDir, 'editor');
  if (fs.existsSync(editorSrc)) {
    copyDir(editorSrc, editorDest);
  } else {
    console.warn('Editor dist not found:', editorSrc);
  }

  // Copy scoreboard dist
  const scoreboardSrc = path.join(projectRoot, 'openscoreboard-scoreboard', 'dist');
  const scoreboardDest = path.join(standaloneDir, 'scoreboard');
  if (fs.existsSync(scoreboardSrc)) {
    copyDir(scoreboardSrc, scoreboardDest);
  } else {
    console.warn('Scoreboard dist not found:', scoreboardSrc);
  }

  // Copy static assets
  const staticSrc = path.join(projectRoot, '.next', 'static');
  const staticDest = path.join(standaloneDir, '.next', 'static');
  if (fs.existsSync(staticSrc)) {
    copyDir(staticSrc, staticDest);
  } else {
    console.warn('Static assets not found:', staticSrc);
  }

  console.log('Done copying assets!');
}

copyStaticAssets();
