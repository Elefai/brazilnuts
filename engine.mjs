import { randomUUID } from "node:crypto";
import { seedCustomers } from "./agent.mjs";

export const discountFor = (n) =>
  n >= 75 ? 0 : n >= 50 ? 20 : n >= 25 ? 35 : 50;
export class Engine {
  constructor(clock = Date.now) {
    this.clock = clock;
    this.reset();
  }
  reset() {
    this.offset = 0;
    this.tables = Array.from({ length: 100 }, (_, i) => i < 80);
    this.coupons = [];
    this.customers = seedCustomers();
    this.events = [];
    this.messages = [];
    this.stock = 0;
    this.version = randomUUID();
    this.log("Demo iniciada", "80 mesas ocupadas · nenhuma campanha ativa");
  }
  now() {
    return this.clock() + this.offset;
  }
  log(title, detail) {
    this.events.unshift({ id: randomUUID(), at: this.now(), title, detail });
    this.events = this.events.slice(0, 60);
  }
  metrics() {
    const occupied = this.tables.filter(Boolean).length,
      reserved = this.coupons.filter((c) => c.status === "active").length;
    const effective = occupied + reserved,
      discount = discountFor(effective);
    return {
      occupied,
      reserved,
      effective,
      free: 100 - effective,
      discount,
      available: Math.max(0, Math.min(this.stock, 75 - effective)),
    };
  }
  expire() {
    const before = this.metrics();
    let changed = false;
    for (const c of this.coupons)
      if (c.status === "active" && this.now() >= c.expiresAt) {
        c.status = "expired";
        changed = true;
        this.log(
          "Cupom expirado",
          `${c.customer} · reserva liberada · pagamento fictício estornado`,
        );
      }
    if (changed) this.refresh(before);
  }
  refresh(before, force = false) {
    const m = this.metrics();
    if (before.discount !== m.discount || force) {
      this.version = randomUUID();
      this.log(
        m.discount
          ? `Oferta atual: ${m.discount}% OFF`
          : "Novas ofertas pausadas",
        `${m.occupied} ocupadas + ${m.reserved} a caminho`,
      );
      if (m.available > 0)
        this.messages.unshift({
          id: randomUUID(),
          at: this.now(),
          discount: m.discount,
          text: `Uma mesa te espera! Garanta ${m.discount}% OFF no BrazilNuts. Compre seu cupom por R$ 5 e chegue em até 30 minutos.`,
        });
    }
    this.messages = this.messages.slice(0, 15);
  }
  snapshot() {
    this.expire();
    return {
      now: this.now(),
      tables: this.tables,
      coupons: this.coupons,
      customers: this.customers,
      events: this.events,
      messages: this.messages,
      stock: this.stock,
      version: this.version,
      ...this.metrics(),
    };
  }
  command(type, p = {}) {
    this.expire();
    const before = this.metrics();
    let result = {};
    if (type === "reset") {
      this.reset();
      return result;
    }
    if (type === "occupancy") {
      if (
        !Number.isInteger(p.value) ||
        p.value < 0 ||
        p.value > 100 - before.reserved
      )
        throw new Error(
          "Quantidade inválida ou capacidade reservada para clientes a caminho.",
        );
      this.tables = this.tables.map((_, i) => i < p.value);
      this.log("Movimento atualizado", `${p.value} mesas com comanda aberta`);
    } else if (type === "table") {
      if (!Number.isInteger(p.index) || p.index < 0 || p.index >= 100)
        throw new Error("Mesa inválida.");
      if (!this.tables[p.index] && before.free <= 0)
        throw new Error("Capacidade esgotada.");
      this.tables[p.index] = !this.tables[p.index];
      this.log(
        this.tables[p.index] ? "Comanda aberta" : "Comanda fechada",
        `Mesa ${p.index + 1}`,
      );
    } else if (type === "batch") {
      if (before.available > 0)
        throw new Error("Use o lote atual antes de liberar outro.");
      if (before.discount === 0)
        throw new Error("Ocupação alta: novos cupons pausados.");
      this.stock = Math.min(5, 75 - before.effective);
      this.log("Lote liberado", `${this.stock} cupons disponíveis`);
    } else if (type === "buy") {
      if (typeof p.key !== "string" || p.key.length < 8 || p.key.length > 100)
        throw new Error("Identificador de compra inválido.");
      const prior = this.coupons.find((c) => c.key === p.key);
      if (prior) return { coupon: prior };
      if (p.version !== this.version)
        throw new Error(
          "A oferta mudou. Confira o desconto atual e aceite novamente.",
        );
      if (before.available <= 0 || !before.discount)
        throw new Error("Oferta indisponível neste momento.");
      const customer = this.customers.find((c) => c.id === p.customerId);
      if (p.customerId && !customer) throw new Error("Cliente desconhecido.");
      if (
        customer &&
        this.coupons.some(
          (c) =>
            c.customerId === customer.id &&
            ["active", "used"].includes(c.status),
        )
      )
        throw new Error("Este cliente já tem um cupom nesta demonstração.");
      const c = {
        id: randomUUID(),
        token: randomUUID(),
        key: p.key,
        customer: customer?.name || `Cliente ${this.coupons.length + 1}`,
        customerId: customer?.id || null,
        discount: before.discount,
        paidCents: 500,
        status: "active",
        createdAt: this.now(),
        expiresAt: this.now() + 30 * 60 * 1000,
      };
      this.coupons.unshift(c);
      this.stock--;
      this.log(
        "Compra confirmada",
        `${c.customer} · ${c.discount}% OFF · R$ 5 simulados`,
      );
      result = { coupon: c };
    } else if (type === "validate") {
      const c = this.coupons.find((c) => c.token === p.token);
      if (!c) throw new Error("Cupom não encontrado.");
      if (c.status !== "active")
        throw new Error(
          c.status === "used"
            ? "Este cupom já foi utilizado."
            : "Este cupom expirou.",
        );
      const i = this.tables.indexOf(false);
      if (i < 0) throw new Error("Não há mesa livre.");
      c.status = "used";
      c.table = i + 1;
      this.tables[i] = true;
      this.log(
        "QR validado",
        `${c.customer} chegou · mesa ${i + 1} · ${c.discount}% preservados`,
      );
    } else if (type === "advance") {
      if (![5, 30].includes(p.minutes)) throw new Error("Avanço inválido.");
      this.offset += p.minutes * 60000;
      this.expire();
      this.log("Relógio avançado", `+${p.minutes} minutos`);
      return result;
    } else throw new Error("Comando desconhecido.");
    this.refresh(before, type === "batch");
    return result;
  }
}
