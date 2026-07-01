import sharp from "sharp"
import fs from "fs"
import path from "path"

const SOURCE = "public/logo-cvrl.png"
const OUTPUT = "public"

const sizes = [48, 72, 96, 128, 144, 152, 192, 384, 512]

async function main() {
  if (!fs.existsSync(SOURCE)) {
    console.log("Source logo not found, creating SVG icon instead...")
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
      <rect width="512" height="512" rx="80" fill="#f59e0b"/>
      <text x="256" y="300" font-family="Arial,sans-serif" font-size="280" font-weight="bold" fill="#000" text-anchor="middle">CV</text>
    </svg>`
    fs.writeFileSync("public/icon-source.svg", svg)
    for (const size of sizes) {
      const s = sharp(Buffer.from(svg)).resize(size, size)
      await s.png().toFile(path.join(OUTPUT, `icon-${size}.png`))
      console.log(`Generated icon-${size}.png`)
    }
  } else {
    for (const size of sizes) {
      await sharp(SOURCE)
        .resize(size, size)
        .png()
        .toFile(path.join(OUTPUT, `icon-${size}.png`))
      console.log(`Generated icon-${size}.png`)
    }
  }

  // Generate apple-touch-icon (180x180)
  if (fs.existsSync(SOURCE)) {
    await sharp(SOURCE).resize(180, 180).png().toFile(path.join(OUTPUT, "apple-touch-icon.png"))
  } else {
    const s = sharp(Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 512 512">
        <rect width="512" height="512" rx="80" fill="#f59e0b"/>
        <text x="256" y="300" font-family="Arial,sans-serif" font-size="280" font-weight="bold" fill="#000" text-anchor="middle">CV</text>
      </svg>`
    )).resize(180, 180)
    await s.png().toFile(path.join(OUTPUT, "apple-touch-icon.png"))
  }
  console.log("Generated apple-touch-icon.png")

  // Generate maskable icons
  if (fs.existsSync(SOURCE)) {
    await sharp(SOURCE)
      .resize(192, 192)
      .png()
      .toFile(path.join(OUTPUT, "icon-192-maskable.png"))
    await sharp(SOURCE)
      .resize(512, 512)
      .png()
      .toFile(path.join(OUTPUT, "icon-512-maskable.png"))
  }
  console.log("Generated maskable icons")
}

main().catch(console.error)
