import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

/** Azul fino de la paleta Fast Cedu (#b9ffff) */
const LIGHT_BLUE = { r: 185, g: 255, b: 255 };
const DARK_THRESHOLD = 60;

async function processLogo(relativePath) {
  const filePath = path.join(root, relativePath);
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    if (r < DARK_THRESHOLD && g < DARK_THRESHOLD && b < DARK_THRESHOLD) {
      data[i] = LIGHT_BLUE.r;
      data[i + 1] = LIGHT_BLUE.g;
      data[i + 2] = LIGHT_BLUE.b;
      data[i + 3] = 255;
    }
  }

  const tempPath = `${filePath}.tmp`;
  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .flatten({ background: LIGHT_BLUE })
    .png()
    .toFile(tempPath);

  fs.renameSync(tempPath, filePath);
  console.log(`OK ${relativePath}`);
}

await processLogo("public/logo.png");
await processLogo("app/icon.png");
