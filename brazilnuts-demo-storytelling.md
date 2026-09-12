# BrazilNuts — storytelling de demonstração

## A ideia em uma frase

**Quando o salão muda, o agente muda junto — no lugar em que o trabalho acontece, no celular de quem vai chegar e na voz do cliente.**

O BrazilNuts não começa em uma janela de chat. Ele começa em um salão vivo: a ocupação muda, uma oportunidade comercial aparece, o piloto escolhe quem faz sentido convidar e a conversa continua no canal do cliente. O cardápio com Exa entra como inteligência contextual para transformar a oferta em uma mensagem útil.

## O arco da história

1. **Tensão:** o restaurante tem mesas disponíveis, mas a equipe não sabe quem convidar nem qual mensagem enviar naquele momento.
2. **Sinal:** a ocupação cai para 23 mesas e a regra de demanda libera 50% OFF.
3. **Autonomia:** o piloto percebe a mudança, libera um lote de cinco cupons, cruza proximidade, preferência e autorização, e prepara os convites.
4. **Encontro:** um cliente recebe a notificação no WhatsApp simulado, abre a oferta e confirma um cupom de R$ 5.
5. **Continuidade:** a mesma experiência pode ser falada; o cliente pergunta pela oferta, pelo cardápio ou pelo prazo de chegada.
6. **Aprendizado:** o dashboard mostra enviados, abertos, comprados e chegadas — não apenas uma resposta bonita do agente.

Esse arco atende à premissa do desafio: o agente opera dentro de um ambiente de trabalho (salão e operação), de um canal de bolso (WhatsApp simulado) e de uma interface física/natural (voz), sem exigir que o usuário abandone o contexto para conversar com uma IA separada.

## Roteiro de palco — 3 minutos

### 0:00 — Comece no problema

Abra `http://localhost:3000` com o estado inicial. Diga:

> “Este é o restaurante no meio do expediente. O sistema sabe quantas mesas estão ocupadas, mas ainda não decidiu por conta própria quem deve receber um convite.”

Não comece pelo painel do agente ou pelas variáveis da Exa. Mostre primeiro o salão, o celular e o relógio da simulação.

### 0:20 — Acione a missão

Clique em **Iniciar missão** no canto superior direito. Esse botão garante que o piloto esteja ativo e leva a ocupação para 23 mesas.

Enquanto a tela atualiza, narre:

> “Uma queda de movimento virou um sinal operacional. O agente não espera alguém abrir um chat: ele observa o evento do salão.”

No cartão **Agente de campanhas**, a visualização deve passar por:

- **Ler o salão** — 23 ocupadas e nenhuma reserva a caminho;
- **Escolher público** — cruza preferência, distância, consentimento e janela de contato;
- **Convites no ar** — registra os contatos simulados e a decisão automática.

O lote é liberado automaticamente quando não há cupons disponíveis. Aguarde o estado **Missão concluída — agora observo**.

### 1:00 — Mostre o agente trabalhando sozinho

Aponte para a base de clientes e diga:

> “A decisão não é ‘mandar para todo mundo’. Perfis sem autorização ficam fora; clientes perto e compatíveis recebem prioridade; e o motor mantém o desconto, o estoque e o prazo sob regras determinísticas.”

Clique em um cliente que recebeu convite. A tela rola para o celular e a notificação aparece no WhatsApp simulado. Clique nela para abrir a mensagem.

### 1:25 — Feche o ciclo no bolso

Diga:

> “A campanha só vale se virar uma próxima ação. Aqui a pessoa abre a mensagem no canal em que já conversa, vê as condições e tem 30 segundos para aceitar.”

Clique em **Aceitar e pagar R$ 5 (simulado)**. Mostre o QR e, se houver tempo, clique em **Apresentar na recepção** e depois em **Simular QR**.

O ponto é mostrar a sequência completa: convite → compra → reserva → chegada. Não descreva isso como pagamento real; é uma transação fictícia da demo.

### 1:55 — Dê voz ao cliente

Na área **Resultados**, use **Conversa por voz**. Primeiro clique em uma intenção pronta para garantir o ritmo; em seguida, se o navegador permitir, clique no microfone e diga:

> “O que combina com o meu gosto?”

O componente tenta `SpeechRecognition`/`webkitSpeechRecognition` em `pt-BR` e lê a resposta no navegador. Se o microfone não estiver disponível, digite a mesma frase no campo de fallback. Explique:

> “A voz é a interface do cliente, não outro painel de backoffice. A resposta usa o estado da oferta e, quando disponível, os destaques do cardápio.”

### 2:25 — Traga o contexto do cardápio com Exa

No cartão **Assistente de cardápio**, clique em **Gerar com agente Exa** (ou **Simular resposta do agente** no modo mock).

Narre:

