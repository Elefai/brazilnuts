import { randomUUID } from "node:crypto";

const EXA_AGENT_RUNS_URL = "https://api.exa.ai/agent/runs";
const TERMINAL_STATUSES = new Set(["completed", "failed", "cancelled"]);
const MAX_MENU_ITEMS = 60;
const MOCK_CATALOG = {
  restaurant_name: "Casa da Castanha",
  item_count: 4,
  items: [
    {
      name: "Bowl Brasil",
      category: "Pratos",
      description: "Arroz, legumes assados e castanha-do-pará.",
      price_brl: 32.9,
    },
    {
      name: "Burger de castanha",
      category: "Lanches",
      description: "Burger vegetal, queijo e molho da casa.",
      price_brl: 29.9,
    },
    {
      name: "Suco de caju",
      category: "Bebidas",
      description: "Suco natural gelado.",
      price_brl: 12,
    },
    {
      name: "Brownie com castanha",
      category: "Sobremesas",
      description: "Brownie de chocolate com castanhas.",
      price_brl: 14,
    },
  ],
};

export class MenuAgentError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.name = "MenuAgentError";
    this.status = status;
  }
}

const asText = (value, limit = 240) =>
  typeof value === "string" ? value.trim().slice(0, limit) : "";

const findItems = (value) => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  for (const key of ["products", "items", "data", "menu_items", "menuItems"]) {
    if (Array.isArray(value[key])) return value[key];
  }
  return [];
};

const catalogName = (payload) =>
  asText(
    payload?.store?.name ||
      payload?.restaurant?.name ||
      payload?.restaurant_name ||
      payload?.name,
    100,
  );

const itemPrice = (item) => {
  for (const key of ["price", "unit_price", "sale_price", "amount"]) {
    const value = item?.[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value)))
      return Number(value);
  }
  return null;
};

const toMenuItem = (item, category) => {
  if (!item || typeof item !== "object") return null;
  const name = asText(item.name || item.title || item.product_name, 120);
  if (!name) return null;
  const itemResult = {
    name,
    category: asText(category || item.category?.name || item.category_name, 80) || "Cardápio",
  };
  const description = asText(item.description || item.details, 220);
  const price = itemPrice(item);
  if (description) itemResult.description = description;
  if (price !== null) itemResult.price_brl = price;
  return itemResult;
};

export function normalizeCatalog(payload) {
  const roots = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : findItems(payload);
  const menu = [];

  for (const root of roots) {
    const nested = findItems(root);
    const category = asText(root?.name || root?.title, 80);
    if (nested.length > 0 && nested !== roots) {
      for (const item of nested) {
        const normalized = toMenuItem(item, category);
        if (normalized) menu.push(normalized);
      }
    } else {
      const normalized = toMenuItem(root, "");
      if (normalized) menu.push(normalized);
    }
    if (menu.length >= MAX_MENU_ITEMS) break;
  }

  const items = menu.slice(0, MAX_MENU_ITEMS);
  if (!items.length)
    throw new MenuAgentError(
      "O backend de cardápio respondeu sem itens reconhecíveis.",
      502,
    );

  return {
    restaurant_name: catalogName(payload) || "Restaurante",
    item_count: items.length,
    items,
  };
}

