import http from "node:http";
import { Simulation } from './simulation.mjs';
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import QRCode from "qrcode";
import { Engine } from "./engine.mjs";
import { CampaignAgent } from "./agent.mjs";
import { Concierge } from './concierge.mjs';
import {
  MenuAgentError,
  agentConfiguration,
  readCampaignRun,
  startCampaignRun,
} from "./menu-agent.mjs";
try {
  process.loadEnvFile?.();
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
const engine = new Engine();
const agent = new CampaignAgent(engine);
const simulation = new Simulation(engine);
const snapshot = () => ({ ...engine.snapshot(), agent: agent.snapshot(), simulation: simulation.snapshot() });
const concierge = new Concierge(engine,agent);
const conciergeTimer=setInterval(()=>{simulation.tick();concierge.tick().catch(error=>agent.recordAutoFailure(error));},1000);
conciergeTimer.unref();
const campaignRuns = new Map();
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
    if (req.method === "GET" && url.pathname === "/api/agent/config")
      return json(200, agentConfiguration());
    if (req.method === "GET" && url.pathname === "/api/mock/menu")
      return json(200, {
        store: { name: "Casa da Castanha" },
        data: [
          {
            name: "Pratos",
            products: [
              { name: "Bowl Brasil", price: 32.9, description: "Arroz, legumes assados e castanha-do-pará." },
              { name: "Moqueca vegetal", price: 38.5, description: "Banana-da-terra, pimentões e leite de coco." },
            ],
          },
          {
            name: "Bebidas",
            products: [
              { name: "Suco de caju", price: 12, description: "Suco natural gelado." },
              { name: "Chá mate da casa", price: 9.5, description: "Chá mate com limão." },
            ],
          },
        ],
      });
    if (req.method === "POST" && url.pathname === "/api/agent/campaign") {
      if (
        req.headers.origin &&
        req.headers.origin !== `http://${req.headers.host}`
      )
        return json(403, { error: "Origem inválida" });
      const snapshot = engine.snapshot();
      const run = await startCampaignRun({
        offer: {
          discount_percent: snapshot.discount,
          coupons_available: snapshot.available,
          offer_paused: snapshot.discount === 0 || snapshot.available === 0,
          arrival_minutes: 30,
          coupon_price_brl: 5,
          discount_limit_brl: 100,
        },
      });
      const id = randomUUID();
      campaignRuns.set(id, {
        exaRunId: run.exaRunId,
        status: run.status,
        catalog: {
          restaurant_name: run.catalog.restaurant_name,
          item_count: run.catalog.item_count,
        },
        mockCampaign: run.mockCampaign || null,
        createdAt: Date.now(),
      });
      return json(202, {
        run_id: id,
        status: run.status,
        catalog: campaignRuns.get(id).catalog,
      });
    }
    const campaignRunMatch = /^\/api\/agent\/runs\/([0-9a-f-]{36})$/.exec(
      url.pathname,
    );
    if (req.method === "GET" && campaignRunMatch) {
      const id = campaignRunMatch[1];
      const localRun = campaignRuns.get(id);
      if (!localRun) return json(404, { error: "Execução não encontrada." });
      if (!localRun.terminal) {
        if (localRun.mockCampaign) {
          Object.assign(localRun, {
            status: "completed",
            terminal: true,
            campaign: localRun.mockCampaign,
            sources: [],
            costDollars: null,
          });
        } else {
          const remoteRun = await readCampaignRun({ exaRunId: localRun.exaRunId });
          Object.assign(localRun, remoteRun, { checkedAt: Date.now() });
        }
      }
      return json(200, {
        run_id: id,
        status: localRun.status,
        terminal: Boolean(localRun.terminal),
        catalog: localRun.catalog,
        campaign: localRun.campaign,
        sources: localRun.sources || [],
        cost_dollars: localRun.costDollars ?? null,
        error: localRun.error,
      });
    }
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
      if (type === "simulation") {
        if (typeof payload.enabled !== "boolean") throw new Error("Estado inválido.");
        simulation.set(payload.enabled);
        return json(200, {state:snapshot()});
      }
      if (type === "agent") {
        const decision = await agent.run();
        return json(200, { decision, state: snapshot() });
      }
      if (type === "agent-auto") {
        if (typeof payload.enabled !== "boolean")
          throw new Error("Estado do piloto automático inválido.");
        agent.setAutomatic(payload.enabled);
        return json(200, { state: snapshot() });
      }
      const result = engine.command(type, payload);
      if (type === "reset") {agent.reset();concierge.reset();simulation.set(false);simulation.elapsed=0;simulation.seen.clear();simulation.current=null;}
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
    const status = e instanceof MenuAgentError ? e.status : 400;
    json(status, { error: e.message || "Não foi possível processar a requisição." });
  }
});
const port = Number(process.env.PORT || 3000);
server.listen(port, "127.0.0.1", () =>
  console.log(`BrazilNuts: http://localhost:${port}`),
);
