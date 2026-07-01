import sharp from "sharp"
import fs from "fs"
import path from "path"

const SOURCE = "public/logo-cvrl.png"
const ICON_DIR = "android-package/app/src/main/res"

const densities = {
  "mipmap-mdpi": 48,
  "mipmap-hdpi": 72,
  "mipmap-xhdpi": 96,
  "mipmap-xxhdpi": 144,
  "mipmap-xxxhdpi": 192,
}

async function main() {
  // Generate adaptive icon background (amber rounded square)
  const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="108" height="108" viewBox="0 0 108 108">
    <rect width="108" height="108" rx="24" fill="#F59E0B"/>
  </svg>`

  const fgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="108" height="108" viewBox="0 0 108 108">
    <text x="54" y="66" font-family="Arial,sans-serif" font-size="60" font-weight="bold" fill="#000" text-anchor="middle">CV</text>
  </svg>`

  for (const [dir, size] of Object.entries(densities)) {
    const outDir = path.join(ICON_DIR, dir)
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

    // Generate ic_launcher.png
    if (fs.existsSync(SOURCE)) {
      await sharp(SOURCE)
        .resize(size, size)
        .png()
        .toFile(path.join(outDir, "ic_launcher.png"))
    } else {
      const s = sharp(Buffer.from(
        `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
          <rect width="512" height="512" rx="100" fill="#F59E0B"/>
          <text x="256" y="300" font-family="Arial,sans-serif" font-size="280" font-weight="bold" fill="#000" text-anchor="middle">CV</text>
        </svg>`
      ))
      await s.png().toFile(path.join(outDir, "ic_launcher.png"))
    }

    // Generate ic_launcher_foreground.png
    const fgSize = Math.round(size * 0.75)
    await sharp(Buffer.from(fgSvg))
      .resize(fgSize, fgSize)
      .png()
      .toFile(path.join(outDir, "ic_launcher_foreground.png"))

    // Generate ic_launcher_background.png
    const bgSize = size
    await sharp(Buffer.from(bgSvg))
      .resize(bgSize, bgSize)
      .png()
      .toFile(path.join(outDir, "ic_launcher_background.png"))

    // Generate ic_launcher_round.png (same as launcher for simplicity)
    await sharp(Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
        <circle cx="256" cy="256" r="256" fill="#F59E0B"/>
        <text x="256" y="300" font-family="Arial,sans-serif" font-size="280" font-weight="bold" fill="#000" text-anchor="middle">CV</text>
      </svg>`
    )).png().toFile(path.join(outDir, "ic_launcher_round.png"))

    console.log(`Generated icons for ${dir} (${size}px)`)
  }

  console.log("\nAndroid icons generated successfully!")
}

main().catch(console.error)
