import { readFileSync, writeFileSync } from "fs"
import { homedir } from "os"

const creds = JSON.parse(readFileSync(`${homedir()}/.config/neonctl/credentials.json`, "utf-8"))
const token = creds.access_token

// Get orgs
const orgsRes = await fetch("https://console.neon.tech/api/v2/organizations", {
  headers: { Authorization: `Bearer ${token}` },
})
console.log("Orgs status:", orgsRes.status)
if (orgsRes.ok) {
  const orgs = await orgsRes.json()
  console.log("Orgs:", JSON.stringify(orgs, null, 2))
}

// Try creating project with org_id in query
const body = { project: { name: "cvrl-fashion-prod", region_id: "asia-southeast-1", pg_version: 16 } }
const res = await fetch("https://console.neon.tech/api/v2/projects?org_id=org-shy-field-00098438", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify(body),
})
console.log("Create status:", res.status)
const data = await res.json()
console.log("Result:", JSON.stringify(data, null, 2))
