# Copa da Resenha

Site em React que lê a planilha do campeonato no Google Drive e mostra classificação, jogos, participantes, clubes e as regras oficiais, atualizando sozinho a cada 30 segundos.

Os números fixos do regulamento (90 partidas, 18 por participante, critérios de desempate) ficam em `src/regulamento.js`. O texto da aba Regras está em `src/components/Rules.jsx` — o conteúdo foi conferido contra o PDF `Regulamento_Oficial_Liga_Soriano_com_Regra_de_Desconexao.pdf` e está fiel ao documento, incluindo o Anexo I (desconexões).

## Como funciona

O navegador não consegue ler um arquivo do Google Drive direto (bloqueio de CORS), então uma Netlify Function (`netlify/functions/planilha.mjs`) baixa a planilha, converte todas as abas para JSON e entrega em `/api/planilha`. O React consulta esse endereço periodicamente e sempre que a aba do navegador volta a ficar visível.

As abas são localizadas pelo nome ("Classificação", "Jogos", "Participantes", "Clubes") e as colunas pelo cabeçalho, então mudar a posição das tabelas na planilha não quebra o site. Abas que começam com `_` são ignoradas (ex.: `_Calculos`).

## Requisitos da planilha

Compartilhamento em **Qualquer pessoa com o link: leitor**.

Planilha oficial em uso: `Copa_da_Resenha_Gerenciador.xlsx`, ID `1t1o8E36jIaEojy5s7CY8dQKMFR3kfrOZ` (já é o valor padrão em `netlify/functions/planilha.mjs`).

## Rodar localmente

```bash
npm install
npm install -g netlify-cli   # uma vez só
npm run dev                  # abre em http://localhost:8888
```

Use `npm run dev` (Netlify CLI), não `npx vite` sozinho: só assim a função `/api/planilha` roda junto e a planilha real é carregada. Rodando só com `vite`, a aba fica presa em "Carregando a planilha…" porque `/api/planilha` não existe.

O projeto também tem um `.claude/launch.json` configurado para abrir automaticamente no Claude Code com o botão de preview.

## Como testar

1. Suba com `npm run dev` e abra `http://localhost:8888`.
2. Confira o console do navegador: não deve ter nenhum erro (F12 → Console).
3. Passe por todas as abas — Classificação, Jogos, Participantes, Clubes e Regras — e confira que os dados batem com a planilha oficial.
4. Clique em "Atualizar agora" no topo e confirme que a hora "Atualizado às…" muda.
5. Na aba Regras, teste a calculadora de queda de conexão (seção "Desconexões") com o exemplo padrão (63:40, 2×1) — o resultado oficial deve dar 3×2, igual ao exemplo do regulamento.
6. Rode o build de produção antes de publicar, para garantir que não há erro de compilação:
   ```bash
   npm run build
   npm run preview   # serve o build em http://localhost:4173 (sem a função /api/planilha)
   ```
   Repare que `npm run preview` **não** sobe a função — serve só para checar se o bundle final renderiza; para testar com dados reais use sempre `npm run dev`.

## Ajustes feitos nesta revisão

- **Bug no "clube" do participante** (Classificação e cabeçalho): o código tentava montar um índice `participante → clube`, mas como cada jogador usa 9 clubes diferentes (um por adversário, sem um clube fixo), a planilha real não tem essa coluna — e a busca por nome acabava batendo por engano na coluna "Clubes preenchidos" da aba Participantes, mostrando "9" no lugar de um nome de clube. Essa lógica (`buildClubIndex`) foi removida; o clube de cada jogador continua aparecendo corretamente por partida na aba Jogos.
- **Linhas fantasmas em Participantes**: a planilha tem slots de template vazios ("Jogador 11" a "Jogador 20") que apareciam como linhas em branco na tabela. O parser genérico agora ignora linhas com apenas uma célula preenchida.
- Adicionado `.claude/launch.json` para rodar o preview local direto pelo Claude Code.

## Publicar no Netlify

As configurações de build já estão no `netlify.toml` (`npm run build`, publica `dist/`, função em `netlify/functions`).

**Importante:** o deploy por arrastar a pasta `dist` no Netlify não publica a função `/api/planilha` — sem ela o site fica preso em "Carregando a planilha…" em produção. Use um dos dois caminhos abaixo.

### Opção A — Netlify CLI (mais direto, sem precisar de GitHub)

```bash
netlify login          # abre o navegador para autenticar sua conta Netlify
netlify init            # cria ou conecta um site Netlify a esta pasta (siga o prompt)
netlify deploy --prod   # builda e publica a versão de produção
```

### Opção B — GitHub + import no Netlify

```bash
git remote add origin <url-do-seu-repositorio-no-github>
git push -u origin main
```

Depois, no [app.netlify.com](https://app.netlify.com): **Add new site → Import an existing project** → escolha o repositório. As configurações de build são lidas automaticamente do `netlify.toml`.

### Variável de ambiente opcional

Para trocar de planilha sem mexer no código, crie a variável de ambiente `SHEET_ID` em **Site configuration → Environment variables** no painel do Netlify.
