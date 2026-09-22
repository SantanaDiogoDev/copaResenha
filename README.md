# Copa da Resenha

Site em React que lê a planilha do campeonato no Google Drive e mostra classificação, jogos, participantes, clubes e as regras oficiais, atualizando sozinho a cada 30 segundos.

Os números fixos do regulamento (90 partidas, 18 por participante, critérios de desempate) ficam em `src/regulamento.js`. O texto da aba Regras está em `src/components/Rules.jsx`.

## Como funciona

O navegador não consegue ler um arquivo do Google Drive direto (bloqueio de CORS), então uma Netlify Function (`netlify/functions/planilha.mjs`) baixa a planilha, converte todas as abas para JSON e entrega em `/api/planilha`. O React consulta esse endereço periodicamente e sempre que a aba do navegador volta a ficar visível.

As abas são localizadas pelo nome ("Classificação", "Jogos", "Participantes", "Clubes") e as colunas pelo cabeçalho, então mudar a posição das tabelas na planilha não quebra o site. Abas que começam com `_` são ignoradas.

## Requisitos da planilha

Compartilhamento em **Qualquer pessoa com o link: leitor**.

## Rodar localmente

```bash
npm install
npm install -g netlify-cli   # uma vez só
npm run dev                  # abre em http://localhost:8888
```

Use `npm run dev` (Netlify CLI), não `npx vite` sozinho: só assim a função `/api/planilha` roda junto.

## Publicar no Netlify

Envie o projeto para um repositório no GitHub e, no Netlify, use **Add new site > Import an existing project**. As configurações de build já estão no `netlify.toml`.

O deploy por arrastar a pasta `dist` não publica a função, então use o GitHub ou `netlify deploy --prod`.

Para trocar de planilha sem mexer no código, crie a variável de ambiente `SHEET_ID` em **Site configuration > Environment variables**.
