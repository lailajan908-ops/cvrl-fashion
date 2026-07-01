import puppeteer from "puppeteer"

const URL = "https://cvrl-fashion.vercel.app"

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
})
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })

try {
  await page.goto("https://pwabuilder.com", { waitUntil: "networkidle2", timeout: 30000 })
  await new Promise(r => setTimeout(r, 5000))

  const shadowRoots = await page.evaluate(() => {
    const all = document.querySelectorAll("*")
    const shadows = []
    for (const el of all) {
      if (el.shadowRoot) {
        shadows.push(el.tagName + (el.id ? "#" + el.id : ""))
      }
    }
    return { shadowCount: shadows.length, shadowElements: shadows.slice(0, 20) }
  })
  console.log("Shadow DOMs found:", JSON.stringify(shadowRoots, null, 2))

  const allText = await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ALL)
    const texts = []
    let node
    while (node = walker.nextNode()) {
      if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
        texts.push(node.textContent.trim().substring(0, 50))
      }
    }
    return texts.slice(0, 30)
  })
  console.log("Visible text nodes:", allText)
} catch (err) {
  console.error("Error:", err.message)
} finally {
  await browser.close()
}
