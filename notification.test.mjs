import { test } from "node:test";
import assert from "node:assert/strict";
import { Engine } from "./engine.mjs";
import { CampaignAgent } from "./agent.mjs";
async function setup() {
  let now = 100000;
  const e = new Engine(() => now);
  e.command("occupancy", { value: 24 });
  e.command("batch");
  await new CampaignAgent(e, { apiKey: "" }).run();
  const m = e.messages.find((m) => m.customerId === "demo-1");
  return { e, m, tick: (n) => (now += n) };
}
test("deadline begins on opening, survives reopening and rejects at 30 seconds", async () => {
  const { e, m, tick } = await setup();
  tick(60000);
  assert.equal(m.acceptBy, undefined);
  e.command("open-notification", { messageId: m.id, customerId: m.customerId });
  const end = m.acceptBy;
  tick(29000);
  e.command("open-notification", { messageId: m.id, customerId: m.customerId });
  assert.equal(m.acceptBy, end);
  tick(1000);
  assert.throws(
    () =>
      e.command("buy", {
        key: crypto.randomUUID(),
        version: e.version,
        customerId: m.customerId,
        messageId: m.id,
      }),
    /30 segundos/,
  );
  assert.equal(e.stock, 5);
  assert.equal(e.coupons.length, 0);
});
test("accept before deadline buys and starts separate arrival window", async () => {
  const { e, m, tick } = await setup();
  e.command("open-notification", { messageId: m.id, customerId: m.customerId });
  tick(29999);
  const c = e.command("buy", {
    key: crypto.randomUUID(),
    version: e.version,
    customerId: m.customerId,
    messageId: m.id,
  }).coupon;
  assert.equal(c.expiresAt - e.now(), 1800000);
  assert.equal(e.metrics().discount, 35);
});
test("cannot purchase unopened or another customer notification", async () => {
  const { e, m } = await setup();
  assert.throws(
    () =>
      e.command("buy", {
        key: crypto.randomUUID(),
        version: e.version,
        customerId: m.customerId,
        messageId: m.id,
      }),
    /Abra/,
  );
  assert.throws(
    () =>
      e.command("open-notification", { messageId: m.id, customerId: "demo-2" }),
    /encontrada/,
  );
});
