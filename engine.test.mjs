import { test } from "node:test";
import assert from "node:assert/strict";
import { Engine, discountFor } from "./engine.mjs";
function setup(n = 23) {
  const e = new Engine(() => 1000000);
  e.command("occupancy", { value: n });
  e.command("batch");
  return e;
}
const buy = (e, key = crypto.randomUUID()) =>
  e.command("buy", { version: e.version, key }).coupon;
test("exact tier boundaries", () => {
  for (const [n, d] of [
    [0, 50],
    [24, 50],
    [25, 35],
    [49, 35],
    [50, 20],
    [74, 20],
    [75, 0],
    [100, 0],
  ])
    assert.equal(discountFor(n), d);
});
test("two purchases change next discount, preserving purchased discounts", () => {
  const e = setup();
  const a = buy(e),
    b = buy(e);
  assert.equal(a.discount, 50);
  assert.equal(b.discount, 50);
  assert.equal(e.snapshot().discount, 35);
  assert.equal(e.stock, 3);
  assert.equal(e.metrics().reserved, 2);
});
test("idempotent purchase and last-coupon protection", async () => {
  const e = setup(74);
  const key = crypto.randomUUID();
  const version = e.version;
  const a = buy(e, key);
  assert.equal(e.command("buy", { version, key }).coupon.id, a.id);
  assert.throws(() => buy(e), /indisponível/);
  assert.equal(e.coupons.length, 1);
  assert.equal(e.stock, 0);
});
test("stale quote rejected", () => {
  const e = setup(24),
    version = e.version;
  buy(e);
  assert.throws(
    () => e.command("buy", { key: crypto.randomUUID(), version }),
    /mudou/,
  );
  assert.equal(e.coupons.length, 1);
});
test("validation consumes once and preserves effective occupancy", () => {
  const e = setup(),
    c = buy(e),
    before = e.metrics().effective;
  e.command("validate", { token: c.token });
  assert.equal(e.metrics().effective, before);
  assert.equal(e.metrics().reserved, 0);
  assert.equal(e.metrics().occupied, 24);
  assert.throws(() => e.command("validate", { token: c.token }), /utilizado/);
});
test("expires at deadline once, no stock replenishment", () => {
  const e = setup(),
    c = buy(e);
  e.command("advance", { minutes: 30 });
  assert.equal(c.status, "expired");
  assert.equal(e.metrics().reserved, 0);
  assert.equal(e.stock, 4);
  assert.throws(() => e.command("validate", { token: c.token }), /expirou/);
  const events = e.events.length;
  e.snapshot();
  assert.equal(e.events.length, events);
});
test("capacity, invalid input and reset", () => {
  const e = setup();
  buy(e);
  assert.throws(() => e.command("occupancy", { value: 100 }), /capacidade/);
  assert.throws(() => e.command("occupancy", { value: 2.3 }), /inválida/);
  assert.throws(
    () => e.command("validate", { token: "unknown" }),
    /encontrado/,
  );
  e.command("reset");
  assert.equal(e.coupons.length, 0);
  assert.equal(e.stock, 0);
  assert.equal(e.metrics().occupied, 80);
});
