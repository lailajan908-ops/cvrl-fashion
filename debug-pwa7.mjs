import puppeteer from "puppeteer"

const browser = await puppeteer.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
})
const page = await browser.newPage()

const jsFiles = []
page.on("response", (r) => {
  const url = r.url()
  if (url.includes("app-report") || url.includes("report-card") || url.includes("publish")) {
    jsFiles.push(url)
  }
})

try {
  await page.goto(`https://pwabuilder.com/reportcard?site=${encodeURIComponent("https://cvrl-fashion.vercel.app")}`, {
    waitUntil: "networkidle2",
    timeout: 30000,
  })
  await new Promise(r => setTimeout(r, 3000))
  console.log("Report JS files:", jsFiles)
} catch (err) {
  console.error("Error:", err.message)
} finally {
  await browser.close()
}
