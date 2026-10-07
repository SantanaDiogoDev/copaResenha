// Leitura "tolerante" das abas: localiza cabeçalhos pelo nome das colunas,
// então a planilha pode mudar de posição sem quebrar o site.

export const norm = (v) =>
  String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const text = (v) => String(v ?? "").trim();
const filled = (row = []) => row.filter((c) => text(c) !== "").length;
const firstFilled = (row = []) => text(row.find((c) => text(c) !== ""));
const isNote = (row) => filled(row) === 1 && firstFilled(row).length > 40;
const GROUP_RE = /rodada|fase|grupo|turno|semana|oitavas|quartas|semi|final/i;

export const toNum = (v) => {
  const s = text(v).replace(",", ".");
  if (s === "" || s === "-" || s === "–") return null;
  const n = Number(s.replace(/[^\d.+-]/g, ""));
  return Number.isFinite(n) ? n : null;
};

export const signed = (n) => (n == null ? "–" : n > 0 ? `+${n}` : String(n));

export function splitName(full) {
  const m = text(full).match(/^(.*?)\s*\((.+)\)\s*$/);
  return m ? { nome: m[1], tag: m[2] } : { nome: text(full), tag: "" };
}

export function findSheet(sheets, ...names) {
  if (!sheets) return null;
  const key = Object.keys(sheets).find((k) => names.some((n) => norm(k).includes(norm(n))));
  return key ? { name: key, rows: sheets[key] } : null;
}

export function sheetNotes(rows = []) {
  return rows.filter(isNote).map(firstFilled);
}

export function findCol(columns, ...aliases) {
  const keys = columns.map(norm);
  for (const a of aliases) {
    const i = keys.indexOf(norm(a));
    if (i >= 0) return columns[i];
  }
  for (const a of aliases) {
    if (norm(a).length < 3) continue;
    const i = keys.findIndex((k) => k.includes(norm(a)));
    if (i >= 0) return columns[i];
  }
  return null;
}

// Converte linhas cruas em { columns, rows: [{ Coluna: valor }] }
export function extractTable(rows = [], headerTest) {
  const test = headerTest || ((cells) => cells.filter(Boolean).length >= 2);
  const h = rows.findIndex((r) => !isNote(r) && test(r.map(norm)));
  if (h < 0) return { columns: [], rows: [] };

  const seen = {};
  const cols = rows[h]
    .map((label, i) => ({ label: text(label), i }))
    .filter((c) => c.label)
    .map((c) => {
      // Cabeçalhos repetidos (ex.: "Gols" e "Gols") viram "Gols" e "Gols 2"
      const key = norm(c.label);
      seen[key] = (seen[key] || 0) + 1;
      return seen[key] > 1 ? { ...c, label: `${c.label} ${seen[key]}` } : c;
    });
  const headerKey = cols.map((c) => norm(c.label)).join("|");
  const headerVals = cols.map((c) => norm(rows[h][c.i]));
  const headerOverlapMin = Math.max(3, cols.length - 2);
  const out = [];
  let group = "";

  for (const row of rows.slice(h + 1)) {
    const n = filled(row);
    if (n === 0 || isNote(row)) continue;
    const rowVals = cols.map((c) => norm(row[c.i]));
    if (rowVals.join("|") === headerKey) continue;
    // Planilhas com seções (ex.: turno/returno) às vezes repetem o cabeçalho com 1-2 nomes de
    // coluna trocados (ex.: "Mandante"/"Visitante" -> "Jogador 1"/"Jogador 2"). Isso não é um
    // resultado de partida, então a linha é descartada em vez de virar uma linha de dados fantasma.
    if (rowVals.filter((v, i) => v && v === headerVals[i]).length >= headerOverlapMin) continue;
    if (n === 1 && GROUP_RE.test(firstFilled(row))) {
      group = firstFilled(row);
      continue;
    }
    if (n === 1) continue; // linha só com a 1ª célula preenchida: sobra de template, sem dado real
    const rec = { _group: group };
    for (const c of cols) rec[c.label] = text(row[c.i]);
    out.push(rec);
  }
  return { columns: cols.map((c) => c.label), rows: out };
}

