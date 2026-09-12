# BrazilNuts

Demo de ofertas dinâmicas para restaurantes. A ocupação das comandas e as reservas de cupons determinam descontos de 50%, 35%, 20% ou pausa. Interface React baseada no bloco oficial **sidebar-03 do shadcn/ui**, adaptada para gestão, simulador, celular do cliente e recepção.

## Executar

Requisitos: Node.js 20+ e pnpm.

```sh
pnpm install
pnpm build
pnpm start
```

Abra http://localhost:3000. Para desenvolvimento, mantenha o servidor ligado e execute `pnpm dev` em outro terminal. `pnpm test` verifica as regras de negócio.

## Roteiro rápido

Para apresentar o projeto em um pitch de 3 minutos, use o [storytelling de demonstração](brazilnuts-demo-storytelling.md). Ele começa no salão, acompanha a decisão autônoma do agente e fecha no cliente por WhatsApp simulado, voz e cardápio com Exa.

1. Comece com 80 mesas: nenhuma oferta.
2. Ajuste para 60, 40 e depois 23 para demonstrar as faixas.
3. Libere um lote de 5 cupons.
4. No celular, clique em garantir e confirme o pagamento fictício.
5. Simule o próximo cliente e compre novamente: a próxima oferta passa a 35%.
6. Na recepção, simule a leitura do QR: a reserva vira comanda.
7. Avance 30 minutos para expirar o outro cupom; reinicie para repetir.

## Limites da demo

Dados, WhatsApp, pagamento e estorno são simulados. O QR é real, mas a leitura é acionada por botão ou código manual. Estado central em memória, reiniciado com o processo; servidor restrito ao computador local, sem autenticação e não adequado para exposição pública. Os agentes apenas sugerem ou simulam campanhas: preço, estoque e regras continuam sob controle do motor determinístico.

## Agente de campanhas

O botão “Executar agora” consulta o estado e a base de 12 clientes fictícios, seleciona destinatários e registra envios simulados. O modelo pode escolher enviar ou pausar. O sistema limita os destinatários aos elegíveis, respeita estoque, autorização e intervalo de 30 minutos, e descarta decisões se o contexto mudou durante a análise. Compras são associadas ao cliente escolhido no celular; a base mostra convite, compra e chegada.

O **piloto automático** reage a mudanças de ocupação, compra, chegada e relógio. Quando existe uma oferta válida sem lote disponível, ele libera um lote fictício e executa a campanha; use “Desativar piloto” para voltar ao modo manual. Toda execução automática fica marcada no histórico do dashboard de resultados.

Para ativar a OpenAI, crie um arquivo local `.env` a partir de `.env.example`, preencha `OPENAI_API_KEY` e reinicie o servidor. Não cole a chave no navegador nem faça commit dela. `OPENAI_MODEL` é configurável; o padrão é `gpt-5-mini`. A disponibilidade do modelo depende da conta. Requer Node 20.12+ para carregar o arquivo de ambiente automaticamente.

Sem chave, o painel informa “Modo demonstrativo”; em erro de API, informa fallback. A integração usa Responses API com saída estruturada e `store:false`. O texto criativo é exibido como rascunho; a mensagem enviada na simulação mantém os termos comerciais determinados pelo sistema. Somente perfis fictícios com identificadores, preferência e tempo de chegada são enviados ao modelo.

Validação local: testes com respostas de API simuladas cobrem limites, fallback, contexto obsoleto e reset durante análise. Chamada real pendente de configuração da chave. Referência: [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).

## Agente de campanha com Exa

O painel **Assistente** pode executar um Agent Run da Exa para transformar o cardápio real em uma mensagem de campanha. O servidor busca o cardápio, normaliza no máximo 60 itens e os envia como `input.data`; a Exa não recebe URL, token ou acesso direto ao backend. Desconto, estoque, prazo e regras continuam exclusivamente no motor determinístico da demo.

Configure as variáveis somente no servidor antes de iniciar a aplicação:

```sh
export EXA_API_KEY="sua_chave_da_exa"
export MENU_BACKEND_URL="https://api.exemplo.com/api/v1/default/catalog"
# Opcional: apenas se o backend exigir autenticação Bearer.
export MENU_BACKEND_BEARER_TOKEN="token-do-backend"
pnpm start
```

Em desenvolvimento local, `MENU_BACKEND_URL` também aceita `http://127.0.0.1/...` ou `http://localhost/...`; em qualquer outro host, HTTPS é obrigatório. O fluxo é assíncrono: a interface cria o run, consulta seu estado e só mostra a saída quando a Exa informar `completed`. A execução usa `effort: "low"`, saída JSON estruturada e expõe fontes da Exa caso a resposta contenha grounding.

Sem `EXA_API_KEY` ou `MENU_BACKEND_URL`, o botão permanece desabilitado e não há chamada externa.

### Testar sem backend ou chave

Para validar toda a experiência visual — botão, carregamento, resposta estruturada e itens sugeridos — sem chamar o cardápio nem a Exa:

```sh
EXA_AGENT_MOCK=true pnpm start
```

Para testar uma execução **real** na Exa, mas ainda sem depender do backend do restaurante, use o endpoint local de cardápio mock:

```sh
EXA_API_KEY="sua_chave_da_exa" \
MENU_BACKEND_URL="http://127.0.0.1:3000/api/mock/menu" \
pnpm start
```

O endpoint mock contém quatro itens fictícios e só existe no servidor local. Em ambos os casos, abra `http://localhost:3000`, vá em **Assistente** e use o botão do assistente de cardápio. O primeiro modo é inteiramente simulado; o segundo cria, acompanha e exibe uma execução real da Exa.

## Conversa por voz

A área **Resultados** inclui a conversa do ponto de vista do cliente. O botão de microfone usa o reconhecimento de fala nativo do navegador (`SpeechRecognition` ou `webkitSpeechRecognition`) em `pt-BR`; ao primeiro uso, permita o microfone para `localhost`. Se o navegador não oferecer a API ou a permissão for bloqueada, digite a fala no campo de fallback ou use uma das intenções prontas. O reconhecimento pode enviar áudio ao serviço do navegador. As respostas são demonstrativas, baseadas em regras locais, e não em um agente de voz generativo.

Cada cupom reserva uma mesa por 30 minutos e mantém seu desconto. R$ 5 viram crédito na conta; desconto sobre até R$ 100 em itens elegíveis. Premissas comerciais da demo, não termos de um serviço em produção.

Planejamento: [specs/brazilnuts-speckit.md](specs/brazilnuts-speckit.md).
Base visual: [shadcn/ui sidebar-03](https://ui.shadcn.com/blocks/sidebar#sidebar-03), componentes sob licença MIT.
