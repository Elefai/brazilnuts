import { randomUUID } from "node:crypto";

export const WINDOW_MS = 30 * 60000;
export const dateKey = at => new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(at);

export function parseAnalyticsOptions(params) {
  const source = params.get("source") ?? "session";
  const windowMinutes = Number(params.get("window") ?? 30);
  if (!["session", "demo"].includes(source)) throw new Error("Fonte inválida.");
  if (![15, 30, 60].includes(windowMinutes)) throw new Error("Janela deve ser 15, 30 ou 60 minutos.");
  const options = { source, windowMinutes };
  for (const key of ["from", "to"]) {
    const value = params.get(key);
    if (value !== null) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value)
        throw new Error("Data inválida. Use AAAA-MM-DD.");
      options[key] = value;
    }
  }
  if (options.from && options.to && options.from > options.to) throw new Error("A data inicial deve anteceder a final.");
  return options;
}

// Independent of the bounded presentation logs. Entries are never rewritten.
export class Analytics {
  constructor(at, metrics) {
    this.startedAt = at;
    this.events = [];
    this.campaigns = [];
    this.record("state", at, metrics);
  }
  record(type, at, data = {}) {
    this.events.push({ ...data, type, at, sequence: this.events.length });
  }
  campaign(at, customerIds) {
    const campaign = { id: randomUUID(), at, customerIds: [...customerIds] };
    this.campaigns.push(campaign);
    for (const customerId of customerIds)
      this.record("invite", at, { customerId, campaignId: campaign.id });
    return campaign;
  }
  period(start, end, now) {
    const observedStart = Math.max(start, this.startedAt);
    const observedEnd = Math.max(observedStart, Math.min(end, now));
    const durationMs = observedEnd - observedStart;
    const entries = this.events.filter(e => e.at >= observedStart && e.at < end && e.at <= now);
    const states = this.events.filter(e => e.type === "state");
    let occupied = 0, reserved = 0;
    for (let i = 0; i < states.length; i++) {
      const s = states[i];
      const duration = Math.max(0, Math.min(observedEnd, states[i + 1]?.at ?? observedEnd) - Math.max(observedStart, s.at));
      occupied += s.occupied * duration;
      reserved += s.reserved * duration;
    }
    const invites = entries.filter(e => e.type === "invite");
    const purchases = entries.filter(e => e.type === "purchase");
    const invited = new Set(invites.map(e => e.customerId)).size;
    const buyers = new Set(purchases.filter(p => invites.some(i => i.customerId === p.customerId && i.sequence < p.sequence && i.at <= p.at)).map(p => p.customerId)).size;
    return {
      start, end, observedStart, observedEnd, durationMs,
      coverage: durationMs / (end - start),
      occupied: durationMs ? occupied / durationMs : null,
      reserved: durationMs ? reserved / durationMs : null,
      purchases: purchases.length, invited, buyers,
      arrivals: entries.filter(e => e.type === "validation").length,
      convertedArrivals: new Set(entries.filter(e => e.type === "validation" && purchases.some(p => p.customerId === e.customerId && invites.some(i => i.customerId === p.customerId && i.sequence < p.sequence))).map(e => e.customerId)).size,
      expirations: entries.filter(e => e.type === "expiration").length,
      conversion: invited ? buyers / invited * 100 : null,
    };
  }
  stateAt(at, exclusive = false) {
    let result = null;
    for (const e of this.events)
      if (e.type === "state" && (exclusive ? e.at < at : e.at <= at)) result = e;
    return result;
  }
  comparison(campaign, now, minutes) {
    const window = minutes * 60000;
    const before = this.period(campaign.at - window, campaign.at, now);
    const after = this.period(campaign.at, campaign.at + window, now);
    const initial = this.stateAt(campaign.at, true)?.occupied ?? null;
    // Completed windows are half-open: later boundary events must not change them.
    const final = this.stateAt(Math.min(campaign.at + window, now), now >= campaign.at + window)?.occupied ?? null;
    return { before, after, initial, final };
  }
  snapshot(now, campaignId, { windowMinutes = 30, from, to, source = "session" } = {}) {
    const all = [...this.campaigns].reverse();
    if (campaignId && !all.some(c => c.id === campaignId)) return null;
    const campaigns = all.filter(c => (!from || dateKey(c.at) >= from) && (!to || dateKey(c.at) <= to));
    const selected = campaigns.find(c => c.id === campaignId) ?? campaigns[0];
    const availableRange = { from: dateKey(all.at(-1)?.at ?? now), to: dateKey(all[0]?.at ?? now) };
    const rows = campaigns.map(c => {
      const r = this.comparison(c, now, windowMinutes);
      return { id: c.id, at: c.at, label: c.label ?? "Campanha da sessão", initial: r.initial, final: r.final, purchases: r.after.purchases, conversion: r.after.conversion };
    });
    const base = { now, source, windowMinutes, availableRange, campaigns, rows };
    if (!selected) return { ...base, selected: null, before: null, after: null, overlaps: [], series: [], initial: null, final: null };
    const comparison = this.comparison(selected, now, windowMinutes);
    const { before, after } = comparison;
    const end = Math.min(after.end, now);
    const start = Math.max(before.start, this.startedAt);
    const states = this.events.filter(e => e.type === "state" && e.at >= start && e.at < after.end && e.at <= now);
    const points = new Map();
    const addPoint = (at, s) => { if (s) points.set(at, { minute: (at - selected.at) / 60000, occupied: s.occupied, demand: s.occupied + s.reserved }); };
    addPoint(start, this.stateAt(start));
    for (const s of states) addPoint(s.at, s);
    addPoint(end, this.stateAt(end, now >= after.end));
    const series = [...points.values()];
    const overlaps = all.filter(c => c.id !== selected.id && c.at >= before.start && c.at < after.end && c.at <= now);
    return { ...base, selected, ...comparison, overlaps, series };
  }
}