function backendUrl(rawUrl) {
  if (!rawUrl)
    throw new MenuAgentError(
      "Configure MENU_BACKEND_URL no servidor para consultar o cardápio.",
      503,
    );
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new MenuAgentError("MENU_BACKEND_URL não é uma URL válida.", 500);
  }
  const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  if (url.protocol !== "https:" && !(url.protocol === "http:" && local))
    throw new MenuAgentError(
      "MENU_BACKEND_URL deve usar HTTPS, exceto em desenvolvimento local.",
      500,
    );
  return url;
}

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function fetchWithTimeout(fetchImpl, url, init, timeoutMs, timeoutMessage) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error?.name === "AbortError")
      throw new MenuAgentError(timeoutMessage, 504);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchCatalog({ env = process.env, fetchImpl = fetch } = {}) {
  const url = backendUrl(env.MENU_BACKEND_URL);
  const headers = { Accept: "application/json" };
  if (env.MENU_BACKEND_BEARER_TOKEN)
    headers.Authorization = `Bearer ${env.MENU_BACKEND_BEARER_TOKEN}`;

  let response;
  try {
    response = await fetchWithTimeout(
      fetchImpl,
      url,
      { headers },
      8000,
      "O backend de cardápio demorou para responder.",
    );
  } catch (error) {
    if (error instanceof MenuAgentError) throw error;
    throw new MenuAgentError("Não foi possível consultar o backend de cardápio.", 502);
  }
  const payload = await readJson(response);
  if (!response.ok)
    throw new MenuAgentError(
      `O backend de cardápio retornou HTTP ${response.status}.`,
      502,
    );
  return normalizeCatalog(payload);
}

export function buildCampaignRequest({ catalog, offer }) {
  return {
    query: [
      "Você é o agente de campanha do BrazilNuts para restaurantes.",
      "Use exclusivamente o catálogo e a oferta fornecidos em input.data; não pesquise a web e não invente itens, preços, disponibilidade, desconto, prazo ou condições.",
      "Escreva em pt-BR uma mensagem de WhatsApp curta, convidativa e honesta para a oferta vigente.",
      "O desconto, a disponibilidade e as condições são fatos imutáveis: explique-os, mas nunca os altere ou decida.",
      "Escolha no máximo três itens existentes do cardápio que combinem com a campanha e explique a seleção para o operador.",
      "Se a oferta estiver pausada ou sem disponibilidade, não incentive compra; explique a situação de forma operacional.",
    ].join(" "),
    effort: "low",
    input: {
      data: [
        {
          restaurant: catalog.restaurant_name,
          menu: catalog.items,
          current_offer: offer,
        },
      ],
    },
    outputSchema: {
      type: "object",
      properties: {
        whatsapp_message: { type: "string", maxLength: 500 },
        operator_note: { type: "string", maxLength: 400 },
        menu_highlights: {
          type: "array",
          maxItems: 3,
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              category: { type: "string" },
              reason: { type: "string", maxLength: 180 },
            },
            required: ["name", "category", "reason"],
          },
        },
      },
      required: ["whatsapp_message", "operator_note", "menu_highlights"],
    },
  };
}

function exaHeaders(apiKey) {
  return {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
  };
}

