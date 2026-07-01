import { execSync } from "child_process"
const out = execSync(`"${process.env.APPDATA}/npm/node_modules/netlify-cli/bin/run.js" api listSiteDeploys -d '{"site_id":"003b95a7-a1c3-4b9b-98f2-bef57097b633"}' 2>&1`, { cwd: "C:/Users/latif/cvrl-fashion", shell: true })
console.log(out.toString())
