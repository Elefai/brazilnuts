# BrazilNuts — Especificação da demo de hackathon

Status: planejamento para implementação. Não é código implementado nem configuração instalada no repositório.

## Proposta

Transformar capacidade ociosa de restaurantes em visitas com ofertas dinâmicas: comandas indicam a ocupação, o sistema publica cupons na base cadastrada e cada compra reduz a disponibilidade e pode mudar o desconto da próxima oferta. O cliente paga R$ 5 para garantir um cupom, chega no prazo e valida um QR code.

Sem câmera. A gestão de comandas é um simulador para a demonstração; uma integração com o sistema real do restaurante é evolução futura.

## Constitution — princípios

1. Uma demonstração completa, repetível e compreensível em três minutos.
2. Regras de desconto determinísticas e explicáveis; valores monetários e estoques nunca dependem de texto gerado por IA.
3. Pagamento e entrega por WhatsApp simulados, claramente identificados. Nenhuma cobrança ou mensagem real no MVP.
4. Uma única fonte de estado mantém gestão, cliente e validação sincronizados.
5. Compra confirmada preserva desconto e prazo; oferta antiga não garante preço antes da compra.
6. Não vender duas vezes o último cupom e não validar duas vezes o mesmo QR.
7. Interface em português, valores em reais e relógio de demonstração visível.

## Spec — escopo e regras

### Decisões de planejamento adotadas

Estas são premissas propostas, ajustáveis antes da implementação:

- Um cupom corresponde a uma mesa; uma compra pendente de chegada reserva temporariamente essa capacidade.
- Ocupação efetiva = mesas ocupadas + reservas de cupons ainda válidos. Mostrar os dois números separadamente.
- Cupom custa R$ 5, vale por 30 minutos a partir da compra e esse valor é abatido da conta. No MVP, pagamento e eventual estorno são fictícios.
- Oferta cobre itens elegíveis até R$ 100 por mesa; descontos máximos de R$ 20, R$ 35 ou R$ 50 conforme a faixa. Essa condição deve estar visível antes de comprar.
- Lote inicial de até 5 cupons. Esgotar um lote não cria outro automaticamente: o operador pode liberar um novo lote na demo.
- A regra é proporcional à capacidade; o cenário padrão tem 100 mesas.

### Regra dinâmica

| Ocupação efetiva | Desconto de novos cupons |
|---|---|
| De 75% em diante | Emissão e novas compras pausadas |
| De 50% até menos de 75% | 20% |
| De 25% até menos de 50% | 35% |
| Abaixo de 25% | 50% |

Não arredondar a porcentagem antes da comparação. A compra usa a faixa válida imediatamente antes de ser confirmada e aumenta as reservas em uma unidade; depois disso, recalcular a oferta seguinte. Exemplo: com 24 mesas efetivas, a compra tem 50%; após a compra, são 25 e a próxima oferta tem 35%.

Disponibilidade comprável = menor valor entre saldo do lote e a capacidade restante até atingir 75% de ocupação efetiva. Para capacidades diferentes de 100, a quantidade até o limite é max(0, ceil(0,75 × capacidade) − ocupadas − reservas). O lote nunca excede esse limite quando criado.

Ao fechar comandas, o desconto pode aumentar novamente. Ao abrir comandas, pode diminuir ou pausar. Reservas existentes são preservadas; o simulador impede abrir uma nova mesa se ocupadas + reservas já igualar a capacidade física.

Uma reserva validada vira mesa ocupada na mesma operação: reservas −1 e ocupadas +1. Ela não é contada duas vezes. Na expiração, a reserva é liberada e o desconto é recalculado; o cupom vendido não volta ao lote automaticamente. Uma nova liberação de lote é explícita.

### Histórias de usuário e critérios

**US1 — Operador controla o salão (P0).** Como apresentador, ajusto as comandas e vejo o impacto imediato nas ofertas.

- Grade com 100 mesas, botões abrir/fechar, ajuste numérico e presets 80, 60, 40 e 20 mesas.
- Comanda associada a uma mesa; várias pessoas ou contas na mesma mesa não aumentam ocupação.
- Exibir ocupadas, livres, reservas, ocupação efetiva, desconto atual e saldo comprável.
- Mudanças aparecem em todas as telas em até um segundo no ambiente local.

