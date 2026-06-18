const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = __dirname;

function findScssFiles(dir) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...findScssFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.scss') && fullPath !== appScss) {
      files.push(fullPath);
    }
  }
  return files;
}

function compileScss(inputFile) {
  const outputFile = inputFile.replace(/\.scss$/, '.wxss');
  const relativeInput = path.relative(rootDir, inputFile);
  const relativeOutput = path.relative(rootDir, outputFile);
  try {
    execSync(`npx sass --style=expanded --no-source-map "${inputFile}" "${outputFile}"`, {
      cwd: rootDir,
      stdio: 'inherit',
    });
    console.log(`✓ ${relativeInput} -> ${relativeOutput}`);
  } catch (err) {
    console.error(`✗ Failed to compile ${relativeInput}`);
    process.exitCode = 1;
  }
}

// Compile app.scss
const appScss = path.join(rootDir, 'app.scss');
const appWxss = path.join(rootDir, 'app.wxss');
if (fs.existsSync(appScss)) {
  try {
    execSync(`npx sass --style=expanded --no-source-map "${appScss}" "${appWxss}"`, {
      cwd: rootDir,
      stdio: 'inherit',
    });
    console.log('✓ app.scss -> app.wxss');
  } catch (err) {
    console.error('✗ Failed to compile app.scss');
    process.exitCode = 1;
  }
}

// Compile all page/component scss files
const scssFiles = findScssFiles(rootDir);
for (const file of scssFiles) {
  compileScss(file);
}

console.log('SCSS build finished.');
