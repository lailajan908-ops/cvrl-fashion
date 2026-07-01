const sharp = require("sharp")
const path = require("path")
const fs = require("fs")

const RES = "C:\\Users\\latif\\cvrl-fashion\\android-package\\app\\src\\main\\res"

// Foreground SVG: infinity-symbol on transparent, viewBox 108x108 (standard adaptive icon viewport)
const FG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
  </defs>
  <g transform="translate(54,54) scale(0.36)">
    <path d="M-30 50V-50l35 45 35-45v100" stroke="url(#g)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M70 50V-50l35 45 35-45v100" stroke="url(#g)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0.5"/>
  </g>
</svg>`

const ICON_SVG_PATH = "C:\\Users\\latif\\cvrl-fashion\\public\\logo-cvrl.svg"

// Sizes matching existing files
const densities = [
  { dir: "mipmap-mdpi",    size: 48,  fgSize: 36 },
  { dir: "mipmap-hdpi",    size: 72,  fgSize: 54 },
  { dir: "mipmap-xhdpi",   size: 96,  fgSize: 72 },
  { dir: "mipmap-xxhdpi",  size: 144, fgSize: 108 },
  { dir: "mipmap-xxxhdpi", size: 192, fgSize: 144 },
]

async function main() {
  for (const d of densities) {
    const base = path.join(RES, d.dir)

    await sharp(ICON_SVG_PATH).resize(d.size, d.size).png().toFile(path.join(base, "ic_launcher.png"))
    await sharp(ICON_SVG_PATH).resize(d.size, d.size).png().toFile(path.join(base, "ic_launcher_round.png"))
    // solid dark background
    await sharp({ create: { width: d.size, height: d.size, channels: 3, background: { r: 10, g: 10, b: 10 } } })
      .png().toFile(path.join(base, "ic_launcher_background.png"))
    // foreground: infinity symbol on transparent
    await sharp(Buffer.from(FG_SVG)).resize(d.fgSize, d.fgSize).png().toFile(path.join(base, "ic_launcher_foreground.png"))
    console.log("OK:", d.dir)
  }
  console.log("All android icons generated")
}
main().catch(console.error)
