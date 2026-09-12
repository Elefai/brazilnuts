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

## Limites da demo

Dados, WhatsApp, pagamento e estorno são simulados. O QR é real, mas a leitura é acionada por botão ou código manual. Estado central em memória, reiniciado com o processo; servidor restrito ao computador local, sem autenticação e não adequado para exposição pública. O painel de assistente explica regras; não há IA conectada nesta versão. Próxima etapa: agente de campanhas com integração real, sem delegar preços ou estoque ao modelo.

Cada cupom reserva uma mesa por 30 minutos e mantém seu desconto. R$ 5 viram crédito na conta; desconto sobre até R$ 100 em itens elegíveis. Premissas comerciais da demo, não termos de um serviço em produção.

Planejamento: [specs/brazilnuts-speckit.md](specs/brazilnuts-speckit.md).
Base visual: [shadcn/ui sidebar-03](https://ui.shadcn.com/blocks/sidebar#sidebar-03), componentes sob licença MIT.
