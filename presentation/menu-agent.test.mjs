import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MenuAgentError,
  agentConfiguration,
  buildCampaignRequest,
  extractSources,
  normalizeCatalog,
} from "./menu-agent.mjs";

test("normalizes the SPKR-style category catalog before sharing it with the agent", () => {
  const catalog = normalizeCatalog({
    store: { name: "Restaurante Lab" },
    data: [
      {
        name: "Lanches",
        products: [
          { name: "Burger Brasil", price: "31.90", description: "Carne e queijo" },
        ],
      },
      { name: "Bebidas", products: [{ name: "Suco de caju", price: 12 }] },
    ],
  });
  assert.equal(catalog.restaurant_name, "Restaurante Lab");
  assert.deepEqual(catalog.items[0], {
    name: "Burger Brasil",
    category: "Lanches",
    description: "Carne e queijo",
    price_brl: 31.9,
  });
  assert.equal(catalog.item_count, 2);
});

test("refuses an unrecognized backend response", () => {
  assert.throws(() => normalizeCatalog({ data: [{ id: 1 }] }), MenuAgentError);
});

test("builds a bounded low-effort Exa Agent request with immutable offer facts", () => {
  const request = buildCampaignRequest({
    catalog: { restaurant_name: "Lab", items: [{ name: "Prato do dia", category: "Almoço" }] },
    offer: { discount_percent: 35, coupons_available: 3, arrival_minutes: 30 },
  });
  assert.equal(request.effort, "low");
  assert.equal(request.input.data[0].current_offer.discount_percent, 35);
  assert.equal(request.outputSchema.properties.menu_highlights.maxItems, 3);
  assert.match(request.query, /não pesquise a web/);
});

test("reports configuration without exposing a secret", () => {
  assert.deepEqual(agentConfiguration({}), {
    ready: false,
    missing: ["EXA_API_KEY", "MENU_BACKEND_URL"],
    mock: false,
  });
});

test("enables the complete local mock without a menu backend or Exa key", () => {
  assert.deepEqual(agentConfiguration({ EXA_AGENT_MOCK: "true" }), {
    ready: true,
    missing: [],
    mock: true,
  });
});

test("exposes only safe HTTP sources from Exa grounding", () => {
  assert.deepEqual(
    extractSources({ title: "Menu", url: "https://example.test/menu", bad: "file:///secret" }),
    [{ title: "Menu", url: "https://example.test/menu" }],
  );
});
