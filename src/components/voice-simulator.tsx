import { useState } from "react";
import { Mic, Sparkles, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const prompts = [
  { id: "offer", text: "Qual oferta eu tenho hoje?" },
  { id: "menu", text: "O que combina com o meu gosto?" },
  { id: "arrival", text: "Quanto tempo eu tenho para chegar?" },
];

function responseFor(prompt: string, state: any, customer: any, highlights: any[]) {
  const name = customer?.name?.replace(" (demo)", "") || "cliente";
  if (prompt === "offer")
    return state.discount && state.available
      ? `Sim, ${name}. Há ${state.discount}% OFF e ${state.available} cupons disponíveis neste lote. O valor e as condições aparecem antes da confirmação.`
      : "Agora o restaurante não está com novos cupons disponíveis. Posso avisar quando surgir uma nova oportunidade.";
  if (prompt === "menu") {
    const item = highlights[0];
    return item
      ? `${name}, o assistente destacou ${item.name}: ${item.reason}`
      : `${name}, você costuma preferir ${customer?.preference || "opções do restaurante"}. Assim que o assistente consultar o cardápio, posso indicar uma opção adequada.`;
  }
  return "Depois de confirmar o cupom, você tem até 30 minutos para chegar. O desconto fica reservado para esse período.";
}

export function VoiceSimulator({
  state,
  customer,
  menuHighlights,
}: {
  state: any;
  customer: any;
  menuHighlights: any[];
}) {
  const [selected, setSelected] = useState("offer");
  const [listening, setListening] = useState(false);
  const [turn, setTurn] = useState<any>(null);
  const prompt = prompts.find((item) => item.id === selected) || prompts[0];

  const simulateVoice = () => {
    if (listening) return;
    setListening(true);
    setTurn(null);
    window.setTimeout(() => {
      setTurn({
        question: prompt.text,
        answer: responseFor(prompt.id, state, customer, menuHighlights),
      });
      setListening(false);
    }, 650);
  };

  return (
    <Card className="voice-card">
      <CardContent>
        <div className="panel-title">
          <div>
            <h2><Volume2 size={17} /> Conversa por voz</h2>
            <p>Teste a interação pelo ponto de vista do cliente.</p>
          </div>
          <Badge variant="outline">Simulador local</Badge>
        </div>
        <div className="voice-stage">
          <button
            className={`voice-orb ${listening ? "listening" : ""}`}
            onClick={simulateVoice}
            aria-label={listening ? "Ouvindo cliente" : "Simular fala do cliente"}
            disabled={listening}
          >
            <Mic size={23} />
          </button>
          <div>
            <b>{listening ? "Ouvindo o cliente…" : "Pronto para ouvir"}</b>
            <p>{listening ? "Interpretando a fala simulada" : "Escolha uma intenção e simule a fala."}</p>
          </div>
        </div>
        <div className="voice-prompts" aria-label="Intenções do cliente">
          {prompts.map((item) => (
            <button
              key={item.id}
              className={selected === item.id ? "active" : ""}
              onClick={() => setSelected(item.id)}
              disabled={listening}
            >
              {item.text}
            </button>
          ))}
        </div>
        {turn ? (
          <div className="voice-turn" aria-live="polite">
            <div className="voice-transcript">
              <span>CLIENTE</span>
              <p>“{turn.question}”</p>
            </div>
            <div className="voice-answer">
              <span><Sparkles size={12} /> ASSISTENTE</span>
              <p>{turn.answer}</p>
            </div>
          </div>
        ) : (
          <p className="voice-hint">A simulação não grava áudio nem aciona o microfone do navegador.</p>
        )}
        <Button className="voice-run" variant="outline" onClick={simulateVoice} disabled={listening}>
          <Mic size={15} /> {listening ? "Ouvindo…" : "Simular fala do cliente"}
        </Button>
      </CardContent>
    </Card>
  );
}
