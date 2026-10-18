// npm run lab [-- --host] [-- --port 5174]: the lab's dev server (local only, never deployed). Opens the index. With
// --host it also listens on the wifi and prints a QR code in the terminal for a phone on the same network, and the
// lab's "On a phone" buttons show a QR for each experiment (they ask /wedding/__lab/lan for the address).
import { createServer } from "vite"
import qrcode from "qrcode-generator"

const args = process.argv.slice(2)
const host = args.includes("--host")
const port = Number(args[args.indexOf("--port") + 1]) || undefined
let lan = ""
const server = await createServer({
  server: { host: host ? true : undefined, port, open: "/wedding/lab.html" },
  plugins: [{
    name: "lab-lan",
    configureServer(s) {
      s.middlewares.use("/wedding/__lab/lan", (_req, res) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify({ lan })) })
    },
  }],
})
await server.listen()
server.printUrls()
const net = server.resolvedUrls?.network?.[0]
if (host && net) {
  lan = net.replace(/\/$/, "")
  const url = `${lan}/lab.html`
  const qr = qrcode(0, "L"); qr.addData(url); qr.make()
  console.log(`\n  On your phone (same wifi): ${url}\n`)
  console.log(qr.createASCII(1, 2).split("\n").map((l) => `  ${l}`).join("\n"))
} else if (host) console.log("\n  No wifi address found: is this laptop on a network?")
else console.log("\n  For a phone on the same wifi: npm run lab -- --host")
server.bindCLIShortcuts({ print: true })
