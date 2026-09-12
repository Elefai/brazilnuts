import {
  BarChart3,
  Check,
  MessageCircle,
  Play,
  QrCode,
  Send,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type DemoJourneyProps = {
  state: any;
  busy: boolean;
  start: () => void;
  showCustomer: (customerId: string) => void;
  showReception: () => void;
  showResults: () => void;
};

type Step = {
  label: string;
  detail: string;
  state: "done" | "active" | "next";
  Icon: LucideIcon;
};

export function DemoJourney({
  state,
  busy,
  start,
  showCustomer,
  showReception,
  showResults,
}: DemoJourneyProps) {
  const campaigns = Array.isArray(state.campaigns) ? state.campaigns : [];
  const campaign = [...campaigns].reverse().find((item: any) =>
    item.action === "send" && item.customerIds?.length,
  );
  const customerId = campaign?.customerIds?.[0] || "demo-1";
  const customer = state.customers?.find((item: any) => item.id === customerId);
  const message = state.messages?.find((item: any) => item.customerId === customerId);
  const coupon = state.coupons?.find((item: any) => item.customerId === customerId);
  const opened = message?.openedAt !== undefined;
  const arrived = coupon?.status === "used";
  const reserved = coupon?.status === "active";
  const agentWorking = Boolean(state.agent?.busy);

  const stage = !campaign ? 0 : !opened ? 1 : !coupon ? 2 : !arrived ? 3 : 4;
  const steps: Step[] = [
    {
      label: "Sinal do salão",
      detail: campaign ? "ocupação virou oportunidade" : "aguardando o gatilho",
      state: stage > 0 ? "done" : "active",
      Icon: Play,
    },
    {
      label: "Convite certo",
      detail: campaign ? `${campaign.customerIds.length} perfis elegíveis` : "público ainda não escolhido",
      state: stage > 1 ? "done" : stage === 1 ? "active" : "next",
      Icon: Send,
    },
    {
      label: "Decisão no celular",
      detail: coupon ? "reserva criada" : opened ? "oferta aberta" : "notificação esperando",
      state: stage > 2 ? "done" : stage === 2 ? "active" : "next",
      Icon: MessageCircle,
    },
    {
      label: "Chegada e resultado",
      detail: arrived ? "funil atualizado" : reserved ? "validar na recepção" : "acompanhar conversão",
      state: stage === 4 ? "done" : stage === 3 ? "active" : "next",
      Icon: stage === 4 ? Check : QrCode,
    },
  ];

  const action: {
    label: string;
    description: string;
    onClick: () => void;
    Icon: LucideIcon;
    disabled?: boolean;
  } = agentWorking
    ? {
        label: "Agente preparando convites",
        description: "O salão mudou; aguarde alguns segundos para o piloto concluir a seleção.",
        onClick: () => {},
        Icon: Send,
        disabled: true,
      }
    : stage === 0
      ? {
          label: "Iniciar missão",
          description: "O piloto observa a queda de ocupação e inicia a campanha sozinho.",
          onClick: start,
          Icon: Play,
        }
      : stage === 1
        ? {
            label: `Abrir convite de ${customer?.name?.replace(" (demo)", "") || "cliente"}`,
            description: "Leve a história para o canal em que o cliente já está.",
            onClick: () => showCustomer(customerId),
            Icon: MessageCircle,
          }
        : stage === 2
          ? {
              label: "Continuar no celular",
              description: "Abra a oferta e confirme o cupom fictício para criar a reserva.",
              onClick: () => showCustomer(customerId),
              Icon: MessageCircle,
            }
          : stage === 3
            ? {
                label: "Validar chegada",
                description: "Feche o ciclo no balcão e veja a conversão mudar.",
                onClick: showReception,
                Icon: QrCode,
              }
            : {
                label: "Ver evolução da campanha",
                description: "Mostre o que aconteceu depois da decisão do agente.",
                onClick: showResults,
                Icon: BarChart3,
              };

  return (
    <Card className="demo-journey" aria-label="Roteiro guiado da demonstração">
      <CardContent>
        <div className="demo-journey-heading">
          <div>
            <span>ROTA GUIADA DA DEMO</span>
            <h2>Do sinal à chegada, sem abrir outro chat.</h2>
            <p>{action.description}</p>
          </div>
          <Button
            className="demo-journey-action"
            disabled={busy || action.disabled}
            onClick={action.onClick}
          >
            <action.Icon size={15} /> {action.label}
          </Button>
        </div>
        <div className="demo-journey-steps">
          {steps.map(({ label, detail, state: stepState, Icon }, index) => (
            <div className={`demo-journey-step ${stepState}`} key={label}>
              <span className="demo-journey-icon">
                {stepState === "done" ? <Check size={13} /> : <Icon size={13} />}
              </span>
              <span>
                <small>{String(index + 1).padStart(2, "0")}</small>
                <b>{label}</b>
                <em>{detail}</em>
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