/* ---------- Classificação ---------- */
export function parseStandings(sheets) {
  const sheet = findSheet(sheets, "classifica");
  if (!sheet) return null;

  const t = extractTable(sheet.rows, (c) => c.includes("participante") || (c.includes("pts") && c.includes("j")));
  const col = (...a) => findCol(t.columns, ...a);
  const k = {
    pos: col("pos.", "pos", "posicao", "#"),
    nome: col("participante", "jogador", "nome"),
    pts: col("pts", "pontos"),
    j: col("j", "jogos"),
    v: col("v", "vitorias"),
    e: col("e", "empates"),
    d: col("d", "derrotas"),
    sg: col("sg", "saldo", "saldo de gols"),
    sgAjust: col("sg ajust.", "sg ajust", "sg ajustado", "saldo ajustado"),
    gc: col("gc", "gols contra", "gols sofridos", "gs"),
    gm: col("gm", "gols marcados", "gp"),
    conf: col("confronto"),
  };
  if (!k.nome) return { rows: [], notes: sheetNotes(sheet.rows) };

  const get = (r, key) => (k[key] ? toNum(r[k[key]]) : null);
  const rows = t.rows
    .filter((r) => r[k.nome])
    .map((r, i) => {
      const { nome, tag } = splitName(r[k.nome]);
      const j = get(r, "j") ?? 0;
      const pts = get(r, "pts") ?? 0;
      return {
        full: r[k.nome],
        nome,
        tag,
        pos: get(r, "pos") ?? i + 1,
        pts,
        j,
        v: get(r, "v") ?? 0,
        e: get(r, "e") ?? 0,
        d: get(r, "d") ?? 0,
        sg: get(r, "sg") ?? 0,
        // null quando a planilha não tem a coluna; aí a tela calcula pelos jogos
        sgAjust: get(r, "sgAjust"),
        gc: get(r, "gc"),
        gm: get(r, "gm") ?? 0,
        conf: get(r, "conf"),
        aprov: j > 0 ? Math.round((pts / (j * 3)) * 100) : null,
      };
    });

  return { rows, notes: sheetNotes(sheet.rows) };
}

