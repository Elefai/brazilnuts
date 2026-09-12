import { BarChart3, Check, Eye, Send, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const rate = (part: number, total: number) =>
  total > 0 ? `${Math.round((part / total) * 100)}%` : "—";

function campaignStats(campaign: any, state: any) {
  const messageById = new Map(
    state.messages.map((message: any) => [message.id, message]),
  );
  const recipients = new Set(campaign.customerIds || []);
  const messages = (campaign.messageIds || [])
    .map((id: string) => messageById.get(id))
    .filter(Boolean);
  const coupons = state.coupons.filter(
    (coupon: any) =>
      recipients.has(coupon.customerId) && coupon.createdAt >= campaign.at,
  );
  return {
    sent: recipients.size,
    opened: messages.filter((message: any) => message.openedAt !== undefined)
      .length,
    purchased: coupons.length,
    arrived: coupons.filter((coupon: any) => coupon.status === "used").length,
  };
}

export function CampaignInsights({ state }: { state: any }) {
  const campaigns = Array.isArray(state.campaigns) ? state.campaigns : [];
  const history = campaigns.slice(-6);
  const totals = campaigns.reduce(
    (result: any, campaign: any) => {
      const stats = campaignStats(campaign, state);
      for (const key of Object.keys(stats)) result[key] += stats[key];
      return result;
    },
    { sent: 0, opened: 0, purchased: 0, arrived: 0 },
  );
  const peak = Math.max(
    1,
    ...history.flatMap((campaign: any) => {
      const stats = campaignStats(campaign, state);
      return [stats.sent, stats.opened, stats.purchased, stats.arrived];
    }),
  );
  const last = campaigns.at(-1);
  const current = last ? campaignStats(last, state) : null;

  return (
    <Card id="results" className="insights-card">
      <CardContent>
        <div className="panel-title">
          <div>
            <h2>
              <BarChart3 size={17} /> Evolução da campanha
            </h2>
            <p>Funil real da simulação, do convite até a chegada.</p>
          </div>
          <Badge variant="outline">
            <TrendingUp size={12} /> {rate(totals.purchased, totals.sent)} conversão
          </Badge>
        </div>
        {campaigns.length === 0 ? (
          <div className="insights-empty">
            <BarChart3 size={22} />
            <div>
              <b>Ainda não há resultados para comparar.</b>
              <p>Execute o agente de campanhas para iniciar a evolução.</p>
            </div>
          </div>
        ) : (
          <>
            {last && current && (
              <div className="campaign-current">
                <span>RODADA EM FOCO</span>
                <b>
                  {last.automatic
                    ? "O piloto automático acabou de agir."
                    : "A campanha foi acionada manualmente."}
                </b>
                <p>
                  {current.sent} convites → {current.opened} aberturas → {current.purchased} compras → {current.arrived} chegadas
                </p>
              </div>
            )}
            <div className="funnel-metrics">
              <div>
                <span><Send size={13} /> Convites</span>
                <b>{totals.sent}</b>
                <small>público alcançado</small>
              </div>
              <div>
                <span><Eye size={13} /> Aberturas</span>
                <b>{totals.opened}</b>
                <small>{rate(totals.opened, totals.sent)} dos convites</small>
              </div>
              <div>
                <span><TrendingUp size={13} /> Compras</span>
                <b>{totals.purchased}</b>
                <small>{rate(totals.purchased, totals.sent)} de conversão</small>
              </div>
              <div>
                <span><Check size={13} /> Chegadas</span>
                <b>{totals.arrived}</b>
                <small>{rate(totals.arrived, totals.purchased)} dos cupons</small>
              </div>
            </div>
            <figure className="campaign-figure">
              <figcaption>Resultado das últimas campanhas</figcaption>
              <div
                className="campaign-chart"
                role="img"
                aria-label="Barras de convites, aberturas, compras e chegadas por campanha"
              >
                {history.map((campaign: any, index: number) => {
                  const stats = campaignStats(campaign, state);
                  const bars = [
                    ["sent", stats.sent, "Convites"],
                    ["opened", stats.opened, "Aberturas"],
                    ["purchased", stats.purchased, "Compras"],
                    ["arrived", stats.arrived, "Chegadas"],
                  ];
                  return (
                    <div className="campaign-bar-group" key={campaign.id}>
                      <div className="campaign-bars">
                        {bars.map(([kind, value, label]: any) => (
                          <span
                            key={kind}
                            className={`campaign-bar ${kind}`}
                            style={{ height: `${Math.max(5, (value / peak) * 100)}%` }}
                            title={`${label}: ${value}`}
                          />
                        ))}
                      </div>
                      <small>C{campaigns.length - history.length + index + 1}</small>
                    </div>
                  );
                })}
              </div>
              <div className="chart-legend" aria-label="Legenda do gráfico">
                <span><i className="sent" />Convites</span>
                <span><i className="opened" />Aberturas</span>
                <span><i className="purchased" />Compras</span>
                <span><i className="arrived" />Chegadas</span>
              </div>
            </figure>
            {last && (
              <div className="campaign-reading">
                <b>{last.action === "send" ? "Última campanha enviada" : "Última campanha pausada"}</b>
                <span>{last.reason || "Sem justificativa registrada."}</span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
