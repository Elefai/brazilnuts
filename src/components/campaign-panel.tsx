import { Bot, Sparkles, Send, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
export function CampaignPanel({
  state: s,
  busy,
  run,
  toggleAuto,
  select,
}: {
  state: any;
  busy: boolean;
  run: () => void;
  toggleAuto: () => void;
  select: (id: string) => void;
}) {
  const last = s.agent?.last;
  return (
    <Card id="agent" className="campaign-panel">
      <CardContent>
        <div className="panel-title">
          <div>
            <h2>
              <Sparkles size={18} /> Agente de campanhas
            </h2>
            <p>
              Observa o salão, escolhe o público e executa convites simulados.
            </p>
          </div>
          <Badge variant="outline">
            <Bot size={12} /> {s.agent?.autoEnabled ? "Piloto automático" : "Manual"}
          </Badge>
        </div>
        <div className="campaign-columns">
          <div>
            <div className="agent-steps">
              <span>01 Observar</span>
              <span>02 Decidir</span>
              <span>03 Convidar</span>
            </div>
            <h3>
              {last
                ? last.action === "send"
                  ? `${last.customerIds.length} clientes convidados.`
                  : "Campanha pausada."
                : "Uma decisão, com contexto."}
            </h3>
            <p>
              {last?.reason ||
                `São ${s.occupied} mesas ocupadas e ${s.reserved} clientes a caminho. O agente cruza esse movimento com os perfis da base fictícia.`}
            </p>
            {last && (
              <>
                <small>
                  Última análise: {last.observed.occupied} ocupadas +{" "}
                  {last.observed.reserved} reservas · oferta{" "}
                  {last.observed.discount}%
                </small>
                {last.opening && (
                  <blockquote>
                    Rascunho de abordagem: “{last.opening}”
                  </blockquote>
                )}
              </>
            )}
            <div className="agent-actions">
              <Button disabled={busy || s.agent?.busy} onClick={run}>
                <Send size={14} />
                {s.agent?.busy ? "Analisando…" : "Executar agora"}
              </Button>
              <Button
                variant="outline"
                disabled={busy || s.agent?.busy}
                onClick={toggleAuto}
              >
                <Bot size={14} />
                {s.agent?.autoEnabled ? "Desativar piloto" : "Ativar piloto"}
              </Button>
            </div>
            <div className="agent-disclaimer">
              {s.agent?.autoEnabled
                ? "O concierge acompanha comandas, compras e expirações. Libera até 5 cupons e envia convites sozinho, com intervalo mínimo de 60 segundos entre campanhas."
                : last?.notice || "Sem chave da API: seleção demonstrativa por proximidade."}
              <br />
              {s.agent?.configured ? 'OpenAI configurada. ' : 'Sem chave: decisões demonstrativas por regras. '}
              Envios sempre simulados. Termos comerciais aplicados pelo sistema.
              Limite de um contato a cada 30 minutos por cliente.
            </div>
            {s.agent?.autoError && (
              <p className="agent-auto-error" role="alert">{s.agent.autoError}</p>
            )}
          </div>
          <div>
            <h3 className="customer-base-title">
              <Users size={15} /> Base de clientes{" "}
              <Badge variant="secondary">Fictícia</Badge>
            </h3>
            <div className="customer-base">
              {s.customers?.map((c: any) => {
                const coupon = s.coupons.find(
                  (p: any) => p.customerId === c.id,
                );
                const status =
                  coupon?.status === "active"
                    ? "A caminho"
                    : coupon?.status === "used"
                      ? "Chegou"
                      : coupon?.status === "expired"
                        ? "Expirado"
                        : c.lastContact !== null
                          ? "Recebeu convite"
                          : !c.consent
                            ? "Sem autorização"
                            : "Disponível";
                return (
                  <button
                    key={c.id}
                    onClick={() => select(c.id)}
                    className="customer-row"
                  >
                    <span className="customer-initial">{c.name[0]}</span>
                    <span>
                      <b>{c.name}</b>
                      <small>
                        {c.preference} · {c.minutesAway} min
                      </small>
                    </span>
                    <Badge variant="outline">{status}</Badge>
                  </button>
                );
              })}
            </div>
            <small>Toque em um cliente para abrir seu celular.</small>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