/* ---------- Jogos ---------- */
export function parseGames(sheets) {
  const sheet = findSheet(sheets, "jogos", "partidas", "confrontos");
  if (!sheet) return null;

  let t = extractTable(sheet.rows, (c) =>
    c.filter(Boolean).length >= 3 &&
    c.some((x) => /mandante|visitante|casa|fora|jogador|participante|placar|gols|rodada/.test(x))
  );
  if (!t.columns.length) t = extractTable(sheet.rows);

  const col = (...a) => findCol(t.columns, ...a);
  const people = t.columns.filter((c) => /jogador|participante|time|equipe/.test(norm(c)) && !/gol|clube/.test(norm(c)));
  const goals = t.columns.filter((c) => /gol/.test(norm(c)));

  const home = col("mandante", "casa", "jogador 1", "participante 1", "time 1", "jogador a", "time a") || people[0];
  const away = col("visitante", "fora", "jogador 2", "participante 2", "time 2", "jogador b", "time b") || people[1];
  if (!home || !away || home === away) return { generic: t };

  const clubs = t.columns.filter((c) => /clube|escala/.test(norm(c)));
  const homeClub = col("clube mandante", "clube casa", "clube 1", "clube a") || clubs[0];
  const awayClub = col("clube visitante", "clube fora", "clube 2", "clube b") || clubs[1];
  const legCol = col("turno", "returno");

  const hgCol = col("gols mandante", "gols casa", "gols 1", "gols a") || goals[0];
  const agCol = col("gols visitante", "gols fora", "gols 2", "gols b") || goals[1];
  const placar = col("placar", "resultado");
  const round = col("rodada", "fase", "grupo");
  const date = col("data");
  const hour = col("hora", "horario");
  const status = col("status", "situacao");

  const list = t.rows
    .filter((r) => r[home] && r[away])
    .map((r) => {
      let hg = hgCol && hgCol !== agCol ? toNum(r[hgCol]) : null;
      let ag = agCol && hgCol !== agCol ? toNum(r[agCol]) : null;
      if ((hg == null || ag == null) && placar) {
        const m = text(r[placar]).match(/(\d+)\s*[x×-]\s*(\d+)/i);
        if (m) [hg, ag] = [Number(m[1]), Number(m[2])];
      }
      const roundNum = round ? toNum(r[round]) : toNum((r._group.match(/\d+/) || [])[0]);
      // Regulamento: 9 rodadas no turno e 9 no returno
      const leg = legCol && r[legCol] ? r[legCol] : roundNum ? (roundNum <= 9 ? "Turno" : "Returno") : "";
      const st = status ? r[status] : "";
      return {
        leg,
        roundNum,
        wo: /w\.?\s?o\b|administrativ|irregular/i.test(st),
        homeClub: homeClub && homeClub !== awayClub ? r[homeClub] : "",
        awayClub: awayClub && homeClub !== awayClub ? r[awayClub] : "",
        round: round && r[round] ? (/^\d+$/.test(r[round]) ? `${round} ${r[round]}` : r[round]) : r._group || "",
        date: date ? r[date] : "",
        hour: hour ? r[hour] : "",
        status: st,
        home: r[home],
        away: r[away],
        hg,
        ag,
        played: hg != null && ag != null,
      };
    });

  return { list };
}

/* ---------- Champions e Europa League (mata-mata) ---------- */
// A aba tem várias tabelas lado a lado, então cada uma é localizada pela célula do cabeçalho
// (linha + coluna) em vez de pela linha inteira.
const CUP_ID_RE = /^[a-z]{1,3}\d+$/i;
// Jogos da chave, incluindo o de 3º lugar ("C3º")
const CUP_GAME_RE = /^[a-z]{1,3}\d+[º°o]?$/i;
const isThirdPlace = (phase) => /3\s*[º°o]?\s*lugar|terceiro/.test(norm(phase));
const ADMIN_NOTE_RE = /preencha|informe|revise|resolva|celulas amarelas/;

function findHeaders(rows, first, ...others) {
  const out = [];
  rows.forEach((row, r) => {
    row.forEach((cell, c) => {
      if (norm(cell) !== first) return;
      const cols = { [first]: c };
      for (let i = c + 1; i < Math.min(row.length, c + 14) && text(row[i]); i++) cols[norm(row[i])] = i;
      if (others.every((o) => o in cols)) out.push({ r, cols });
    });
  });
  return out;
}

function cupName(title) {
  const t = norm(title);
  if (t.includes("champions")) return { key: "champions", name: "Champions League" };
  if (t.includes("europa")) return { key: "europa", name: "Europa League" };
  return { key: t, name: text(title).split("—")[0].trim() };
}

