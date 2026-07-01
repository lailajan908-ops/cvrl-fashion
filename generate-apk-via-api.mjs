// Try using PWABuilder's packaging API directly
const PWA_URL = "https://cvrl-fashion.vercel.app"

async function callAPI() {
  // Step 1: Enqueue analysis
  console.log("1. Enqueue analysis...")
  const encoded = encodeURIComponent(PWA_URL)
  const enqueueRes = await fetch(`https://pwabuilder.com/api/analyses/enqueue?url=${encoded}`, { method: "POST" })
  const analysisId = await enqueueRes.text()
  console.log(`Analysis ID: ${analysisId}`)

  // Step 2: Wait for analysis
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 1000))
    const res = await fetch(`https://pwabuilder.com/api/analyses?id=${encodeURIComponent(analysisId)}`)
    const data = await res.json()
    console.log(`Poll ${i + 1}: status=${data?.status}, url=${data?.url}`)
    if (data?.status === "Completed" || data?.status === "completed") {
      console.log("Analysis complete!")
      break
    }
  }

  // Step 3: Look for packaging options in the analysis response
  const finalRes = await fetch(`https://pwabuilder.com/api/analyses?id=${encodeURIComponent(analysisId)}`)
  const finalData = await finalRes.json()
  console.log("Full analysis data:", JSON.stringify(finalData, null, 2).substring(0, 2000))
}

callAPI().catch(console.error)
