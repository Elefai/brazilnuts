import { test } from "node:test";
import assert from "node:assert/strict";
import { Engine } from "./engine.mjs";
import { CampaignAgent, contextFor } from "./agent.mjs";
const setup = () => {
  const e = new Engine(() => 100000);
  e.command("occupancy", { value: 23 });
  e.command("batch");
  return e;
};
test("demo sends to eligible customers only and respects cooldown", async () => {
  const e = setup(),
    a = new CampaignAgent(e, { apiKey: "" });
  const r = await a.run();
  assert.equal(r.source, "demo");
  assert.equal(r.customerIds.length, 5);
  assert.equal(e.messages.filter((m) => m.customerId).length, 5);
  assert.ok(!r.customerIds.includes("demo-11"));
  assert.ok(!contextFor(e).customers.some((c) => r.customerIds.includes(c.id)));
  assert.equal(e.coupons.length, 0);
  assert.equal(e.stock, 5);
});
test("model output is bounded and cannot set commercial terms", async () => {
  const e = setup();
  let request;
  const a = new CampaignAgent(e, {
    apiKey: "test",
    fetcher: async (_, p) => {
      request = JSON.parse(p.body);
      return {
        ok: true,
        json: async () => ({
          status: "completed",
          output: [
            {
              content: [
                {
                  type: "output_text",
                  text: JSON.stringify({
                    action: "send",
                    customerIds: ["demo-1", "demo-1", "demo-11", "unknown"],
                    reason: "Convidar clientes próximos.",
                    opening: "Desconto inventado de 99%",
                  }),
                },
              ],
            },
          ],
        }),
      };
    },
  });
  const r = await a.run();
  assert.equal(request.text.format.type, "json_schema");
  assert.equal(r.source, "openai");
  assert.deepEqual(r.customerIds, ["demo-1"]);
  assert.ok(!r.message.includes("99"));
  assert.ok(r.message.includes("50%"));
});
test("API failure is explicitly labeled fallback", async () => {
  const a = new CampaignAgent(setup(), {
    apiKey: "test",
    fetcher: async () => {
      throw Error("network");
    },
  });
  assert.equal((await a.run()).source, "fallback");
});
test("state changes during inference discard action", async () => {
  const e = setup();
  let done;
  const a = new CampaignAgent(e, {
    apiKey: "test",
    fetcher: () =>
      new Promise((resolve) => {
        done = resolve;
      }),
  });
  const pending = a.run();
  e.command("occupancy", { value: 60 });
  done({ ok: false, status: 500 });
  await assert.rejects(pending, /mudou/);
  assert.equal(e.messages.filter((m) => m.customerId).length, 0);
  assert.equal(a.busy, false);
});
test("reset while inference pending cannot deliver old campaign", async () => {
  const e = setup();
  let done;
  const a = new CampaignAgent(e, {
    apiKey: "test",
    fetcher: () =>
      new Promise((resolve) => {
        done = resolve;
      }),
  });
  const pending = a.run();
  e.command("reset");
  a.reset();
  done({ ok: false, status: 500 });
  await assert.rejects(pending, /mudou/);
  assert.equal(a.last, null);
});
test("high occupancy pauses and customer purchase maps to profile", async () => {
  const e = setup(),
    id = "demo-1";
  const c = e.command("buy", {
    key: crypto.randomUUID(),
    version: e.version,
    customerId: id,
  }).coupon;
  assert.equal(c.customerId, id);
  assert.ok(!contextFor(e).customers.some((c) => c.id === id));
  e.command("occupancy", { value: 75 });
  assert.equal(
    (await new CampaignAgent(e, { apiKey: "" }).run()).action,
    "pause",
  );
});
