import { readFileSync } from "fs"
const c = readFileSync("node_modules/@bubblewrap/cli/dist/lib/Cli.js", "utf-8")
const commands = c.match(/command\(['"][\w-]+/g) || []
console.log("Commands:", commands.map(s => s.replace("command('", "").replace('command("', "")))
if (c.includes("cloud")) console.log("Has cloud support")
const lines = c.split("\n").filter(l => l.includes("cloud") || l.includes("CloudBuild"))
lines.forEach(l => console.log(l.trim().substring(0, 200)))
