import { Analytics, dateKey } from "./analytics.mjs";

// Fully synthetic, reproducible history. No engine commands or external services.
export function createDemoAnalytics(startedAt = Date.now()) {
  const lastDate = dateKey(startedAt);
  const last = Date.parse(`${lastDate}T19:00:00-03:00`);
  const day = 86400000, minute = 60000;
  const analytics = new Analytics(last - 6 * day - 60 * minute, { occupied: 25, reserved: 0 });
  const labels = ["Movimento recuperado", "Convites de fim de tarde", "Conversão moderada", "Vouchers com expiração", "Público próximo"];
  for (let d = 0; d < 7; d++) {
    const at = last - (6 - d) * day, highlight = d === 6;
    const initial = highlight ? 25 : 25 + (d % 5) * 4;
    const batches = highlight ? 10 : 2 + d % 5;
    const buysPerBatch = 5;
    const invitesPerBatch = highlight ? 10 : [5, 10, 20, 25][d % 4];
    const id = `demo-${dateKey(at)}`;
    const raw = [], customers = [];
    const push = (type, when, data = {}) => raw.push({ type, at: when, ...data });
    push("state", at - 60 * minute, { occupied: initial, reserved: 0 });
    // Some historical background movement, while the featured baseline stays at 25.
    if (!highlight) push("state", at - 20 * minute, { occupied: initial - 2, reserved: 0 });
    for (let b = 0; b < batches; b++) {
      const time = at + b * 2.4 * minute;
      push("batch", time, { stock: 5 });
      // Waves of up to five distinct invitees while the lot is still available.
      for (let k = 0; k < invitesPerBatch; k++) {
        const customerId = `${id}-${b}-${k}`;
        customers.push(customerId);
        push("invite", time + Math.floor(k / 5) * .02 * minute, { customerId, campaignId: id });
        if (k < buysPerBatch) {
          const createdAt = time + .2 * minute;
          const couponId = `coupon-${customerId}`;
          push("purchase", createdAt, { customerId, couponId, expiresAt: createdAt + 30 * minute });
          if (!highlight && d % 4 === 3 && k === 0)
            push("expiration", createdAt + 30 * minute, { customerId, couponId });
          else push("validation", time + 1.5 * minute, { customerId, couponId });
        }
      }
    }
    push("walkin", at + 29 * minute, { count: highlight ? 5 : 1 + d % 3 });
    let occupied = initial, reserved = 0;
    for (const event of raw.sort((a, b) => a.at - b.at)) {
      if (event.type === "state") { occupied = event.occupied; reserved = event.reserved; }
      if (event.type === "purchase") reserved++;
      if (event.type === "validation") { reserved--; occupied++; }
      if (event.type === "expiration") reserved--;
      if (event.type === "walkin") occupied += event.count;
      analytics.record(event.type, event.at, event);
      if (["purchase", "validation", "expiration", "walkin"].includes(event.type))
        analytics.record("state", event.at, { occupied, reserved });
    }
    analytics.campaigns.push({ id, at, customerIds: customers, label: highlight ? "Destaque · de 25% a 80%" : labels[d % labels.length] });
  }
  return { analytics, now: last + 60 * minute };
}