**US2 — Cliente compra uma oferta (P0).** Como cliente cadastrado, recebo uma notificação simulada e compro um cupom disponível.

- Tela de celular com conversa de WhatsApp simulada e link para a oferta no app BrazilNuts.
- Exibir desconto, R$ 5, saldo, elegibilidade, limite, prazo de chegada e condições antes da confirmação.
- Ao confirmar pagamento fictício, criar exatamente um cupom, reduzir saldo e reservar uma mesa.
- Duplo clique ou repetição da requisição retorna a mesma compra, sem segunda cobrança ou reserva.
- Se a oferta mudou desde que foi aberta, apresentar os novos termos e pedir novo aceite; não comprar silenciosamente por desconto menor.
- Sem estoque ou com emissão pausada, impedir compra e explicar o motivo.

**US3 — Cliente chega ao restaurante (P0).** Como atendente, valido o cupom e abro a comanda.

- Cupom mostra QR code e contagem regressiva calculada pelo relógio central.
- Validação por botão de simulação ou código manual; leitura por câmera é opcional e fora do caminho obrigatório.
- QR identifica um cupom por token opaco, sem dados pessoais embutidos.
- Cupom válido é consumido uma vez e recebe mesa disponível.
- Cupom expirado, desconhecido ou já utilizado é recusado sem alterar o estado.

**US4 — Apresentador conduz a demo (P0).** Como apresentador, simulo demanda e passagem do tempo sem depender de serviços externos.

- Controles: comprar como próximo cliente fictício, avançar 5 minutos, reiniciar cenário e liberar lote.
- Avançar o relógio processa expirações antes de recalcular a oferta.
- Reiniciar limpa compras e histórico fictícios e restaura cenário inicial conhecido.
- Histórico registra causa e resultado: comanda aberta, oferta alterada, compra, expiração e validação.

**US5 — Assistente de campanha (P1).** Como gestor, obtenho uma mensagem e uma explicação comercial geradas por IA a partir da oferta vigente.

- Integração OpenAI proposta para redigir a campanha e explicar a ação, sem decidir percentuais ou executar pagamentos.
- Entrada com dados fictícios agregados e oferta já calculada; saída não pode alterar preço, prazo ou estoque.
- Interface monta valores a partir do motor de regras, sem confiar nos números do texto gerado.
- Enquanto gera ou se houver falha, usar mensagem pronta. Identificar se o conteúdo foi gerado por IA ou é fallback.
- Chamada real é um incremento recomendado para demonstrar IA; não alegar IA ativa se apenas o fallback estiver funcionando.

### Experiência visual

Uma rota de apresentação reúne o painel de gestão e o celular lado a lado. Um painel compacto contém a validação. Rotas individuais podem reutilizar os mesmos componentes.

Prioridade visual: ocupação → desconto → oferta recebida → compra → QR. Animar contadores e mudança de faixa sem atrasar o fluxo. Histórico curto com horários demonstra causa e efeito. A notificação original permanece histórica; abrir seu link sempre consulta a oferta atual.

### Fora do MVP

Câmera, visão computacional, WhatsApp real, pagamento real, integração com PDV, múltiplos restaurantes, cadastro complexo, precificação por aprendizado de máquina e métricas de receita supostamente comprovadas.

## Plan — abordagem de implementação

Antes de escolher bibliotecas, inspecionar Elefai/brazilnuts e suas instruções e reaproveitar sua estrutura. Este documento não presume uma tecnologia existente no repositório.

Construir motor de regras independente da interface. Um serviço central aplica comandos serializados e publica o novo estado para as telas; se a demo rodar em duas abas ou dispositivos, sincronizá-las pelo servidor. O servidor é responsável por compra atômica, versão da oferta, relógio, expiração e consumo único do QR. Usar persistência simples disponível no projeto; para instância única de demo, armazenamento leve é suficiente, com reset explícito.

Entidades mínimas:

