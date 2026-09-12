import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Leaf,
  MessageCircle,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Ticket,
  Users,
  Volume2,
} from "lucide-react";
import "../fantastic.css";

type FantasticDemoProps = {
  state: any;
  menuAgent: any;
  menuAgentConfig: any;
  command: (type: string, payload?: any) => Promise<any>;
  startMission: () => Promise<void>;
  runMenuAgent: () => Promise<void>;
  reset: () => Promise<void>;
};

type AutoplayStage =
  | "opening"
  | "signal"
  | "selecting"
  | "invited"
  | "opened"
  | "reserved"
  | "menu-loading"
  | "menu"
  | "voice"
  | "arrival"
  | "result"
  | "paused";

type Presentation = {
  campaignId: string;
  customerIds: string[];
  primaryId: string;
};

type MenuMode = "waiting" | "mock" | "catalog";

const stageCopy: Record<
  AutoplayStage,
  { title: string; copy: string; act: number }
> = {
  opening: {
    title: "A história começa antes do convite.",
    copy: "O salão ainda está cheio. O agente observa, mas não interrompe ninguém.",
    act: 0,
  },
  signal: {
    title: "O almoço mudou de ritmo.",
    copy: "A ocupação caiu. Uma mesa vazia virou um sinal operacional.",
    act: 1,
  },
  selecting: {
    title: "O agente escolhe com contexto.",
    copy: "Ele cruza disponibilidade, distância, consentimento e preferência antes de convidar.",
    act: 1,
  },
  invited: {
    title: "A conversa encontra várias pessoas certas.",
    copy: "Os convites partem juntos, mas cada cliente reage em seu próprio ritmo.",
    act: 2,
  },
  opened: {
    title: "A primeira oportunidade foi aberta.",
    copy: "Enquanto uma cliente avalia a oferta, outras continuam vivendo a mesma campanha.",
    act: 3,
  },
  reserved: {
    title: "Mesas ganharam destino.",
    copy: "Reservas, prazo e estoque são protegidos pelo sistema em cada decisão real.",
    act: 3,
  },
  "menu-loading": {
    title: "O cardápio entra na conversa.",
    copy: "O agente consulta o contexto disponível para deixar a próxima resposta menos genérica.",
    act: 3,
  },
  menu: {
    title: "A recomendação agora tem contexto.",
    copy: "A sugestão usa o cardápio; as regras comerciais continuam determinísticas.",
    act: 3,
  },
  voice: {
    title: "A cliente faz a pergunta mais humana.",
    copy: "A resposta sai da operação e chega ao canal da pessoa que vai almoçar.",
    act: 3,
  },
  arrival: {
    title: "A mensagem vira presença.",
    copy: "O QR fecha uma das jornadas no balcão e devolve evidência para a equipe.",
    act: 4,
  },
  result: {
    title: "Não foi só uma conversa. Foram mesas em movimento.",
    copy: "Agora a equipe vê o caminho completo: convite, abertura, reserva e chegada.",
    act: 4,
  },
  paused: {
    title: "A história está pausada.",
    copy: "Recomece quando quiser; a apresentação continua sem cliques durante a fala.",
    act: 0,
  },
};

const actNames = ["Salão", "Agente", "Clientes", "Resultado"];
const cleanName = (value?: string) => value?.replace(" (demo)", "") || "Cliente";
const storyTiming = {
  opening: 5500,
  signal: 4500,
  selecting: 5500,
  delivery: 5000,
  secondaryReaction: 3200,
  opened: 5200,
  afterFirstReservation: 2200,
  afterSecondReservation: 2300,
  afterThirdReservation: 1000,
  afterFourthReaction: 2000,
  catalogFallback: 2200,
  menu: 5000,
  voice: 6200,
  arrival: 4000,
};

function say(text: string) {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pt-BR";
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
}

function campaignFor(snapshot: any, campaignId?: string) {
  const campaigns = Array.isArray(snapshot?.campaigns) ? snapshot.campaigns : [];
  if (campaignId) return campaigns.find((item: any) => item.id === campaignId);
  return [...campaigns]
    .reverse()
    .find((item: any) => item.action === "send" && item.customerIds?.length);
}

