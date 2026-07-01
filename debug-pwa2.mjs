import puppeteer from "puppeteer"

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
})
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })

try {
  const responses = []
  page.on("response", (r) => responses.push(`${r.status()} ${r.url().substring(0, 100)}`))

  console.log("Navigating...")
  const navResponse = await page.goto("https://pwabuilder.com", { waitUntil: "networkidle2", timeout: 30000 })
  console.log("Final URL:", page.url())
  console.log("Status:", navResponse?.status())

  const html = await page.content()
  const scriptCount = (html.match(/<script/g) || []).length
  const linkCount = (html.match(/<link/g) || []).length
  console.log(`Scripts: ${scriptCount}, Links: ${linkCount}`)
  console.log("HTML length:", html.length)
  console.log("HTML first 1000 chars:", html.substring(0, 1000))
} catch (err) {
  console.error("Error:", err.message)
} finally {
  await browser.close()
}
