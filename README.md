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

1. Comece com 80 mesas: nenhuma oferta.
2. Ajuste para 60, 40 e depois 23 para demonstrar as faixas.
3. Libere um lote de 5 cupons.
4. No celular, clique em garantir e confirme o pagamento fictício.
5. Simule o próximo cliente e compre novamente: a próxima oferta passa a 35%.
6. Na recepção, simule a leitura do QR: a reserva vira comanda.
7. Avance 30 minutos para expirar o outro cupom; reinicie para repetir.

## Resultados das campanhas

Abra `/resultados` ou use **Resultados** na sidebar. A página abre em **Demonstração — 7 dias**, com sete campanhas fictícias e a mais recente destacando a evolução de **25% para 80%**: 100 convidados, 50 compras, 50 chegadas com voucher e 5 chegadas espontâneas. Os dados demonstrativos são derivados de eventos e não alteram o salão ou o histórico da sessão.

Filtre por fonte, período, campanha e janela de 15, 30 ou 60 minutos. O dashboard mostra a ocupação antes do envio e no fim da janela, a média ponderada como contexto, compras, chegadas, conversão, uma curva de ocupação em degraus, barras com base zero e uma tabela comparativa das campanhas. Sem convidados, a conversão aparece como “Sem base”.

O histórico começa com o servidor e é apagado no reset. Períodos sem 30 minutos registrados são identificados como parciais. Use os controles de relógio e o simulador para acompanhar os resultados; convites sozinhos não geram compras nem ocupação. Outras campanhas nas janelas são sinalizadas. A comparação temporal não comprova efeito exclusivo de uma campanha.

`GET /api/analytics?source=demo|session&from=AAAA-MM-DD&to=AAAA-MM-DD&campaignId=...&window=15|30|60` retorna campanhas filtradas, seleção, cobertura, indicadores e série temporal. Parâmetros inválidos retornam 400; identificador inexistente retorna 404. Envios pausados ou descartados não criam registros de campanha.

## Limites operacionais

Dados, WhatsApp, pagamento e estorno são simulados. O QR é real, mas a leitura é acionada por botão ou código manual. Estado central em memória, reiniciado com o processo; servidor restrito ao computador local, sem autenticação e não adequado para exposição pública.

## Agente de campanhas

O botão “Analisar e executar campanha” consulta o estado e a base de 12 clientes fictícios, seleciona destinatários e registra envios simulados. O modelo pode escolher enviar ou pausar. O sistema limita os destinatários aos elegíveis, respeita estoque, autorização e intervalo de 30 minutos, e descarta decisões se o contexto mudou durante a análise. Compras são associadas ao cliente escolhido no celular; a base mostra convite, compra e chegada.

Para ativar a OpenAI, crie um arquivo local `.env` a partir de `.env.example`, preencha `OPENAI_API_KEY` e reinicie o servidor. Não cole a chave no navegador nem faça commit dela. `OPENAI_MODEL` é configurável; o padrão é `gpt-5-mini`. A disponibilidade do modelo depende da conta. Requer Node 20.12+ para carregar o arquivo de ambiente automaticamente.

Sem chave, o painel informa “Modo demonstrativo”; em erro de API, informa fallback. A integração usa Responses API com saída estruturada e `store:false`. O texto criativo é exibido como rascunho; a mensagem enviada na simulação mantém os termos comerciais determinados pelo sistema. Somente perfis fictícios com identificadores, preferência e tempo de chegada são enviados ao modelo.

Validação local: testes com respostas de API simuladas cobrem limites, fallback, contexto obsoleto e reset durante análise. Chamada real pendente de configuração da chave. Referência: [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs).

Cada cupom reserva uma mesa por 30 minutos e mantém seu desconto. R$ 5 viram crédito na conta; desconto sobre até R$ 100 em itens elegíveis. Premissas comerciais da demo, não termos de um serviço em produção.

Planejamento: [specs/brazilnuts-speckit.md](specs/brazilnuts-speckit.md).
Base visual: [shadcn/ui sidebar-03](https://ui.shadcn.com/blocks/sidebar#sidebar-03), componentes sob licença MIT.