> “Agora a mensagem deixa de ser genérica. O agente consulta o cardápio do backend, organiza os itens e sugere uma abordagem ancorada nos pratos reais. Exa ajuda com contexto e grounding; as regras comerciais continuam no nosso motor.”

Mostre a mensagem sugerida, os destaques de menu e, se a execução for real, as fontes retornadas. Não afirme que a Exa controla estoque, preço ou envio: ela sugere conteúdo; o sistema determinístico aplica os termos.

### 2:50 — Termine com evidência

Aponte para **Evolução da campanha**:

> “O resultado não é uma demo de chat. É uma operação mensurável: enviados, abertos, compras e chegadas ficam visíveis para a equipe decidir a próxima ação.”

Feche com:

> “O agente mora no fluxo: no salão quando surge a oportunidade, no celular quando o cliente decide e na voz quando ele pergunta.”

## Preparação antes da apresentação

### Modo visual sem dependências externas

Use o mock para ter a experiência completa sem chave ou backend de cardápio:

```sh
EXA_AGENT_MOCK=true pnpm start
```

Depois abra `http://localhost:3000` e confirme que o cartão mostra **Simulação local**. Esse é o modo recomendado para ensaiar a narrativa.

### Modo Exa com cardápio local

Para provar a integração real do Agent API sem depender de outro backend:

```sh
EXA_API_KEY="sua_chave_da_exa" \
MENU_BACKEND_URL="http://127.0.0.1:3000/api/mock/menu" \
pnpm start
```

Se a porta 3000 já estiver ocupada, use outra porta e a mesma porta na URL do mock:

```sh
PORT=3002 \
EXA_API_KEY="sua_chave_da_exa" \
MENU_BACKEND_URL="http://127.0.0.1:3002/api/mock/menu" \
pnpm start
```

Nunca coloque a chave da Exa no navegador ou no repositório. O servidor normaliza o cardápio, limita a entrada a 60 itens e consulta o estado da execução até `completed`.

### Ensaio de voz

Use Chrome ou outro navegador com `SpeechRecognition`, permita o microfone para `localhost` e teste uma frase curta. Deixe uma intenção pronta ou o campo de texto como fallback. A aplicação não envia a gravação para o backend da demo; o processamento segue a API nativa do navegador.

## O que está sendo demonstrado tecnicamente

| Momento visível | Implementação que sustenta a cena |
| --- | --- |
| **Iniciar missão** | `POST /api/command` com `agent-auto` e `occupancy`; o servidor reage a eventos do salão. |
| Piloto em vigília/missão | `CampaignAgent` mantém estado de execução, decisão, erro e último envio. |
| Lote e campanha automáticos | A camada `Engine` registra lote, mensagens e `campaigns[].automatic`; não há envio real. |
| WhatsApp simulado | A notificação, janela de 30 segundos, compra fictícia e QR são estados do motor. |
| Voz | `SpeechRecognition`/`webkitSpeechRecognition` + `SpeechSynthesis` no navegador, com fallback digitado. |
| Cardápio contextual | `MENU_BACKEND_URL` alimenta `input.data` do Agent API da Exa; o resultado é consultado por polling. |
| Prova de resultado | O dashboard agrega a evolução por campanha: enviados, abertos, comprados e chegadas. |

## Guardrails para explicar aos avaliadores

- Base, clientes, WhatsApp, pagamento, QR e chegada são simulados.
- Preço do cupom, desconto, estoque, consentimento, prazo e limite de contato são aplicados pelo motor local.
- O piloto pode ser desligado; a execução manual continua disponível.
- A Exa recebe o cardápio normalizado, não recebe token do backend nem controla a transação.
- O cartão de voz usa o navegador; se o recurso não existir, a intenção pronta e o texto digitado preservam a demonstração.

## Frases curtas para perguntas comuns

**“Isso é só um chatbot?”**

“Não. O chat é apenas um ponto da jornada. A decisão nasce de um evento operacional, a campanha é registrada, o cliente compra, chega e a equipe acompanha o funil.”

**“Onde está a autonomia?”**

“No piloto automático: uma mudança de ocupação pode liberar lote e iniciar a análise sem o operador clicar em ‘Executar agora’. A autonomia é supervisionada e desligável.”

**“O que a Exa faz?”**

“Ela dá contexto ao cardápio e produz uma sugestão estruturada. Termos comerciais e ações críticas continuam protegidos por regras do sistema.”

**“Por que esse contexto é inexplorado?”**

“Porque une operação de restaurante em tempo real, outbound contextual no canal de bolso e voz do cliente em uma única continuidade — não um assistente isolado em outra aba.”

## Reinício rápido entre apresentações

1. Clique no ícone de reiniciar no topo.
2. Clique em **Iniciar missão**.
3. Espere a missão concluir e selecione um cliente convidado.
4. Se a tela ficar com um cupom antigo, use **Reiniciar** novamente; todo o estado fica em memória e é recriado pelo processo.
