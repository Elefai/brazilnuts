const schema = {
  type: "object",
  additionalProperties: false,
  properties: {
    action: { type: "string", enum: ["send", "pause"] },
    reason: { type: "string" },
    customerIds: { type: "array", items: { type: "string" } },
    opening: { type: "string" },
  },
  required: ["action", "reason", "customerIds", "opening"],
};
export function seedCustomers() {
  return [
    "Ana",
    "Bruno",
    "Carla",
    "Diego",
    "Elisa",
    "Felipe",
    "Gabriela",
    "Hugo",
    "Isabela",
    "João",
    "Lia",
    "Marcos",
  ].map((name, i) => ({
    id: `demo-${i + 1}`,
    name: `${name} (demo)`,
    preference: ["Almoço executivo", "Comida brasileira", "Vegetariano"][i % 3],
    minutesAway: [5, 8, 12, 18, 7, 10, 25, 35, 9, 15, 6, 20][i],
    consent: ![7, 10].includes(i),
    lastContact: null,
  }));
}
export function contextFor(engine) {
  const s = engine.snapshot();
  return {
    version: s.version,
    occupied: s.occupied,
    reserved: s.reserved,
    discount: s.discount,
    available: s.available,
    customers: engine.customers
      .filter(
        (c) =>
          c.consent &&
          c.minutesAway <= 30 &&
          !engine.coupons.some(
            (p) =>
              p.customerId === c.id && ["active", "used"].includes(p.status),
          ) &&
          (c.lastContact === null || s.now - c.lastContact >= 30 * 60000),
      )
      .map(({ id, preference, minutesAway }) => ({
        id,
        preference,
        minutesAway,
      })),
  };
}
export function fallback(context) {
  const ids = [...context.customers]
    .sort((a, b) => a.minutesAway - b.minutesAway)
    .slice(0, context.available)
    .map((c) => c.id);
  return {
    action: ids.length && context.discount ? "send" : "pause",
    customerIds: ids,
    reason: !context.discount
      ? "A demanda já atingiu o limite. Pausar os convites."
      : !context.available
        ? "Libere um lote antes de convidar os clientes."
        : !ids.length
          ? "Os clientes elegíveis já foram contatados ou têm cupons. Aguardar novas oportunidades."
          : "Priorizar clientes próximos, com autorização e sem cupom pendente.",
    opening: "Que tal uma pausa para um almoço especial?",
  };
}
export async function decide(
  context,
  {
    apiKey = process.env.OPENAI_API_KEY,
    model = process.env.OPENAI_MODEL || "gpt-5-mini",
    fetcher = fetch,
  } = {},
) {
  if (!apiKey)
    return {
      ...fallback(context),
      source: "demo",
      notice: "Sem chave configurada: decisão demonstrativa por regras.",
    };
  const response = await fetcher("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(20000),
    body: JSON.stringify({
      model,
      store: false,
      instructions:
        "Você gerencia campanhas de um restaurante fictício. Decida enviar convites ou pausar conforme ocupação, reservas, estoque, preferências e tempo de chegada. Escolha apenas IDs elegíveis fornecidos, no máximo available. Se não há desconto ou estoque, pause. Explique brevemente em português com fatos do contexto. opening é somente uma frase convidativa, sem números, preços, descontos, condições ou promessas. O sistema acrescenta os termos. Não invente dados. Retorne o JSON solicitado.",
      input: JSON.stringify(context),
      text: {
        format: {
          type: "json_schema",
          name: "campaign_decision",
          strict: true,
          schema,
        },
      },
    }),
  });
  if (!response.ok)
    throw new Error(`OpenAI indisponível (HTTP ${response.status}).`);
  const data = await response.json();
  if (data.status !== "completed")
    throw new Error("A IA não concluiu a decisão.");
  const text = data.output
    ?.flatMap((o) => o.content || [])
    .filter((c) => c.type === "output_text")
    .map((c) => c.text)
    .join("");
  const decision = JSON.parse(text);
  if (
    !["send", "pause"].includes(decision.action) ||
    !Array.isArray(decision.customerIds) ||
    !decision.customerIds.every((id) => typeof id === "string") ||
    typeof decision.reason !== "string" ||
    typeof decision.opening !== "string"
  )
    throw new Error("Resposta inválida do agente.");
  return {
    ...decision,
    source: "openai",
    notice: `Decisão gerada pela OpenAI · ${model}`,
  };
}
export class CampaignAgent {
  constructor(engine, options = {}) {
    this.engine = engine;
    this.options = options;
    this.busy = false;
    this.last = null;
  }
  snapshot() {
    return {
      busy: this.busy,
      configured: Boolean(this.options.apiKey ?? process.env.OPENAI_API_KEY),
      last: this.last,
    };
  }
  reset() {
    this.last = null;
  }
  async run() {
    if (this.busy) throw new Error("O agente já está analisando.");
    this.busy = true;
    const context = contextFor(this.engine),
      fingerprint = JSON.stringify(context);
    try {
      let decision;
      try {
        decision = await decide(context, this.options);
      } catch {
        decision = {
          ...fallback(context),
          source: "fallback",
          notice:
            "IA indisponível: usando regras demonstrativas. Nenhuma decisão de IA aplicada.",
        };
      }
      if (fingerprint !== JSON.stringify(contextFor(this.engine)))
        throw new Error(
          "O salão mudou durante a análise. Execute o agente novamente.",
        );
      const allowed = new Set(context.customers.map((c) => c.id));
      const ids = [...new Set(decision.customerIds)]
        .filter((id) => allowed.has(id))
        .slice(0, context.available);
      const send =
        decision.action === "send" && context.discount > 0 && ids.length > 0;
      // Generated copy is a suggestion; actual deliveries always use authoritative terms.
      const opening = decision.opening.slice(0, 220);
      const message = `Uma mesa te espera! Garanta ${context.discount}% OFF sobre até R$ 100 em itens elegíveis. Cupom por R$ 5, abatidos da conta. Chegue em até 30 minutos após comprar. Oferta sujeita à disponibilidade. Não cumulativo.`;
      if (send)
        for (const id of ids) {
          const c = this.engine.customers.find((c) => c.id === id);
          c.lastContact = this.engine.now();
          this.engine.messages.unshift({
            id: crypto.randomUUID(),
            at: this.engine.now(),
            customerId: id,
            discount: context.discount,
            text: message,
            source: decision.source,
          });
        }
      this.engine.messages = this.engine.messages.slice(0, 100);
      this.last = {
        at: this.engine.now(),
        action: send ? "send" : "pause",
        source: decision.source,
        notice: decision.notice,
        reason: decision.reason.slice(0, 600),
        opening,
        customerIds: send ? ids : [],
        message: send ? message : null,
        observed: {
          occupied: context.occupied,
          reserved: context.reserved,
          available: context.available,
          discount: context.discount,
        },
      };
      this.engine.log(
        send
          ? "Agente: convites simulados enviados"
          : "Agente: campanha pausada",
        send
          ? `${ids.length} clientes · ${context.discount}% OFF · ${decision.source}`
          : this.last.reason,
      );
      return this.last;
    } finally {
      this.busy = false;
    }
  }
}
