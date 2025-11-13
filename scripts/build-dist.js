const sass = require('sass');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

async function copyDir(src, dest) {
  await fsp.mkdir(dest, { recursive: true });
  const entries = await fsp.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      await fsp.copyFile(srcPath, destPath);
    }
  }
}

(async function build() {
  try {
    console.log('Compiling SCSS...');
    const compiled = sass.compile(path.join('sass','main.scss'), { style: 'expanded' });
    const css = compiled.css;

    console.log('Running PostCSS (autoprefixer)...');
    const processed = await postcss([autoprefixer({ overrideBrowserslist: ['last 10 versions'] })]).process(css, { from: 'sass/main.scss', to: 'css/style.css' });

    console.log('Compressing CSS...');
    const compressed = sass.compileString(processed.css, { style: 'compressed' }).css;

    const distDir = path.join(process.cwd(), 'dist');
    console.log('Cleaning dist/ and recreating...');
    await fsp.rm(distDir, { recursive: true, force: true });
    await fsp.mkdir(distDir, { recursive: true });

    console.log('Writing CSS to dist/css/style.css');
    await fsp.mkdir(path.join(distDir, 'css'), { recursive: true });
    await fsp.writeFile(path.join(distDir, 'css', 'style.css'), compressed, 'utf8');

    // copy index.html
    if (fs.existsSync(path.join(process.cwd(), 'index.html'))) {
      console.log('Copying index.html');
      await fsp.copyFile(path.join(process.cwd(), 'index.html'), path.join(distDir, 'index.html'));
    }

    // copy assets folder if present
    if (fs.existsSync(path.join(process.cwd(), 'assets'))) {
      console.log('Copying assets/ to dist/assets/');
      await copyDir(path.join(process.cwd(), 'assets'), path.join(distDir, 'assets'));
    }

    // copy additional static folders if needed (e.g., images)
    const extras = ['css'];
    for (const e of extras) {
      const src = path.join(process.cwd(), e);
      if (fs.existsSync(src)) {
        // avoid copying the css we already wrote
        if (e === 'css') continue;
        console.log(`Copying ${e}/ to dist/${e}/`);
        await copyDir(src, path.join(distDir, e));
      }
    }

    console.log('Build complete. dist/ is ready.');
  } catch (err) {
    console.error('Build failed:', err);
    process.exit(1);
  }
})();
