# Apresentação independente

App explicativo incorporado do PR #4. Código, servidor, estado em memória e build próprios; não altera o aplicativo principal da porta 3000.

Nesta pasta, execute `pnpm install`, `pnpm build` e `EXA_AGENT_MOCK=true pnpm start`. Abra http://localhost:3001.

O modo de apresentação usa 30 segundos para aceite e um roteiro guiado. A demonstração operacional mantém suas próprias regras na porta 3000.

Não exige chave Exa: o roteiro identifica o contexto simulado. Reiniciar a apresentação não reinicia o outro aplicativo.
