import { useEffect, useRef, useState } from "react";
import { Mic, Sparkles, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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

function promptFromTranscript(transcript: string) {
  const normalized = transcript.toLocaleLowerCase("pt-BR");
  if (/(prato|cardápio|cardapio|comer|gosto|indica|recomenda)/.test(normalized))
    return "menu";
  if (/(tempo|chegar|minuto|prazo|quanto falta)/.test(normalized))
    return "arrival";
  return "offer";
}

function speechError(error: string) {
  if (error === "not-allowed" || error === "service-not-allowed")
    return "O navegador bloqueou o microfone. Permita o acesso ao microfone para este endereço e tente novamente.";
  if (error === "no-speech") return "Não detectei fala. Fale mais perto do microfone e tente novamente.";
  if (error === "audio-capture") return "Nenhum microfone foi encontrado neste dispositivo.";
  return "Não foi possível iniciar a escuta. Você ainda pode digitar a fala abaixo.";
}

function speakResponse(text: string) {
  if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window))
    return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "pt-BR";
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
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
  const [simulating, setSimulating] = useState(false);
  const [turn, setTurn] = useState<any>(null);
  const [manualText, setManualText] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const [supportsSpeech, setSupportsSpeech] = useState(false);
  const recognitionRef = useRef<any>(null);
  const simulationTimerRef = useRef<number | null>(null);
  const contextRef = useRef({ state, customer, menuHighlights });
  const processTranscriptRef = useRef<(transcript: string) => void>(() => {});
  const prompt = prompts.find((item) => item.id === selected) || prompts[0];

  contextRef.current = { state, customer, menuHighlights };

  const processTranscript = (transcript: string) => {
    const clean = transcript.trim();
    if (!clean) return;
    const id = promptFromTranscript(clean);
    const context = contextRef.current;
    const answer = responseFor(id, context.state, context.customer, context.menuHighlights);
    setSelected(id);
    setTurn({
      question: clean,
      answer,
    });
    speakResponse(answer);
    setManualText("");
    setVoiceError("");
  };
  processTranscriptRef.current = processTranscript;

  useEffect(() => {
    const speechWindow = window as typeof window & {
      SpeechRecognition?: new () => any;
      webkitSpeechRecognition?: new () => any;
    };
    const SpeechRecognition =
      speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-BR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => {
      setVoiceError("");
      setTurn(null);
      setSimulating(false);
      setListening(true);
    };
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0]?.transcript || "")
        .join(" ");
      processTranscriptRef.current(transcript);
    };
    recognition.onerror = (event: any) => {
      setSimulating(false);
      setListening(false);
      setVoiceError(speechError(event.error));
    };
    recognition.onend = () => {
      setSimulating(false);
      setListening(false);
    };
    recognitionRef.current = recognition;
    setSupportsSpeech(true);
    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.abort();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(
    () => () => {
      if (simulationTimerRef.current !== null)
        window.clearTimeout(simulationTimerRef.current);
      window.speechSynthesis?.cancel();
    },
    [],
  );

  const startListening = () => {
    setVoiceError("");
    if (!recognitionRef.current) {
      setVoiceError("Este navegador não oferece reconhecimento de fala. Use a simulação ou digite sua pergunta.");
      return;
    }
    try {
      recognitionRef.current.start();
    } catch {
      setVoiceError("A escuta já está em andamento. Fale quando o indicador ficar ativo.");
    }
  };

  const simulateVoice = (intent = prompt) => {
    if (listening) return;
    setVoiceError("");
    setSelected(intent.id);
    setSimulating(true);
    setListening(true);
    setTurn(null);
    simulationTimerRef.current = window.setTimeout(() => {
      processTranscriptRef.current(intent.text);
      simulationTimerRef.current = null;
      setSimulating(false);
      setListening(false);
    }, 650);
  };

  const submitManualText = () => {
    if (manualText.trim()) processTranscript(manualText);
  };

  return (
    <Card className="voice-card">
      <CardContent>
        <div className="panel-title">
          <div>
            <h2><Volume2 size={17} /> Conversa por voz</h2>
            <p>Teste a interação pelo ponto de vista do cliente.</p>
          </div>
          <Badge variant="outline">
            {supportsSpeech ? "Microfone disponível" : "Simulador local"}
          </Badge>
        </div>
        <div className="voice-stage">
          <button
            className={`voice-orb ${listening ? "listening" : ""}`}
            onClick={startListening}
            aria-label={listening ? "Ouvindo cliente" : "Falar com o cliente"}
            disabled={listening}
          >
            <Mic size={23} />
          </button>
          <div>
            <b>{listening ? "Ouvindo o cliente…" : "Pronto para ouvir"}</b>
            <p>{listening ? "Fale agora em português" : "Toque no microfone ou escolha uma intenção."}</p>
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
        {voiceError && <p className="voice-error" role="alert">{voiceError}</p>}
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
          <p className="voice-hint">A gravação não é enviada ao backend da demo; o reconhecimento segue a API nativa do navegador.</p>
        )}
        <div className="voice-manual">
          <Input
            value={manualText}
            onChange={(event) => setManualText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") submitManualText();
            }}
            placeholder="Ou digite a fala do cliente…"
            aria-label="Digite a fala do cliente"
          />
          <Button size="sm" variant="outline" onClick={submitManualText} disabled={!manualText.trim()}>
            Enviar
          </Button>
        </div>
        <Button className="voice-run" variant="outline" onClick={simulateVoice} disabled={listening}>
          <Sparkles size={15} /> {listening ? "Ouvindo…" : "Simular intenção pronta"}
        </Button>
      </CardContent>
    </Card>
  );
}
