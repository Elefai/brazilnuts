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
test("campaign history keeps the funnel identifiers used by the dashboard", async () => {
  const e = setup(),
    result = await new CampaignAgent(e, { apiKey: "" }).run(),
    campaign = e.snapshot().campaigns[0];
  assert.equal(campaign.action, "send");
  assert.deepEqual(campaign.customerIds, result.customerIds);
  assert.equal(campaign.messageIds.length, result.customerIds.length);
  const message = e.messages.find((item) => item.id === campaign.messageIds[0]);
  e.command("open-notification", {
    messageId: message.id,
    customerId: message.customerId,
  });
  assert.notEqual(message.openedAt, undefined);
});
test("one campaign supports several client journeys with current offer versions", async () => {
  const e = setup();
  const result = await new CampaignAgent(e, { apiKey: "" }).run({
    automatic: true,
  });
  const campaign = e.snapshot().campaigns[0];
  const openAndBuy = (customerId) => {
    const message = e.messages.find(
      (item) => item.customerId === customerId && campaign.messageIds.includes(item.id),
    );
    const notification = e.command("open-notification", {
      messageId: message.id,
      customerId,
    }).notification;
    return e.command("buy", {
      messageId: message.id,
      version: notification.offerVersion,
      key: `multi-client-${customerId}`,
      customerId,
    }).coupon;
  };

  const first = openAndBuy(result.customerIds[0]);
  openAndBuy(result.customerIds[1]);
  openAndBuy(result.customerIds[2]);
  const fourthMessage = e.messages.find(
    (item) =>
      item.customerId === result.customerIds[3] && campaign.messageIds.includes(item.id),
  );
  e.command("open-notification", {
    messageId: fourthMessage.id,
    customerId: fourthMessage.customerId,
  });
  e.command("validate", { token: first.token });

  const recipientIds = new Set(result.customerIds);
  assert.equal(result.customerIds.length, 5);
  assert.equal(
    e.messages.filter((item) => recipientIds.has(item.customerId) && item.openedAt !== undefined)
      .length,
    4,
  );
  assert.equal(e.coupons.filter((item) => recipientIds.has(item.customerId)).length, 3);
  assert.equal(
    e.coupons.filter(
      (item) => recipientIds.has(item.customerId) && item.status === "used",
    ).length,
    1,
  );
});
test("automatic campaign runs are marked for the results dashboard", async () => {
  const e = setup();
  const result = await new CampaignAgent(e, { apiKey: "" }).run({ automatic: true });
  assert.equal(result.automatic, true);
  assert.equal(e.snapshot().campaigns[0].automatic, true);
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
  await new CampaignAgent(e, { apiKey: "" }).run();
  const message = e.messages.find((m) => m.customerId === id);
  e.command("open-notification", { messageId: message.id, customerId: id });
  const c = e.command("buy", {
    messageId: message.id,
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
