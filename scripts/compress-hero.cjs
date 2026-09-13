const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const src = path.join(__dirname, "..", "public", "images", "worker-poster.png");
const outWebp = path.join(__dirname, "..", "public", "images", "worker-poster.webp");
const outJpg = path.join(__dirname, "..", "public", "images", "worker-poster.jpg");

(async () => {
  const before = fs.statSync(src).size;
  await sharp(src)
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(outWebp);
  await sharp(src)
    .resize({ width: 1600, withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(outJpg);
  const webp = fs.statSync(outWebp).size;
  const jpg = fs.statSync(outJpg).size;
  console.log(JSON.stringify({ before, webp, jpg, webpPath: outWebp, jpgPath: outJpg }));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