export function parseCups(sheets) {
  const sheet = findSheet(sheets, "champions", "europa", "mata");
  if (!sheet) return null;
  const rows = sheet.rows;
  const cell = (r, c) => text(rows[r]?.[c]);

  // Cruzamentos: número positivo = posição no grupo, negativo = vencedor daquele jogo
  const origins = {};
  for (const { r, cols } of findHeaders(rows, "jogo", "origem a", "origem b")) {
    for (let i = r + 1; CUP_ID_RE.test(cell(i, cols.jogo)); i++) {
      origins[cell(i, cols.jogo)] = [toNum(cell(i, cols["origem a"])), toNum(cell(i, cols["origem b"]))];
    }
  }

  // Classificação do 1º turno, que define quem vai para cada copa
  const seeds = [];
  for (const { r, cols } of findHeaders(rows, "pos.", "participante", "competicao")) {
    for (let i = r + 1; cell(i, cols["pos."]); i++) {
      seeds.push({
        pos: toNum(cell(i, cols["pos."])),
        full: cell(i, cols.participante),
        pts: toNum(cell(i, cols.pts)),
        cup: cupName(cell(i, cols.competicao)).key,
      });
    }
  }
  const seedOf = (full) => seeds.find((s) => norm(s.full) === norm(full))?.pos ?? null;

  const headers = findHeaders(rows, "jogo", "fase", "jogador a", "jogador b");
  const cups = headers.map(({ r, cols }, h) => {
    const { key, name } = cupName(cell(r - 1, cols.jogo));
    // A chave vai até o título da próxima copa (o jogo de 3º lugar e o pódio ficam abaixo dos demais jogos)
    const end = headers[h + 1] ? headers[h + 1].r - 1 : rows.length;
    const games = [];
    const podium = { first: "", second: "", third: "" };
    for (let i = r + 1; i < end; i++) {
      const id = cell(i, cols.jogo);
      const label = norm(id);
      // Pódio: "1º — CAMPEÃO", "2º — VICE" e "3º LUGAR", com o nome na coluna de jogador. Só rótulos curtos,
      // para não confundir com notas como "3º lugar: jogo único entre..."
      const podiumKey =
        label.length > 20 ? null : /campe/.test(label) ? "first" : /vice/.test(label) ? "second" : /^3.*lugar/.test(label) ? "third" : null;
      if (podiumKey) {
        const v = cell(i, cols["jogador a"]) || text((rows[i] || []).slice(cols.jogo + 1, cols.jogo + 10).find((c) => text(c) !== ""));
        podium[podiumKey] = /a definir/i.test(v) ? "" : v;
        continue;
      }
      if (!CUP_GAME_RE.test(id)) continue;
      const get = (k) => (cols[k] != null ? cell(i, cols[k]) : "");
      const a = get("jogador a");
      const b = get("jogador b");
      const ga = toNum(get("gols a"));
      const gb = toNum(get("gols b"));
      const pa = toNum(get("pen. a"));
      const pb = toNum(get("pen. b"));
      const played = Boolean(a && b) && ga != null && gb != null;
      let winner = get("vencedor");
      if (!winner && played) {
        if (ga !== gb) winner = ga > gb ? a : b;
        else if (pa != null && pb != null && pa !== pb) winner = pa > pb ? a : b;
      }
      const loser = winner ? (norm(winner) === norm(a) ? b : a) : "";
      const phase = get("fase");
      games.push({ id, phase, third: isThirdPlace(phase), a, b, ga, gb, pa, pb, played, winner, loser, status: get("situacao"), origin: origins[id] || [] });
    }

    // O 3º lugar reúne os perdedores das semifinais, que são os jogos que alimentam a final
    const prefix = (games[0]?.id.match(/^[a-z]+/i) || [""])[0];
    const final = games.find((g) => !g.third && norm(g.phase) === "final");
    const third = games.find((g) => g.third);
    if (third && final) third.loserOf = final.origin.filter((o) => o < 0).map((o) => `${prefix}${-o}`);

    // Sem o pódio preenchido na planilha, usa os resultados da final e do 3º lugar
    const champion = podium.first || final?.winner || "";
    const vice = podium.second || final?.loser || "";
    const bronze = podium.third || third?.winner || "";

    for (const g of games) {
      g.seedA = seedOf(g.a);
      g.seedB = seedOf(g.b);
    }
    return { key, name, games, champion, vice, bronze, seeds: seeds.filter((s) => s.cup === key) };
  });

  // Avisos da coluna A para o público (as instruções de preenchimento ficam de fora)
  const notes = rows
    .map((row) => text(row[0]))
    .filter((t) => t.length > 40 && !ADMIN_NOTE_RE.test(norm(t)));

  return { cups, seeds, notes };
}
