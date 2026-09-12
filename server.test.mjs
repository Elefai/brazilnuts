import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

test("HTTP analytics: empty, unknown, successful campaigns, selection and reset", { timeout: 15000 }, async t => {
  // A separate process and working directory avoid user .env and live demo state.
  const child = spawn(process.execPath, [fileURLToPath(new URL("./server.mjs", import.meta.url))], {
    cwd: tmpdir(), env: { ...process.env, PORT: "0", OPENAI_API_KEY: "" }, stdio: ["ignore", "pipe", "pipe"],
  });
  t.after(() => child.kill());
  const port = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", code => reject(new Error(`Server exited: ${code}`)));
    child.stdout.on("data", data => { const match = data.toString().match(/localhost:(\d+)/); if (match) resolve(match[1]); });
  });
  const base = `http://127.0.0.1:${port}`;
  const get = path => fetch(base + path);
  const command = async payload => {
    const r = await fetch(base + "/api/command", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    assert.equal(r.status, 200);
    return r.json();
  };
  assert.equal((await (await get("/api/analytics")).json()).selected, null);
  assert.equal((await get("/api/analytics?campaignId=missing")).status, 404);
  await command({ type: "occupancy", value: 20 });
  await command({ type: "batch" });
  await command({ type: "advance", minutes: 30 });
  await command({ type: "agent" });
  const first = await (await get("/api/analytics")).json();
  assert.equal(first.campaigns.length, 1);
  assert.equal(first.before.coverage, 1);
  assert.equal(first.after.purchases, 0);
  const state = await (await get("/api/state")).json();
  const { coupon } = await command({ type: "buy", key: "http-purchase", customerId: first.selected.customerIds[0], version: state.version });
  await command({ type: "validate", token: coupon.token });
  await command({ type: "agent" });
  const selected = await (await get(`/api/analytics?campaignId=${first.selected.id}`)).json();
  assert.equal(selected.campaigns.length, 2);
  assert.equal(selected.selected.id, first.selected.id);
  assert.equal(selected.after.purchases, 1);
  assert.equal(selected.after.buyers, 1);
  assert.equal(selected.overlaps.length, 1);
  await command({ type: "reset" });
  assert.equal((await get(`/api/analytics?campaignId=${first.selected.id}`)).status, 404);
  assert.equal((await (await get("/api/analytics")).json()).selected, null);
});