- Restaurant: capacidade e configuração comercial.
- Table/Tab: identificação da mesa e comanda aberta ou fechada.
- Campaign: lote, saldo não vendido, versão, status e oferta calculada.
- Coupon: cliente fictício, desconto e termos congelados, pagoEm, expiraEm, status, token e chave de idempotência.
- Event: horário, tipo, causa e variação de ocupação/estoque.
- DemoClock: horário de referência e avanço controlado.

Comandos mínimos: abrir/fechar comanda, ajustar ocupação, liberar lote, comprar cupom, validar cupom, avançar relógio e resetar. Consultas retornam estado e histórico; integração de IA fica separada.

Compra: processar expirações → verificar versão e saldo → fixar termos → criar cupom e reserva → reduzir lote → recalcular oferta → publicar evento, tudo de forma atômica. Validar idempotência antes de reaplicar efeitos.

Notificações simuladas são criadas ao iniciar campanha ou mudar a faixa, evitando uma mensagem nova a cada atualização de contador. O app consulta a oferta vigente ao abrir e ao comprar.

## Tasks — ordem de construção

- [ ] T01 Inspecionar repositório e instruções; decidir estrutura aproveitando o projeto existente.
- [ ] T02 Implementar estado, relógio e motor das quatro faixas com testes de fronteira.
- [ ] T03 Implementar comandas e presets do simulador.
- [ ] T04 Implementar lotes, compras atômicas, idempotência e reservas.
- [ ] T05 Construir celular: notificação, oferta, pagamento fictício e QR.
- [ ] T06 Implementar validação, expiração e conversão da reserva em comanda.
- [ ] T07 Montar apresentação lado a lado com histórico e atualização sincronizada.
- [ ] T08 Adicionar geração de campanha por OpenAI com fallback, se houver credencial disponível no servidor.
- [ ] T09 Verificar fluxo completo, compra concorrente e rejeições; ajustar apresentação.
- [ ] T10 Preparar instruções de execução e ensaiar roteiro com reset.

Prioridade: concluir T01–T07 antes do incremento de IA. T09–T10 são obrigatórias para entrega. Não estimar duração antes de inspecionar o código e saber o tempo restante do hackathon.

## Verificação de aceite

1. Com reservas zeradas, 24/25, 49/50 e 74/75 resultam respectivamente em 50/35, 35/20 e 20/pausa.
2. Com 23 ocupadas e lote de 5, duas compras recebem 50%; a oferta seguinte é 35%, com saldo de 3.
3. Duas compras concorrentes do último cupom geram apenas um sucesso; repetir uma compra não duplica efeitos.
4. Oferta antiga exige novo aceite se os termos mudarem.
5. Validar transforma uma reserva em ocupação sem mudar o total efetivo.
6. Na hora exata da expiração, recusar validação e liberar a reserva uma única vez.
7. Desconto de cupom comprado não muda quando a faixa muda.
8. Todas as telas refletem o mesmo estado; reset permite repetir o roteiro.
9. Falha na geração de texto não impede compra, cálculo ou validação.

## Roteiro de apresentação — três minutos

1. Começar com 80 mesas: ofertas pausadas. “O sistema acompanha comandas abertas.”
2. Ajustar para 60: mostrar 20%; para 40: 35%; para 23: 50%.
3. Liberar lote de 5. Mostrar notificação no celular e primeira compra de R$ 5: saldo 4 e QR com prazo.
4. Simular segundo cliente comprando: saldo 3 e demanda efetiva 25. Próxima oferta cai para 35%; primeiro cupom mantém 50%.
5. Validar o primeiro QR: cliente chegou, reserva vira comanda e QR não pode ser reutilizado.
6. Avançar 30 minutos: segundo cupom expira, liberando sua reserva.
7. Subir para 75 mesas: novas ofertas pausam. Encerrar com histórico do ciclo.

Pitch: “O BrazilNuts usa o movimento do restaurante para ajustar ofertas em tempo real. O cliente garante o desconto com um pequeno pagamento e prazo de chegada; o restaurante acompanha os clientes a caminho e para de oferecer descontos quando a demanda se recupera.”

## Referência de organização

Planejamento organizado nas etapas constitution, spec, plan e tasks do GitHub Spec Kit: https://github.com/github/spec-kit. O toolkit não foi instalado nem executado nesta etapa.