function messageFor(snapshot: any, campaign: any, customerId: string) {
  const messages = Array.isArray(snapshot?.messages) ? snapshot.messages : [];
  const messageIds = new Set(campaign?.messageIds || []);
  return messages.find(
    (item: any) =>
      item.customerId === customerId &&
      (messageIds.size === 0 || messageIds.has(item.id)),
  );
}

function couponFor(snapshot: any, customerId: string) {
  return (snapshot?.coupons || []).find((item: any) => item.customerId === customerId);
}

function guestStatus(message: any, coupon: any) {
  if (coupon?.status === "used") return "arrived";
  if (coupon?.status === "active") return "reserved";
  if (message?.openedAt !== undefined) return "opened";
  if (message) return "delivered";
  return "waiting";
}

const statusCopy: Record<string, string> = {
  waiting: "em seleção",
  delivered: "convite entregue",
  opened: "avaliando agora",
  reserved: "mesa reservada",
  arrived: "chegou ao salão",
};

export function FantasticDemo({
  state,
  menuAgent,
  menuAgentConfig,
  command,
  startMission,
  runMenuAgent,
  reset,
}: FantasticDemoProps) {
  const [stage, setStage] = useState<AutoplayStage>("opening");
  const [isPlaying, setIsPlaying] = useState(true);
  const [presentation, setPresentation] = useState<Presentation | null>(null);
  const [voiceTurn, setVoiceTurn] = useState<string | null>(null);
  const [menuMode, setMenuMode] = useState<MenuMode>("waiting");
  const [issue, setIssue] = useState("");

  const stateRef = useRef(state);
  const commandRef = useRef(command);
  const startMissionRef = useRef(startMission);
  const runMenuAgentRef = useRef(runMenuAgent);
  const resetRef = useRef(reset);
  const menuAgentRef = useRef(menuAgent);
  const menuAgentConfigRef = useRef(menuAgentConfig);
  const runRef = useRef(0);
  const waitsRef = useRef<{ id: number; resolve: (active: boolean) => void }[]>([]);
  const notificationsRef = useRef(new Map<string, any>());
  const couponsRef = useRef(new Map<string, any>());
  const heroRef = useRef<HTMLElement>(null);
  const guestsRef = useRef<HTMLElement>(null);
  const contextRef = useRef<HTMLElement>(null);
  const resultRef = useRef<HTMLElement>(null);

  stateRef.current = state;
  commandRef.current = command;
  startMissionRef.current = startMission;
  runMenuAgentRef.current = runMenuAgent;
  resetRef.current = reset;
  menuAgentRef.current = menuAgent;
  menuAgentConfigRef.current = menuAgentConfig;

  const clearWaits = useCallback(() => {
    const pending = waitsRef.current.splice(0);
    pending.forEach(({ id, resolve }) => {
      window.clearTimeout(id);
      resolve(false);
    });
  }, []);

  const wait = useCallback(
    (milliseconds: number, run: number) =>
      new Promise<boolean>((resolve) => {
        const id = window.setTimeout(() => {
          waitsRef.current = waitsRef.current.filter((item) => item.id !== id);
          resolve(run === runRef.current);
        }, milliseconds);
        waitsRef.current.push({ id, resolve });
      }),
    [],
  );

  const waitFor = useCallback(
    async (predicate: () => boolean, timeout: number, run: number) => {
      const startedAt = Date.now();
      while (run === runRef.current && Date.now() - startedAt < timeout) {
        if (predicate()) return true;
        if (!(await wait(180, run))) return false;
      }
      return predicate() && run === runRef.current;
    },
    [wait],
  );

  const invalidateRun = useCallback(() => {
    runRef.current += 1;
    clearWaits();
    window.speechSynthesis?.cancel();
  }, [clearWaits]);

  const pausePresentation = useCallback(() => {
    invalidateRun();
    setIsPlaying(false);
    setStage("paused");
  }, [invalidateRun]);

  const startPresentation = useCallback(async () => {
    invalidateRun();
    const run = runRef.current;
    notificationsRef.current = new Map();
    couponsRef.current = new Map();
    setIsPlaying(true);
    setStage("opening");
    setPresentation(null);
    setVoiceTurn(null);
    setMenuMode("waiting");
    setIssue("");
    window.scrollTo({ top: 0, behavior: "auto" });

    const active = () => run === runRef.current;
    const pauseForIssue = (message: string) => {
      if (!active()) return;
      setIssue(message);
      setIsPlaying(false);
      setStage("paused");
    };
    const request = async (type: string, payload: any = {}) => {
      for (let attempt = 0; attempt < 4 && active(); attempt += 1) {
        const response = await commandRef.current(type, payload);
        if (!active()) return null;
        if (response) {
          if (response.state) stateRef.current = response.state;
          return response;
        }
        if (!(await wait(280, run))) return null;
      }
      throw new Error("A operação não respondeu a tempo.");
    };
    const openCustomer = async (campaign: any, customerId: string) => {
      const message = messageFor(stateRef.current, campaign, customerId);
      if (!message) throw new Error("O convite da cliente não foi encontrado.");
      const response = await request("open-notification", { messageId: message.id, customerId });
      const notification = response?.notification || messageFor(stateRef.current, campaign, customerId);
      if (!notification?.offerVersion) throw new Error("A oferta não pôde ser aberta.");
      notificationsRef.current.set(customerId, notification);
      return notification;
    };
    const buyCustomer = async (campaign: any, customerId: string) => {
      const notification = notificationsRef.current.get(customerId) || messageFor(stateRef.current, campaign, customerId);
      if (!notification?.offerVersion) throw new Error("A compra exige uma oferta aberta.");
      const response = await request("buy", {
        version: notification.offerVersion,
        messageId: notification.id,
        key: `fantastica-${run}-${customerId}`,
        customerId,
      });
      const coupon = response?.coupon || couponFor(stateRef.current, customerId);
      if (!coupon) throw new Error("A reserva não foi confirmada.");
      couponsRef.current.set(customerId, coupon);
      return coupon;
    };

    try {
      await resetRef.current();
      if (!active()) return;
      let resetReady = await waitFor(
        () => stateRef.current?.occupied === 80 && !(stateRef.current?.campaigns || []).length && !(stateRef.current?.messages || []).length,
        3200,
        run,
      );
      if (!resetReady) {
        await request("reset");
        resetReady = await waitFor(
          () => stateRef.current?.occupied === 80 && !(stateRef.current?.campaigns || []).length,
          2500,
          run,
        );
      }
      if (!resetReady) throw new Error("Não foi possível preparar uma nova apresentação.");
      if (!(await wait(storyTiming.opening, run))) return;

      setStage("signal");
      await startMissionRef.current();
      if (!active()) return;
      const signalReady = await waitFor(() => stateRef.current?.occupied === 23, 3500, run);
      if (!signalReady) throw new Error("O sinal de ocupação não chegou ao salão.");
      if (!(await wait(storyTiming.signal, run))) return;

      setStage("selecting");
      let campaignReady = await waitFor(
        () => Boolean(campaignFor(stateRef.current)?.customerIds?.length),
        9000,
        run,
      );
      if (!campaignReady) {
        await request("occupancy", { value: 22 });
        await request("occupancy", { value: 23 });
        campaignReady = await waitFor(
          () => Boolean(campaignFor(stateRef.current)?.customerIds?.length),
          9000,
          run,
        );
      }
      const campaign = campaignFor(stateRef.current);
      if (!campaignReady || !campaign?.customerIds?.length)
        throw new Error("O agente não conseguiu selecionar clientes nesta execução.");
      if (!(await wait(storyTiming.selecting, run))) return;

      const customerIds = campaign.customerIds.filter((id: unknown) => typeof id === "string");
      const primaryId = customerIds[0];
      if (!primaryId) throw new Error("A campanha não trouxe uma cliente para acompanhar.");
      setPresentation({ campaignId: campaign.id, customerIds, primaryId });
      setStage("invited");
      if (!(await wait(storyTiming.delivery, run))) return;

      const secondaryId = customerIds[1];
      const thirdId = customerIds[2];
      const fourthId = customerIds[3];
      if (secondaryId) await openCustomer(campaign, secondaryId);
      if (!active() || !(await wait(storyTiming.secondaryReaction, run))) return;

      setStage("opened");
      await openCustomer(campaign, primaryId);
      if (!active() || !(await wait(storyTiming.opened, run))) return;

      setStage("reserved");
      await buyCustomer(campaign, primaryId);
      if (!active() || !(await wait(storyTiming.afterFirstReservation, run))) return;
      if (secondaryId) await buyCustomer(campaign, secondaryId);
      if (!active() || !(await wait(storyTiming.afterSecondReservation, run))) return;
      if (thirdId) {
        await openCustomer(campaign, thirdId);
        if (!active() || !(await wait(storyTiming.afterThirdReservation, run))) return;
        await buyCustomer(campaign, thirdId);
      }
      if (!active() || !(await wait(storyTiming.afterFourthReaction, run))) return;
      if (fourthId) await openCustomer(campaign, fourthId);
      if (!active()) return;

      setStage("menu-loading");
      await waitFor(() => menuAgentConfigRef.current !== null, 1600, run);
      if (!active()) return;
      if (menuAgentConfigRef.current?.mock) {
        setMenuMode("mock");
        await runMenuAgentRef.current();
        if (!active()) return;
        await waitFor(
          () => ["completed", "failed", "cancelled"].includes(menuAgentRef.current?.status),
          3500,
          run,
        );
      } else {
        setMenuMode("catalog");
        if (!(await wait(storyTiming.catalogFallback, run))) return;
      }

      setStage("menu");
      if (!(await wait(storyTiming.menu, run))) return;
      const currentCustomer = stateRef.current?.customers?.find((item: any) => item.id === primaryId);
      const highlight = menuAgentRef.current?.campaign?.menu_highlights?.[0];
      const answer = highlight
        ? `${cleanName(currentCustomer?.name)}, o agente destacou ${highlight.name}: ${highlight.reason}`
        : `${cleanName(currentCustomer?.name)}, o agente encontrou opções do cardápio para continuar essa conversa com contexto.`;
      setVoiceTurn(answer);
      setStage("voice");
      say(answer);
      if (!(await wait(storyTiming.voice, run))) return;

      setStage("arrival");
      const primaryCoupon = couponsRef.current.get(primaryId) || couponFor(stateRef.current, primaryId);
      if (!primaryCoupon?.token) throw new Error("Não foi possível localizar o QR da reserva principal.");
      await request("validate", { token: primaryCoupon.token });
      const arrived = await waitFor(() => couponFor(stateRef.current, primaryId)?.status === "used", 2600, run);
      if (!arrived) throw new Error("A chegada não foi confirmada no salão.");
      if (!(await wait(storyTiming.arrival, run))) return;

      setStage("result");
      setIsPlaying(false);
    } catch (error: any) {
      pauseForIssue(error?.message || "A apresentação foi interrompida.");
    }
  }, [invalidateRun, wait, waitFor]);

  useEffect(() => {
    void startPresentation();
    return () => invalidateRun();
  }, [invalidateRun, startPresentation]);

  useEffect(() => {
    if (stage === "paused") return;
    const target = ["opening", "signal", "selecting"].includes(stage)
      ? heroRef.current
      : ["invited", "opened", "reserved"].includes(stage)
        ? guestsRef.current
        : ["menu-loading", "menu", "voice"].includes(stage)
          ? contextRef.current
          : resultRef.current;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    target?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
  }, [stage]);

  const campaign = presentation ? campaignFor(state, presentation.campaignId) : null;
  const customerIds = presentation?.customerIds || [];
  const primaryId = presentation?.primaryId || customerIds[0];
  const primaryCustomer = state.customers?.find((item: any) => item.id === primaryId);
  const primaryMessage = primaryId ? messageFor(state, campaign, primaryId) : null;
  const primaryCoupon = primaryId ? couponFor(state, primaryId) : null;
  const primaryName = cleanName(primaryCustomer?.name);
  const hasMenuContext = menuMode === "mock" && Boolean(menuAgent?.campaign?.menu_highlights?.length);
  const guests = customerIds.map((customerId) => {
    const customer = state.customers?.find((item: any) => item.id === customerId);
    const message = messageFor(state, campaign, customerId);
    const coupon = couponFor(state, customerId);
    return { id: customerId, customer, message, coupon, status: guestStatus(message, coupon), primary: customerId === primaryId };
  });

  const metrics = useMemo(() => {
    const recipients = new Set(customerIds);
    const campaignMessages = new Set(campaign?.messageIds || []);
    const sent = recipients.size;
    const opened = (state.messages || []).filter(
      (item: any) => recipients.has(item.customerId) && (campaignMessages.size === 0 || campaignMessages.has(item.id)) && item.openedAt !== undefined,
    ).length;
    const bought = (state.coupons || []).filter((item: any) => recipients.has(item.customerId)).length;
    const checkedIn = (state.coupons || []).filter((item: any) => recipients.has(item.customerId) && item.status === "used").length;
    return { sent, opened, bought, checkedIn };
  }, [campaign?.messageIds, customerIds, state.coupons, state.messages]);

  const demand = Math.min(100, Math.max(0, state.effective));
  const conversion = metrics.sent ? Math.round((metrics.checkedIn / metrics.sent) * 100) : 0;
  const action = isPlaying
    ? { label: "Pausar a história", detail: "O piloto continua sozinho; pause apenas se quiser comentar uma cena.", Icon: Pause, onClick: pausePresentation }
    : { label: stage === "result" ? "Recomeçar a história" : "Retomar do início", detail: issue || "Prepare uma nova sessão e deixe o agente contar o fluxo novamente.", Icon: stage === "result" ? RotateCcw : Play, onClick: () => void startPresentation() };
  const currentAct = stageCopy[stage].act;

  return (
    <main className={`fantastic-demo scene-${stage} ${isPlaying ? "is-playing" : ""}`}>
      <header className="fantastic-nav">
        <a href="/" className="fantastic-back"><ArrowLeft size={16} /> Cockpit operacional</a>
        <span className="fantastic-live"><i /> PILOTO DE APRESENTAÇÃO</span>
      </header>

      <section className="fantastic-director" aria-live="polite">
        <div>
          <span>APRESENTAÇÃO AUTÔNOMA · {currentAct ? `ATO ${currentAct}` : "PRÓLOGO"}</span>
          <b>{stageCopy[stage].title}</b>
          <p>{issue || stageCopy[stage].copy}</p>
        </div>
        <div className="fantastic-director-progress" aria-label="Progresso da história">
          {actNames.map((name, index) => {
            const number = index + 1;
            return <span className={number < currentAct ? "done" : number === currentAct ? "current" : ""} key={name}>
              <i>{number < currentAct ? <Check size={11} /> : String(number).padStart(2, "0")}</i>{name}
            </span>;
          })}
        </div>
      </section>

      <section className="fantastic-hero" ref={heroRef}>
        <div className="fantastic-intro">
          <span className="fantastic-kicker"><Moon size={14} /> BRAZILNUTS · DEMO FANTÁSTICA</span>
          <h1>Quando o salão respira, a cidade recebe um sinal.</h1>
          <p>A apresentação se move sozinha: o agente percebe a operação, cria uma campanha e acompanha várias pessoas até a evidência no salão.</p>
          <button type="button" className="fantastic-primary" onClick={action.onClick}>
            <action.Icon size={18} /><span><b>{action.label}</b><small>{action.detail}</small></span>
          </button>
        </div>

        <div className="fantastic-orbit-wrap">
          <div className="fantastic-orbit" aria-label="Pulso do salão">
            <div className="fantastic-orbit-ring ring-one" /><div className="fantastic-orbit-ring ring-two" />
            <div className="fantastic-core"><Leaf size={34} /><b>{state.discount ? `${state.discount}%` : "—"}</b><small>o chamado</small></div>
            <div className="fantastic-orbit-caption"><span>{state.occupied} mesas ocupadas</span><span>{state.available} convites vivos</span></div>
            <div className={`fantastic-fireflies ${campaign ? "awake" : ""}`} aria-hidden="true">{Array.from({ length: 12 }).map((_, index) => <i key={index} />)}</div>
          </div>
          <div className="fantastic-floor" aria-label="Mini mapa vivo do salão">
            {Array.from({ length: 24 }).map((_, index) => {
              const table = index + 17;
              const active = Boolean(state.tables?.[table - 1]);
              const arrival = primaryCoupon?.table === table;
              return <i className={`${active ? "active" : ""} ${arrival ? "arrival" : ""}`} key={table} />;
            })}
            <span><i /> mesa que volta a acender</span>
          </div>
        </div>
      </section>

      <section className="fantastic-story-grid" aria-label="Narrativa da demonstração">
        <article className="fantastic-panel fantastic-story-panel">
          <div className="fantastic-panel-title"><span>O RITUAL EM QUATRO BATIDAS</span><b>{stage === "result" ? "Ciclo completo" : "A história está em movimento"}</b></div>
          <div className="fantastic-beats">
            {[
              ["01", "O salão sinaliza", "A demanda abre espaço.", currentAct > 1, currentAct === 1],
              ["02", "O agente escolhe", "Convites para quem pode chegar.", currentAct > 2, currentAct === 2],
              ["03", "Clientes respondem", "Várias jornadas ao mesmo tempo.", currentAct > 3, currentAct === 3],
              ["04", "A operação aprende", "Chegada vira evidência.", stage === "result", currentAct === 4 && stage !== "result"],
            ].map(([number, title, description, complete, current]: any) => <div className={`fantastic-beat ${complete ? "complete" : ""} ${current ? "current" : ""}`} key={number}><span>{complete ? <Check size={14} /> : number}</span><div><b>{title}</b><small>{description}</small></div></div>)}
          </div>
        </article>

        <article className="fantastic-panel fantastic-guest-panel">
          <div className="fantastic-guest-head"><span className="fantastic-avatar">{primaryName[0]}</span><div><span>JORNADA PRINCIPAL</span><b>{primaryName}</b><small>{primaryCustomer?.preference || "Preferência em leitura"} · {primaryCustomer?.minutesAway || 0} min</small></div><MessageCircle size={18} /></div>
          <div className="fantastic-reasons" aria-label="Por que esta cliente foi escolhida"><span>{primaryCustomer?.consent ? "consentimento ativo" : "consentimento em análise"}</span><span>{primaryCustomer?.minutesAway || 0} min de distância</span><span>{primaryCoupon ? "reserva protegida" : "sem cupom pendente"}</span></div>
          <div className="fantastic-message" aria-live="polite">
            {!campaign && "O agente ainda está ouvindo o ritmo do salão."}
            {campaign && primaryMessage?.openedAt === undefined && "Um convite chegou ao celular: uma mesa está esperando."}
            {primaryMessage?.openedAt !== undefined && !primaryCoupon && "A oportunidade foi aberta. A mesa está esperando uma decisão."}
            {primaryCoupon?.status === "active" && "A reserva foi selada. A conversa agora ganha contexto de cardápio."}
            {primaryCoupon?.status === "used" && `${primaryName} chegou. A história voltou para o salão como resultado.`}
          </div>
          <div className="fantastic-guest-meta"><span><Send size={13} /> {campaign ? "convite entregue" : "em seleção"}</span><span><Ticket size={13} /> {primaryCoupon ? `${primaryCoupon.discount}% preservado` : "sem reserva"}</span></div>
        </article>
      </section>

      <section className="fantastic-live-guests" ref={guestsRef} aria-label="Clientes em atividade na campanha">
        <div className="fantastic-live-guests-head"><div><span><Users size={14} /> UMA CAMPANHA, VÁRIAS HISTÓRIAS</span><b>{customerIds.length ? `${customerIds.length} clientes em movimento` : "A seleção vai aparecer aqui"}</b></div><small>As cards vêm da mesma campanha e das ações reais da simulação.</small></div>
        <div className="fantastic-guest-stream">
          {(guests.length ? guests : Array.from({ length: 5 }).map((_, index) => ({ id: `ghost-${index}`, status: "waiting", primary: false }))).map((guest: any, index) => {
            const guestName = cleanName(guest.customer?.name || `Cliente ${index + 1}`);
            return <article className={`fantastic-guest-tile status-${guest.status} ${guest.primary ? "primary" : ""}`} key={guest.id}>
              <div className="fantastic-guest-tile-top"><span>{guestName[0]}</span><i>{guest.primary ? "história principal" : `onda ${String(index + 1).padStart(2, "0")}`}</i></div>
              <b>{guestName}</b><small>{guest.customer?.preference || "perfil elegível"}</small><strong><em /> {statusCopy[guest.status]}</strong>
              <div className="fantastic-guest-route" aria-hidden="true"><i className="on" /><i className={guest.status !== "delivered" && guest.status !== "waiting" ? "on" : ""} /><i className={guest.status === "reserved" || guest.status === "arrived" ? "on" : ""} /><i className={guest.status === "arrived" ? "on" : ""} /></div>
            </article>;
          })}
        </div>
      </section>

      <section className="fantastic-constellation" ref={contextRef} aria-label="Contexto, voz e resultado">
        <article className="fantastic-panel fantastic-menu-panel">
          <div className="fantastic-panel-title"><span>O ORÁCULO DO CARDÁPIO</span><b>{hasMenuContext ? "Contexto encontrado" : menuMode === "catalog" ? "Contexto local disponível" : "Aguardando um motivo para falar"}</b></div>
          {hasMenuContext ? <><p className="fantastic-menu-copy">{menuAgent.campaign.whatsapp_message}</p><div className="fantastic-menu-tags">{menuAgent.campaign.menu_highlights.map((item: any) => <span key={`${item.category}-${item.name}`}>{item.name}</span>)}</div></> : <p className="fantastic-placeholder">{menuMode === "catalog" ? "A apresentação segue com contexto local de catálogo para não depender de uma chamada externa. No modo mock, a Exa entra automaticamente nesta mesma cena." : "O cardápio entra depois da reserva: ele deixa a próxima conversa mais útil, sem mexer em preço, estoque ou prazo."}</p>}
        </article>

        <article className="fantastic-panel fantastic-voice-panel">
          <div className="fantastic-panel-title"><span>O SUSSURRO DA CLIENTE</span><b>{voiceTurn ? "O agente respondeu" : "Uma pergunta pode mudar a chegada"}</b></div>
          <div className="fantastic-voice-question"><Volume2 size={17} /> “O que combina com o meu gosto?”</div>
          <p className={voiceTurn ? "fantastic-voice-answer ready" : "fantastic-voice-answer"}>{voiceTurn || "A transcrição entra sozinha quando a história chega à conversa da cliente."}</p>
        </article>

        <article className="fantastic-panel fantastic-proof-panel">
          <div className="fantastic-panel-title"><span>PROVA, NÃO PROMESSA</span><b>O que voltou para a operação</b></div>
          <div className="fantastic-proof-numbers">{[[metrics.sent, "enviados"], [metrics.opened, "abertos"], [metrics.bought, "reservas"], [metrics.checkedIn, "chegadas"]].map(([value, label]) => <div key={label}><b>{value}</b><span>{label}</span></div>)}</div>
          <div className="fantastic-demand-meter" aria-label={`${demand}% de demanda`}><span style={{ width: `${demand}%` }} /></div><small>{demand}% de demanda percebida no salão</small>
        </article>
      </section>

      <section className={`fantastic-epilogue ${stage === "result" ? "show" : ""}`} ref={resultRef} aria-live="polite">
        <div className="fantastic-epilogue-copy"><span><Sparkles size={15} /> RESULTADO QUE A EQUIPE CONSEGUE VER</span><h2>O sinal do salão virou uma mesa ocupada.</h2><p>{primaryCoupon?.table ? `${primaryName} chegou à mesa ${primaryCoupon.table}. Enquanto isso, outras pessoas ficaram com convite, resposta ou reserva em andamento.` : "A campanha está organizando convites, respostas e reservas em paralelo."}</p></div>
        <div className="fantastic-result-funnel" aria-label="Funil da campanha">{[[metrics.sent, "convites"], [metrics.opened, "aberturas"], [metrics.bought, "reservas"], [metrics.checkedIn, "chegada"]].map(([value, label], index) => <div key={label} style={{ "--funnel-step": index } as React.CSSProperties}><b>{value}</b><span>{label}</span></div>)}</div>
        <div className="fantastic-result-score"><b>{conversion}%</b><span>conversão convite → chegada</span></div>
      </section>

      <footer className="fantastic-footer"><span>Agente autônomo com limites comerciais determinísticos.</span><span>WhatsApp, pagamento e chegada são simulados.</span></footer>
    </main>
  );
}
