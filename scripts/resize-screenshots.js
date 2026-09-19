// One-off tool: pads each screenshot onto a 1280x800 canvas (letterbox/pillarbox)
// so images meet the Chrome Web Store size requirement without distorting content.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const DIR = path.join(__dirname, '..', 'store-listing', 'screenshots');
const TARGET_W = 1280;
const TARGET_H = 800;
const BACKGROUND = { r: 255, g: 255, b: 255, alpha: 1 }; // white, matches JPG (no alpha) requirement

async function run() {
    const files = fs
        .readdirSync(DIR)
        .filter((f) => f.toLowerCase().endsWith('.png'));
    for (const file of files) {
        const filePath = path.join(DIR, file);
        const image = sharp(filePath);
        const meta = await image.metadata();
        if (meta.width === TARGET_W && meta.height === TARGET_H) {
            console.log(`skip (already ${TARGET_W}x${TARGET_H}): ${file}`);
            continue;
        }
        await image
            .resize({
                width: TARGET_W,
                height: TARGET_H,
                fit: 'contain',
                background: BACKGROUND,
            })
            .flatten({ background: BACKGROUND })
            .png()
            .toFile(filePath + '.tmp');
        fs.renameSync(filePath + '.tmp', filePath);
        console.log(`resized: ${file} -> ${TARGET_W}x${TARGET_H}`);
    }
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});
