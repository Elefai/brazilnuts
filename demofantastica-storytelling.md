# BrazilNuts — Demo Fantástica Autônoma

## Frase de abertura

> “Uma mesa vazia não é ausência. É uma conversa esperando o momento certo.”

## O que acontece ao abrir

Abra `/demofantastica` e não clique em nada. A apresentação reinicia a simulação e segue sozinha, com pausa e replay apenas como controles opcionais.

Ela usa o mesmo motor da aplicação: ocupação, piloto automático, perfis elegíveis, convites, abertura de notificação, compra fictícia, QR e resultado. Não há um funil visual inventado em paralelo.

Em uma sessão padrão, o roteiro registra uma campanha real com cinco clientes:

- 5 convites enviados;
- 4 notificações abertas;
- 3 reservas confirmadas;
- 1 chegada validada no salão.

Uma pessoa é a jornada central da história. As demais permanecem visíveis com estados reais de convite entregue, avaliação, reserva ou chegada, para mostrar que o agente trabalha em várias conversas ao mesmo tempo — e não em uma janela de chat isolada.

## Storytelling de cerca de 1 minuto

### 0:00 — O salão já está falando

> “Um restaurante cheio não precisa chamar ninguém. Mas quando o almoço termina, uma mesa vazia pode virar uma oportunidade — se alguém entender o momento certo.”

O prólogo mostra o salão estável e o indicador **Apresentação autônoma**. Não há ação manual: o agente está observando, sem interromper ninguém.

### 0:06 — Um sinal operacional, não uma campanha genérica

> “A ocupação cai para 23 mesas. Isso não é um pedido para abrir outro chat; é um evento dentro da operação.”

O núcleo do salão muda, a demanda cai e o piloto automático cria um lote de cinco convites. A primeira batida do roteiro fica concluída.

### 0:11 — Escolha, não disparo em massa

> “O agente cruza disponibilidade, tempo para chegar, consentimento e preferência. Ele encontra cinco pessoas elegíveis — não uma lista inteira para disparar.”

Apresente a faixa **Uma campanha, várias histórias**. As cinco cards são destinatários da mesma campanha real. Cada uma começa como `convite entregue`.

### 0:16 — Várias pessoas reagem em ritmos diferentes

> “Aqui está o ponto: a IA não espera uma cliente terminar para começar a próxima. Enquanto uma abre a oferta, outra avalia, uma terceira reserva e uma quarta ainda recebe a mensagem.”

As cards se atualizam em paralelo. A jornada destacada abre o convite; outra cliente também abre a notificação. Isso torna visível a orquestração de vários canais sem inventar resultados.

### 0:24 — Reserva é uma decisão protegida

> “Quando alguém aceita, não viramos só uma mensagem em clique. Viramos uma reserva com preço, prazo, estoque e idempotência sob as regras do restaurante.”

Três reservas são criadas em sequência, usando a versão vigente de cada oferta. A tela mostra esses estados e preserva o desconto de cada reserva já feita.

### 0:35 — O cardápio entra onde ajuda

> “Só depois de proteger a operação entra o contexto de cardápio. A recomendação deixa a conversa mais humana, mas não decide preço, estoque nem prazo.”

Com `EXA_AGENT_MOCK=true`, a Exa mock entra automaticamente e destaca itens do catálogo. Sem mock, a apresentação declara claramente que está usando contexto local de catálogo para manter o ritmo; ela não finge que uma chamada externa terminou.

### 0:43 — A pergunta humana

> “A cliente não fala com um painel. Ela pergunta: ‘o que combina com o meu gosto?’ A resposta já tem o contexto da operação e do cardápio.”

A transcrição aparece sozinha. A síntese de voz é um bônus do navegador; a história não depende de permissão de áudio para seguir.

### 0:49 — A mensagem volta a ser mesa

> “O QR fecha uma das jornadas no balcão. A mensagem virou presença. E a presença volta para a equipe como evidência.”

No mini mapa, uma mesa vazia se ilumina. O QR e a chegada são uma ação real da simulação, não só uma animação.

### 0:54 — Resultado, não só atividade

> “Agora a equipe consegue enxergar o que aconteceu: cinco convites, quatro aberturas, três reservas e uma chegada. Uma conversa virou uma mesa ocupada.”

O epílogo assume a tela com o funil real e a taxa de conversão convite → chegada.

### Fechamento

> “BrazilNuts não é um chatbot de restaurante. É um agente que vive no ritmo do salão, conversa onde a cliente já está e devolve resultado para quem opera.”

## Preparação segura

Para um ensaio determinístico, sem Exa nem backend externo:

```sh
pnpm build
EXA_AGENT_MOCK=true pnpm start
```

Depois abra `http://localhost:3000/demofantastica`.

Se a porta 3000 já estiver ocupada, escolha outra porta para o servidor e abra a mesma porta no navegador:

```sh
PORT=3005 EXA_AGENT_MOCK=true pnpm start
```

Para consultar a Exa real com o cardápio local de demonstração, continue usando o cockpit **Assistente**. O autoplay propositalmente não espera uma execução remota: ele mantém a apresentação contínua e mostra contexto local de forma explicitamente rotulada.

```sh
EXA_API_KEY="sua_chave_da_exa" \
MENU_BACKEND_URL="http://127.0.0.1:3000/api/mock/menu" \
pnpm start
```

## O que afirmar — e o que não afirmar

- Ocupação, seleção dos cinco perfis, convites, aberturas, reservas, QR e funil vêm do motor real da demo.
- Os estados das cinco cards derivam da campanha e das ações registradas; as animações apenas tornam esse estado mais fácil de acompanhar.
- A Exa/mock organiza contexto de cardápio. Ela nunca controla preço, estoque, cupom, pagamento ou prazo.
- WhatsApp, pagamento, chegada e a voz são simulados para a apresentação.
- A reprodução de áudio depende das permissões do navegador; a transcrição sempre permanece na tela.
