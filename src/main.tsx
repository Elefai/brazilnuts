import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard,
  Utensils,
  Ticket,
  Sparkles,
  ArrowUpRight,
  Users,
  Clock,
  RotateCcw,
  Plus,
  Minus,
  Check,
  QrCode,
  MessageCircle,
  Leaf,
  Radio,
  LoaderCircle,
  RefreshCw,
  BarChart3,
  Play,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import "./index.css";
import { CampaignPanel } from "./components/campaign-panel";
import { CampaignInsights } from "./components/campaign-insights";
import { VoiceSimulator } from "./components/voice-simulator";

const time = (n: number) =>
  new Date(n).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
function App() {
  const [s, setS] = useState<any>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [selected, setSelected] = useState<string | null>(null),
    [token, setToken] = useState(""),
    [tab, setTab] = useState("Visão geral");
  const [draft, setDraft] = useState<number | null>(null),
    [quote, setQuote] = useState<any>(null);
  const [customerId, setCustomerId] = useState("demo-1"),
    [agentConfig, setAgentConfig] = useState<any>(null),
    [agent, setAgent] = useState<any>({ status: "idle" });
  const busyRef = useRef(false),
    keyRef = useRef(crypto.randomUUID()),
    agentPollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const r = await fetch("/api/state");
        if (!r.ok) throw Error();
        const data = await r.json();
        if (active && !busyRef.current) setS(data);
      } catch {
        if (active) setError("Não foi possível conectar ao servidor.");
      }
    };
    poll();
    const id = setInterval(poll, 750);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);
  useEffect(() => {
    let active = true;
    fetch("/api/agent/config")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data) => active && setAgentConfig(data))
      .catch(() => active && setAgentConfig({ ready: false, missing: [] }));
    return () => {
      active = false;
      if (agentPollRef.current) clearTimeout(agentPollRef.current);
    };
  }, []);
  const command = async (type: string, p: any = {}) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const r = await fetch("/api/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ...p }),
      });
      const data = await r.json();
      if (!r.ok) throw Error(data.error);
      setS(data.state);
      setError("");
      return data;
    } catch (e: any) {
      setError(e.message);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  if (!s) return <div className="loading">Carregando o salão… {error}</div>;
  const coupon = s.coupons.find(
      (c: any) => c.id === selected || c.customerId === customerId,
    ),
    shown = draft ?? s.occupied;
  const customer = s.customers.find((c: any) => c.id === customerId);
  const message = s.messages.find((m: any) => m.customerId === customerId);
  const seconds = message?.acceptBy
    ? Math.max(0, Math.ceil((message.acceptBy - s.now) / 1000))
    : 30;
  const buy = async () => {
    const r = await command("buy", {
      version: message.offerVersion,
      messageId: message.id,
      key: keyRef.current,
      customerId,
    });
    if (r) {
      setSelected(r.coupon.id);
      setQuote(null);
    } else setQuote(null);
  };
  const next = () => {
    setSelected(null);
    setQuote(null);
    keyRef.current = crypto.randomUUID();
    const eligible = s.customers?.find(
      (c: any) =>
        c.id !== customerId &&
        !s.coupons.some((p: any) => p.customerId === c.id),
    );
    if (eligible) setCustomerId(eligible.id);
  };
  const jump = (label: string, id: string) => {
    setTab(label);
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const pollCampaign = async (runId: string, attempt = 0) => {
    try {
      const response = await fetch(`/api/agent/runs/${runId}`);
      const data = await response.json();
      if (!response.ok) throw Error(data.error || "Não foi possível consultar o agente.");
      if (data.terminal) {
        setAgent({
          status: data.status,
          campaign: data.campaign,
          sources: data.sources || [],
          catalog: data.catalog,
          cost: data.cost_dollars,
          error: data.error,
        });
        return;
      }
      if (attempt >= 40)
        throw Error("O agente ainda está processando. Tente novamente em instantes.");
      setAgent({ status: "running", catalog: data.catalog });
      agentPollRef.current = setTimeout(() => pollCampaign(runId, attempt + 1), 1500);
    } catch (e: any) {
      setAgent({ status: "failed", error: e.message });
    }
  };
  const runCampaign = async () => {
    if (!agentConfig?.ready || agent.status === "starting" || agent.status === "running")
      return;
    setAgent({ status: "starting" });
    try {
      const response = await fetch("/api/agent/campaign", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw Error(data.error || "Não foi possível iniciar o agente.");
      setAgent({ status: "running", catalog: data.catalog });
      await pollCampaign(data.run_id);
    } catch (e: any) {
      setAgent({ status: "failed", error: e.message });
    }
  };
  const startDemo = async () => {
    if (!s.agent?.autoEnabled) await command("agent-auto", { enabled: true });
    await command("occupancy", { value: 23 });
  };
  return (
    <SidebarProvider>
      <Sidebar variant="inset">
        <SidebarHeader className="p-5">
          <div className="logo">
            <div>
              <Leaf size={20} />
            </div>
            brazilnuts<span>®</span>
          </div>
          <div className="restaurant">
            <span className="restaurant-icon">
              <Utensils size={18} />
            </span>
            <div>
              <b>Restaurante Lab</b>
              <small>São Paulo, Brasil</small>
            </div>
            <Badge variant="outline">DEMO</Badge>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>WORKSPACE</SidebarGroupLabel>
            <SidebarMenu>
              {[
                [LayoutDashboard, "Visão geral", "overview"],
                [Utensils, "Comandas", "floor"],
                [Ticket, "Cupons e clientes", "reception"],
                [Sparkles, "Assistente", "agent"],
                [BarChart3, "Resultados", "results"],
              ].map(([Icon, label, id]: any) => (
                <SidebarMenuItem key={label}>
                  <SidebarMenuButton
                    isActive={tab === label}
                    onClick={() => jump(label, id)}
                  >
                    <Icon />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
          <div className="sidebar-note">
            <Radio size={20} />
            <b>
              Um salão vivo.
              <br />
              Ofertas no ritmo certo.
            </b>
            <p>Simule o movimento e acompanhe cada cupom até a chegada.</p>
          </div>
        </SidebarContent>
        <SidebarFooter className="p-5">
          <div className="profile">
            <span>BN</span>
            <div>
              <b>BrazilNuts Team</b>
              <small>Hackathon · AI Tinkerers</small>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="topbar">
          <div>
            <SidebarTrigger />
            <span className="divider" />
            <span>Workspace</span>
            <span>/</span>
            <b>Visão geral</b>
          </div>
          <Badge variant="outline" className="live-badge">
            <i /> Simulação ao vivo
          </Badge>
        </header>
        <main id="overview" className="workspace">
          <div className="page-heading">
            <div>
              <p className="eyebrow">DO MOVIMENTO À OPORTUNIDADE</p>
              <h1>Seu salão. No ritmo certo.</h1>
              <p>Transforme mesas disponíveis em motivos para chegar.</p>
            </div>
            <div className="time-controls">
              <span>
                <Clock size={14} />
                {time(s.now)} <small>relógio da demo</small>
              </span>
              <div>
                <Button
                  size="sm"
                  className="demo-start"
                  disabled={busy}
                  onClick={startDemo}
                >
                  <Play size={13} /> Iniciar missão
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => command("advance", { minutes: 5 })}
                >
                  +5 min
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => command("advance", { minutes: 30 })}
                >
                  +30 min
                </Button>
                <Button
                  aria-label="Reiniciar demonstração"
                  size="icon"
                  variant="outline"
                  disabled={busy}
                  onClick={async () => {
                    await command("reset");
                    next();
                    setDraft(null);
                  }}
                >
                  <RotateCcw size={15} />
                </Button>
              </div>
            </div>
          </div>
          <div className="metrics">
            {[
              [Utensils, "Mesas ocupadas", s.occupied, "de 100 mesas no salão"],
              [
                Users,
                "Clientes a caminho",
                s.reserved,
                "mesas reservadas por cupons",
              ],
              [Ticket, "Cupons disponíveis", s.available, "no lote atual"],
              [
                ArrowUpRight,
                "Desconto atual",
                s.discount ? `${s.discount}%` : "Pausado",
                s.discount ? "para novas compras" : "ocupação acima do limite",
              ],
            ].map(([Icon, label, value, sub]: any, i) => (
              <Card
                key={label}
                className={i === 3 ? "metric accent" : "metric"}
              >
                <CardContent>
                  <div>
                    <span>{label}</span>
                    <Icon size={17} />
                  </div>
                  <strong>{value}</strong>
                  <small>{sub}</small>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="main-grid">
            <div className="left-col">
              <Card id="floor" className="floor-card">
                <CardContent>
                  <div className="panel-title">
                    <div>
                      <h2>Gestão do salão</h2>
                      <p>Toque em uma mesa para abrir ou fechar a comanda.</p>
                    </div>
                    <Badge variant="secondary">100 mesas</Badge>
                  </div>
                  <div className="floor-legend">
                    <span>
                      <i className="occupied-dot" />
                      Ocupada
                    </span>
                    <span>
                      <i />
                      Livre
                    </span>
                    <span className="ml-auto">
                      {s.free} disponíveis · {s.reserved} reservadas
                    </span>
                  </div>
                  <div className="table-grid">
                    {s.tables.map((occupied: boolean, i: number) => (
                      <button
                        key={i}
                        disabled={busy}
                        className={`table-cell ${occupied ? "occupied" : ""}`}
                        aria-label={`Mesa ${i + 1}, ${occupied ? "ocupada" : "livre"}`}
                        onClick={() => command("table", { index: i })}
                      >
                        <span>{String(i + 1).padStart(2, "0")}</span>
                      </button>
                    ))}
                  </div>
                  <div className="floor-caption">
                    <span />
                    ENTRADA DO SALÃO
                    <span />
                  </div>
                  <div className="sim-controls">
                    <div>
                      <h3>Simular movimento</h3>
                      <small>Controle a ocupação para testar as ofertas.</small>
                    </div>
                    <div className="presets">
                      {[
                        [20, "Vazio"],
                        [40, "Baixo"],
                        [60, "Moderado"],
                        [80, "Cheio"],
                      ].map(([n, label]) => (
                        <Button
                          key={n}
                          size="sm"
                          variant={s.occupied === n ? "default" : "outline"}
                          disabled={busy}
                          onClick={() => {
                            setDraft(null);
                            command("occupancy", { value: n });
                          }}
                        >
                          {label} <span className="opacity-60">{n}</span>
                        </Button>
                      ))}
                    </div>
                    <div className="range-row">
                      <Button
                        size="icon"
                        variant="outline"
                        aria-label="Menos uma mesa"
                        disabled={busy || s.occupied === 0}
                        onClick={() =>
                          command("occupancy", { value: s.occupied - 1 })
                        }
                      >
                        <Minus />
                      </Button>
                      <Slider
                        aria-label="Mesas ocupadas"
                        value={[shown]}
                        max={100 - s.reserved}
                        step={1}
                        onValueChange={(v) => setDraft(v[0])}
                        onValueCommit={(v) => {
                          setDraft(null);
                          command("occupancy", { value: v[0] });
                        }}
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        aria-label="Mais uma mesa"
                        disabled={busy || s.free === 0}
                        onClick={() =>
                          command("occupancy", { value: s.occupied + 1 })
                        }
                      >
                        <Plus />
                      </Button>
                      <Input
                        aria-label="Ocupação exata"
                        className="exact"
                        type="number"
                        min="0"
                        max={100 - s.reserved}
                        value={shown}
                        onChange={(e) => setDraft(Number(e.target.value))}
                        onBlur={() => {
                          if (draft !== null) {
                            command("occupancy", { value: draft });
                            setDraft(null);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.currentTarget.blur();
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="dynamic-card">
                <CardContent>
                  <div className="panel-title">
                    <div>
                      <h2>
                        <Sparkles size={17} /> Oferta dinâmica
                      </h2>
                      <p>
                        Ocupação + reservas = <b>{s.effective}% de demanda</b>
                      </p>
                    </div>
                    <Button
                      disabled={busy || s.available > 0 || !s.discount}
                      onClick={() => command("batch")}
                    >
                      Liberar lote de 5 <ArrowUpRight size={15} />
                    </Button>
                  </div>
                  <div className="tier-grid">
                    {[
                      [50, "Menos de 25%"],
                      [35, "25% a 49%"],
                      [20, "50% a 74%"],
                      [0, "75% ou mais"],
                    ].map(([d, label]) => (
                      <div key={d} className={s.discount === d ? "active" : ""}>
                        <span>{label}</span>
                        <b>{d ? `${d}% OFF` : "Pausado"}</b>
                        {s.discount === d && <small>FAIXA ATUAL</small>}
                      </div>
                    ))}
                  </div>
                  <small>
                    O desconto é garantido na compra. Cada cupom reserva uma
                    mesa por 30 minutos.
                  </small>
                </CardContent>
              </Card>
            </div>
            <Card className="client-card">
              <CardContent>
                <div className="panel-title">
                  <div>
                    <h2>Do outro lado da oferta</h2>
                    <p>A experiência de quem vai chegar.</p>
                  </div>
                  <MessageCircle size={19} />
                </div>
                <div className="phone">
                  <select
                    className="customer-select"
                    aria-label="Cliente demonstrativo"
                    value={customerId}
                    onChange={(e) => {
                      setCustomerId(e.target.value);
                      setSelected(null);
                      setQuote(null);
                      keyRef.current = crypto.randomUUID();
                    }}
                  >
                    {s.customers?.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <div className="phone-status">
                    <b>{time(s.now)}</b>
                    <span>●●● ▰</span>
                  </div>
                  <div className="chat-head">
                    <span className="chat-avatar">
                      <Leaf size={21} />
                    </span>
                    <div>
                      <b>BrazilNuts</b>
                      <small>WhatsApp · simulado</small>
                    </div>
                    <span>⋮</span>
                  </div>
                  <div className="chat-body">
                    <span className="today">HOJE</span>
                    {!coupon && message && message.openedAt === undefined && (
                      <button
                        key={message.id}
                        className="incoming-notification"
                        onClick={async () => {
                          const r = await command("open-notification", {
                            messageId: message.id,
                            customerId,
                          });
                          if (r)
                            setQuote({
                              version: r.notification.offerVersion,
                              discount: r.notification.offerDiscount,
                            });
                        }}
                      >
                        <MessageCircle size={20} />
                        <span>
                          <b>Nova oferta · BrazilNuts</b>
                          <small>
                            {message.discount}% OFF esperando por você
                          </small>
                          <strong>Toque para abrir →</strong>
                        </span>
                      </button>
                    )}
                    {!coupon && !message && (
                      <div className="message">
                        Aguardando uma nova notificação do restaurante.
                      </div>
                    )}
                    {message?.openedAt !== undefined && (
                      <div className="message">{message.text}</div>
                    )}
                    {coupon ? (
                      <div className="ticket">
                        <Badge variant="secondary">
                          {coupon.status === "active"
                            ? "COMPRA CONFIRMADA"
                            : coupon.status === "used"
                              ? "VALIDADO"
                              : "EXPIRADO"}
                        </Badge>
                        <h3>{coupon.discount}% OFF garantidos</h3>
                        <p>{coupon.customer} · R$ 5 simulados</p>
                        <img
                          alt="QR code do cupom"
                          src={`/api/qr?token=${coupon.token}`}
                        />
                        <b>
                          {coupon.status === "active"
                            ? `Chegue em ${Math.max(0, Math.ceil((coupon.expiresAt - s.now) / 60000))} min`
                            : coupon.status === "used"
                              ? `Bem-vindo! Mesa ${coupon.table}`
                              : "Reserva liberada"}
                        </b>
                        <small>Válido até {time(coupon.expiresAt)}</small>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setToken(coupon.token);
                            jump("Cupons e clientes", "reception");
                          }}
                        >
                          Apresentar na recepção
                        </Button>
                      </div>
                    ) : message?.openedAt !== undefined ? (
                      <div className="mobile-offer">
                        <div className="accept-timer" role="timer">
                          {seconds > 0
                            ? `Aceite em ${seconds}s`
                            : "Tempo esgotado"}
                        </div>
                        <span>SEU PRÓXIMO ALMOÇO</span>
                        <h3>
                          {message.offerDiscount
                            ? `${message.offerDiscount}%`
                            : "Até já!"}
                          {message.offerDiscount > 0 && <small>OFF</small>}
                        </h3>
                        <p>
                          {s.available
                            ? `Só ${s.available} cupons disponíveis agora.`
                            : "Nenhum cupom disponível agora."}
                        </p>
                        <div className="offer-details">
                          <p>
                            <Clock size={13} /> Chegue em até 30 minutos
                          </p>
                          <p>
                            <Check size={13} /> R$ 5 viram crédito na conta
                          </p>
                          <p>
                            <Ticket size={13} /> Desconto sobre até R$ 100
                          </p>
                        </div>
                        {quote && (
                          <div className="checkout">
                            Confirmar compra fictícia de R$ 5 com{" "}
                            <b>{quote.discount}% OFF</b>? Oferta sujeita à
                            disponibilidade no momento da confirmação.
                          </div>
                        )}
                        <Button
                          className="buy"
                          disabled={busy || !s.available || seconds === 0}
                          onClick={buy}
                        >
                          {seconds > 0
                            ? "Aceitar e pagar R$ 5 (simulado)"
                            : "Oferta expirada"}{" "}
                          <ArrowUpRight size={15} />
                        </Button>
                        <small className="terms">
                          1 cupom por mesa, em itens elegíveis. Não cumulativo.
                          Expirou: estorno fictício dos R$ 5. Nenhuma cobrança
                          real.
                        </small>
                      </div>
                    ) : (
                      <div className="notification-wait">
                        <Clock size={24} />
                        <p>
                          Você tem 30 segundos para aceitar depois de abrir a
                          notificação.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="home-line" />
                </div>
                <Button
                  variant="outline"
                  className="next-customer"
                  onClick={next}
                >
                  <Plus size={15} /> Simular próximo cliente
                </Button>
              </CardContent>
            </Card>
          </div>
          <section className="outcome-grid" aria-label="Resultados e experiência de voz">
            <CampaignInsights state={s} />
            <VoiceSimulator
              state={s}
              customer={customer}
              menuHighlights={agent?.campaign?.menu_highlights || []}
            />
          </section>
          <div className="secondary-grid">
            <Card id="reception">
              <CardContent>
                <div className="panel-title">
                  <div>
                    <h2>
                      <QrCode size={17} /> Recepção
                    </h2>
                    <p>Valide o cupom e abra a comanda.</p>
                  </div>
                </div>
                <form
                  className="validation"
                  onSubmit={(e) => {
                    e.preventDefault();
                    command("validate", { token });
                  }}
                >
                  <Input
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Código do cupom"
                    aria-label="Código do cupom"
                  />
                  <Button disabled={busy || !token}>Validar</Button>
                </form>
                <div className="coupon-list">
                  {s.coupons.length === 0 ? (
                    <div className="empty">
                      <Ticket />
                      Os cupons comprados aparecerão aqui.
                    </div>
                  ) : (
                    s.coupons.map((c: any) => (
                      <div key={c.id}>
                        <span>
                          <b>
                            {c.customer} · {c.discount}% OFF
                          </b>
                          <small>
                            {c.status === "active"
                              ? `Chega até ${time(c.expiresAt)}`
                              : c.status === "used"
                                ? `Validado · mesa ${c.table}`
                                : "Expirado · estorno fictício"}
                          </small>
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busy || c.status !== "active"}
                          onClick={() =>
                            command("validate", { token: c.token })
                          }
                        >
                          {c.status === "active"
                            ? "Simular QR"
                            : c.status === "used"
                              ? "Utilizado"
                              : "Expirado"}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
            <CampaignPanel
              state={s}
              busy={busy}
              run={() => command("agent")}
              toggleAuto={() =>
                command("agent-auto", { enabled: !s.agent?.autoEnabled })
              }
              select={(id) => {
                setCustomerId(id);
                setSelected(null);
                setQuote(null);
                keyRef.current = crypto.randomUUID();
                document
                  .querySelector(".client-card")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            />
            <Card id="exa-agent" className="agent-card">
              <CardContent>
                <div className="panel-title">
                  <h2>
                    <Sparkles size={17} /> Assistente de cardápio
                  </h2>
                  <Badge variant="outline">
                    {agentConfig?.mock
                      ? "Simulação local"
                      : agentConfig?.ready
                        ? "Exa Agent"
                        : "Configuração pendente"}
                  </Badge>
                </div>
                {agent.status === "completed" && agent.campaign ? (
                  <div className="agent-result" aria-live="polite">
                    <span className="agent-result-label">MENSAGEM SUGERIDA</span>
                    <p className="agent-message">{agent.campaign.whatsapp_message}</p>
                    <p className="agent-note">{agent.campaign.operator_note}</p>
                    {agent.campaign.menu_highlights?.length > 0 && (
                      <div className="agent-highlights">
                        {agent.campaign.menu_highlights.map((item: any) => (
                          <span key={`${item.category}-${item.name}`}>
                            <b>{item.name}</b> · {item.reason}
                          </span>
                        ))}
                      </div>
                    )}
                    {agent.sources?.length > 0 && (
                      <div className="agent-sources">
                        Fontes Exa: {agent.sources.map((source: any, i: number) => (
                          <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                            {i ? ", " : ""}{source.title}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <h3>
                      {!s.discount
                        ? "Hora de cuidar de quem chegou."
                        : s.available
                          ? "Uma boa hora para convidar."
                          : "Vamos preparar o próximo convite."}
                    </h3>
                    <p>
                      O agente usa o cardápio do backend e acompanha{" "}
                      <b>{s.occupied} mesas ocupadas</b> e <b>{s.reserved} clientes a caminho</b>.{" "}
                      {!s.discount
                        ? "A demanda atingiu o limite. Novas ofertas estão pausadas."
                        : s.available
                          ? `A faixa permite ${s.discount}% de desconto. Há ${s.available} cupons disponíveis.`
                          : "Libere um lote para disponibilizar a oferta."}
                    </p>
                  </>
                )}
                {agent.status === "failed" && (
                  <p className="agent-error" role="alert">{agent.error}</p>
                )}
                {!agentConfig?.ready && agentConfig && (
                  <p className="agent-config">
                    Configure {agentConfig.missing?.join(" e ") || "o servidor"} para ativar a Exa.
                  </p>
                )}
                <Button
                  className="agent-run"
                  disabled={!agentConfig?.ready || agent.status === "starting" || agent.status === "running"}
                  onClick={runCampaign}
                >
                  {agent.status === "starting" || agent.status === "running" ? (
                    <><LoaderCircle className="animate-spin" size={16} /> Consultando a Exa</>
                  ) : agent.status === "completed" ? (
                    <><RefreshCw size={16} /> Gerar nova mensagem</>
                  ) : (
                    <><Sparkles size={16} /> {agentConfig?.mock ? "Simular resposta do agente" : "Gerar com agente Exa"}</>
                  )}
                </Button>
                <div className="agent-disclaimer">
                  {agentConfig?.mock
                    ? "Modo mock: não consulta a Exa nem um backend externo."
                    : "O motor preserva desconto, estoque e prazo. A Exa sugere apenas o texto e os itens do cardápio."}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <div className="panel-title">
                  <h2>Atividade ao vivo</h2>
                  <Badge variant="secondary">{s.events.length}</Badge>
                </div>
                <div className="activity">
                  {s.events.slice(0, 10).map((e: any) => (
                    <div key={e.id}>
                      <i />
                      <span>
                        <b>{e.title}</b>
                        <small>{e.detail}</small>
                      </span>
                      <time>{time(e.at)}</time>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <footer>
            BrazilNuts · AI Tinkerers Hackathon
            <span>Dados fictícios. WhatsApp e pagamento simulados.</span>
          </footer>
        </main>
        {error && (
          <div role="alert" className="toast" onClick={() => setError("")}>
            {error}
            <button aria-label="Fechar aviso">×</button>
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