function exaError(payload, fallback) {
  return asText(payload?.error?.message || payload?.message, 200) || fallback;
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function extractSources(grounding) {
  const sources = [];
  const seen = new Set();
  const walk = (value) => {
    if (!value || sources.length >= 5) return;
    if (Array.isArray(value)) return value.forEach(walk);
    if (typeof value !== "object") return;
    if (typeof value.url === "string" && isHttpUrl(value.url) && !seen.has(value.url)) {
      seen.add(value.url);
      sources.push({ url: value.url, title: asText(value.title, 120) || value.url });
    }
    Object.values(value).forEach(walk);
  };
  walk(grounding);
  return sources;
}

function structuredOutput(run) {
  const output = run?.output?.structured;
  if (!output || typeof output !== "object")
    throw new MenuAgentError("A execução Exa foi concluída sem saída estruturada.", 502);
  return {
    whatsapp_message: asText(output.whatsapp_message, 500),
    operator_note: asText(output.operator_note, 400),
    menu_highlights: Array.isArray(output.menu_highlights)
      ? output.menu_highlights.slice(0, 3).map((item) => ({
          name: asText(item?.name, 120),
          category: asText(item?.category, 80),
          reason: asText(item?.reason, 180),
        }))
      : [],
  };
}

function requireExaKey(env) {
  if (!env.EXA_API_KEY)
    throw new MenuAgentError(
      "Configure EXA_API_KEY no servidor para executar o agente.",
      503,
    );
  return env.EXA_API_KEY;
}

function mockMode(env) {
  return env.EXA_AGENT_MOCK === "true";
}

export function agentConfiguration(env = process.env) {
  if (mockMode(env)) return { ready: true, missing: [], mock: true };
  const missing = [];
  if (!env.EXA_API_KEY) missing.push("EXA_API_KEY");
  if (!env.MENU_BACKEND_URL) missing.push("MENU_BACKEND_URL");
  return { ready: missing.length === 0, missing, mock: false };
}

function mockCampaign(catalog, offer) {
  const highlights = catalog.items.slice(0, 3).map((item) => ({
    name: item.name,
    category: item.category,
    reason: "Item do cardápio mock selecionado para testar a apresentação.",
  }));
  const paused = offer.offer_paused;
  return {
    whatsapp_message: paused
      ? "A casa está em ritmo intenso agora. Em breve teremos novas ofertas para você."
      : `Hoje é dia de aproveitar ${offer.discount_percent}% OFF no BrazilNuts. Garanta seu cupom e chegue em até ${offer.arrival_minutes} minutos!`,
    operator_note: paused
      ? "Resposta simulada: a oferta está pausada, então o agente não convida para compra."
      : `Resposta simulada: há ${offer.coupons_available} cupom(ns) disponíveis. O desconto continua definido pelo motor da demo.`,
    menu_highlights: highlights,
  };
}

export async function startCampaignRun({ offer, env = process.env, fetchImpl = fetch } = {}) {
  const mock = mockMode(env);
  const catalog = mock && !env.MENU_BACKEND_URL
    ? MOCK_CATALOG
    : await fetchCatalog({ env, fetchImpl });
  if (mock) {
    return {
      exaRunId: `mock_agent_run_${randomUUID()}`,
      status: "completed",
      catalog,
      mockCampaign: mockCampaign(catalog, offer),
    };
  }
  const apiKey = requireExaKey(env);
  const request = buildCampaignRequest({ catalog, offer });
  let response;
  try {
    response = await fetchWithTimeout(
      fetchImpl,
      EXA_AGENT_RUNS_URL,
      { method: "POST", headers: exaHeaders(apiKey), body: JSON.stringify(request) },
      15000,
      "A Exa demorou para iniciar o agente.",
    );
  } catch (error) {
    if (error instanceof MenuAgentError) throw error;
    throw new MenuAgentError("Não foi possível iniciar o agente Exa.", 502);
  }
  const run = await readJson(response);
  if (!response.ok)
    throw new MenuAgentError(exaError(run, "A Exa recusou a execução do agente."), 502);
  if (typeof run?.id !== "string" || !run.id.startsWith("agent_run_"))
    throw new MenuAgentError("A Exa devolveu uma execução sem identificador válido.", 502);
  return { exaRunId: run.id, status: run.status || "pending", catalog };
}

export async function readCampaignRun({ exaRunId, env = process.env, fetchImpl = fetch } = {}) {
  const apiKey = requireExaKey(env);
  let response;
  try {
    response = await fetchWithTimeout(
      fetchImpl,
      `${EXA_AGENT_RUNS_URL}/${encodeURIComponent(exaRunId)}`,
      { headers: exaHeaders(apiKey) },
      15000,
      "A Exa demorou para informar o status do agente.",
    );
  } catch (error) {
    if (error instanceof MenuAgentError) throw error;
    throw new MenuAgentError("Não foi possível consultar a execução Exa.", 502);
  }
  const run = await readJson(response);
  if (!response.ok)
    throw new MenuAgentError(exaError(run, "A Exa não retornou o status da execução."), 502);
  const status = run?.status || "pending";
  const result = { status, terminal: TERMINAL_STATUSES.has(status) };
  if (status === "completed") {
    result.campaign = structuredOutput(run);
    result.sources = extractSources(run?.output?.grounding);
    result.costDollars = typeof run.costDollars === "number" ? run.costDollars : null;
  } else if (status === "failed" || status === "cancelled") {
    result.error = exaError(run, "A execução Exa não foi concluída.");
  }
  return result;
}
