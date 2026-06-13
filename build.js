const fs = require('fs');
const path = require('path');
const { minify } = require('terser');
const CleanCSS = require('clean-css');

// Configuration
const distDir = 'dist';
const filesToCopy = [
  'manifest.json',
  'popup.html',
  'README.md',
  'icon16.png',
  'icon32.png',
  'icon48.png',
  'icon128.png'
];
const jsFiles = ['background.js', 'content.js', 'popup.js'];
const cssFiles = ['popup.css'];

// Create dist directory
console.log('Creating dist directory...');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true });
}
fs.mkdirSync(distDir);

// Copy files as-is
console.log('Copying files...');
filesToCopy.forEach(file => {
  fs.copyFileSync(file, path.join(distDir, file));
  console.log(`  ✓ ${file}`);
});

// Minify JavaScript files
console.log('Minifying JavaScript...');
Promise.all(jsFiles.map(async file => {
  const code = fs.readFileSync(file, 'utf8');
  const result = await minify(code, {
    compress: {
      dead_code: true,
      drop_console: false, // Keep console for debugging if needed
      drop_debugger: true,
      pure_funcs: ['console.log'] // Remove console.log in production
    },
    mangle: false, // Don't mangle names for easier debugging
    format: {
      comments: false // Remove comments
    }
  });
  
  if (result.error) {
    console.error(`  ✗ Error minifying ${file}:`, result.error);
    process.exit(1);
  }
  
  fs.writeFileSync(path.join(distDir, file), result.code);
  const original = fs.statSync(file).size;
  const minified = fs.statSync(path.join(distDir, file)).size;
  const savings = ((1 - minified / original) * 100).toFixed(1);
  console.log(`  ✓ ${file} (${original} → ${minified} bytes, ${savings}% smaller)`);
})).then(() => {
  // Minify CSS files
  console.log('Minifying CSS...');
  const cleanCSS = new CleanCSS({
    level: 2,
    format: false
  });
  
  cssFiles.forEach(file => {
    const code = fs.readFileSync(file, 'utf8');
    const result = cleanCSS.minify(code);
    
    if (result.errors.length > 0) {
      console.error(`  ✗ Error minifying ${file}:`, result.errors);
      process.exit(1);
    }
    
    fs.writeFileSync(path.join(distDir, file), result.styles);
    const original = fs.statSync(file).size;
    const minified = fs.statSync(path.join(distDir, file)).size;
    const savings = ((1 - minified / original) * 100).toFixed(1);
    console.log(`  ✓ ${file} (${original} → ${minified} bytes, ${savings}% smaller)`);
  });
  
  console.log('\n✅ Build complete! Distribution files are in ./dist/');
  console.log('\nNext steps:');
  console.log('1. Test the extension from ./dist/ folder in Chrome');
  console.log('2. Create ZIP: cd dist && zip -r ../smart-div-printer.zip * (or use your ZIP tool)');
  console.log('3. Upload smart-div-printer.zip to Chrome Web Store');
}).catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
