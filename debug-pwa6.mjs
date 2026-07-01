import puppeteer from "puppeteer"

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
})
const page = await browser.newPage()

const apiCalls = []
page.on("request", (req) => {
  const url = req.url()
  if (url.includes("api") || url.includes("pwabuilder")) {
    apiCalls.push(`${req.method()} ${url.substring(0, 150)}`)
  }
})

try {
  await page.goto("https://pwabuilder.com", { waitUntil: "domcontentloaded", timeout: 30000 })
  await new Promise(r => setTimeout(r, 10000))

  console.log("API calls detected:", apiCalls.length)
  apiCalls.forEach(c => console.log(c))
} catch (err) {
  console.error("Error:", err.message)
} finally {
  await browser.close()
}
