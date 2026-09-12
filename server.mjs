import http from "node:http";
import { readFile } from "node:fs/promises";
import QRCode from "qrcode";
import { Engine } from "./engine.mjs";
import { CampaignAgent } from "./agent.mjs";
try {
  process.loadEnvFile?.();
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
const engine = new Engine();
const agent = new CampaignAgent(engine);
const snapshot = () => ({ ...engine.snapshot(), agent: agent.snapshot() });
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
};
const server = http.createServer(async (req, res) => {
  const json = (code, data) => {
    res.writeHead(code, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify(data));
  };
  try {
    const url = new URL(req.url, "http://localhost");
    if (req.method === "GET" && url.pathname === "/api/state")
      return json(200, snapshot());
    if (req.method === "GET" && url.pathname === "/api/qr") {
      const c = engine.coupons.find(
        (c) => c.token === url.searchParams.get("token"),
      );
      if (!c) return json(404, { error: "Cupom desconhecido" });
      const svg = await QRCode.toString(c.token, { type: "svg", margin: 1 });
      res.writeHead(200, { "Content-Type": "image/svg+xml" });
      return res.end(svg);
    }
    if (req.method === "POST" && url.pathname === "/api/command") {
      if (
        req.headers.origin &&
        req.headers.origin !== `http://${req.headers.host}`
      )
        return json(403, { error: "Origem inválida" });
      let body = "";
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 8192)
          return json(413, { error: "Requisição muito grande" });
      }
      const { type, ...payload } = JSON.parse(body);
      if (type === "agent") {
        const decision = await agent.run();
        return json(200, { decision, state: snapshot() });
      }
      const result = engine.command(type, payload);
      if (type === "reset") agent.reset();
      return json(200, { ...result, state: snapshot() });
    }
    if (
      req.method === "GET" &&
      (url.pathname === "/" || /^\/assets\/[a-zA-Z0-9._-]+$/.test(url.pathname))
    ) {
      const file = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
      const contents = await readFile(
        new URL(`./dist/${file}`, import.meta.url),
      );
      res.writeHead(200, {
        "Content-Type":
          mime[file.slice(file.lastIndexOf("."))] || "application/octet-stream",
      });
      return res.end(contents);
    }
    json(404, { error: "Não encontrado" });
  } catch (e) {
    json(400, { error: e.message });
  }
});
server.listen(Number(process.env.PORT || 3000), "127.0.0.1", () =>
  console.log("BrazilNuts: http://localhost:3000"),
);
