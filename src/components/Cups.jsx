import { norm, splitName } from "../parsers.js";
import Empty from "./Empty.jsx";

// "Informe o placar" é instrução para quem preenche a planilha; no site vira "A disputar"
const statusLabel = (s) => (/informe o placar/i.test(s) ? "A disputar" : s);

function Slot({ name, seed, goals, pen, won, lost, placeholder }) {
  const { nome, tag } = splitName(name);
  return (
    <div className={`cm-row ${won ? "won" : ""} ${lost ? "lost" : ""}`}>
      <span className="cm-seed">{seed ? `${seed}º` : ""}</span>
      <span className="cm-name" title={name || undefined}>
        {name ? (
          <>
            {nome}
            {tag && <span className="cm-tag">{tag}</span>}
          </>
        ) : (
          <span className="cm-tbd">{placeholder}</span>
        )}
      </span>
      {pen != null && <span className="cm-pen" title="Pênaltis">({pen})</span>}
      <span className="cm-goals">{goals ?? ""}</span>
    </div>
  );
}

function placeholder(g, side, cup) {
  if (g.loserOf?.[side]) return `Perdedor ${g.loserOf[side]}`;
  const origin = g.origin[side];
  if (origin == null) return "A definir";
  if (origin < 0) return `Vencedor ${(cup.games[0]?.id.match(/^[a-z]+/i) || [""])[0]}${-origin}`;
  return `${origin}º do grupo`;
}

function CupMatch({ g, cup }) {
  const aWon = g.winner && norm(g.winner) === norm(g.a);
  const bWon = g.winner && norm(g.winner) === norm(g.b);
  const pens = g.played && g.ga === g.gb && g.pa != null && g.pb != null;
  return (
    <div className="cup-match">
      <div className="cm-head">
        <span className="cm-id">{g.id}</span>
        <span className="cm-status">{g.played ? "Encerrado" : statusLabel(g.status)}</span>
      </div>
      <Slot name={g.a} seed={g.seedA} goals={g.ga} pen={pens ? g.pa : null} won={aWon} lost={bWon} placeholder={placeholder(g, 0, cup)} />
      <Slot name={g.b} seed={g.seedB} goals={g.gb} pen={pens ? g.pb : null} won={bWon} lost={aWon} placeholder={placeholder(g, 1, cup)} />
    </div>
  );
}

function Bracket({ cup }) {
  // Uma coluna por fase, na ordem em que aparecem na planilha (Preliminar → Semifinal → Final)
  // O jogo de 3º lugar não entra nas colunas: fica embaixo da final
  const phases = [];
  const third = cup.games.find((g) => g.third);
  for (const g of cup.games.filter((x) => !x.third)) {
    let ph = phases.find((p) => p.name === g.phase);
    if (!ph) phases.push((ph = { name: g.phase, games: [] }));
    ph.games.push(g);
  }
  const podium = [
    { place: "1º", label: "1º · Campeão", name: cup.champion, icon: "🏆", cls: "gold" },
    { place: "2º", label: "2º · Vice", name: cup.vice, icon: "🥈", cls: "silver" },
    { place: "3º", label: "3º lugar", name: cup.bronze, icon: "🥉", cls: "bronze" },
  ];

  // Um jogo de fase com menos confrontos (ex.: preliminar) fica na altura do jogo que o vencedor
  // vai disputar; as demais posições da coluna ficam vazias
  const prefix = (cup.games[0]?.id.match(/^[a-z]+/i) || [""])[0];
  const slotsOf = (ph, pi) => {
    const next = phases[pi + 1];
    if (!next || ph.games.length >= next.games.length) return ph.games;
    const slots = Array(next.games.length).fill(null);
    for (const g of ph.games) {
      const k = next.games.findIndex((n) => n.origin.some((o) => o < 0 && `${prefix}${-o}` === g.id));
      if (k < 0 || slots[k]) return ph.games;
      slots[k] = g;
    }
    return slots;
  };

  return (
    <article className={`cup cup-${cup.key}`}>
      <header className="cup-head">
        <h3 className="cup-title">{cup.name}</h3>
        {cup.seeds.length > 0 && (
          <p className="cup-seeds">
            {cup.seeds.map((s) => (
              <span key={s.full} className="cup-chip">
                <b>{s.pos}º</b> {splitName(s.full).nome}
                {splitName(s.full).tag && <span className="cm-tag">{splitName(s.full).tag}</span>}
              </span>
            ))}
          </p>
        )}
      </header>

      <div className="bracket" style={{ "--cols": phases.length + 1 }}>
        {phases.map((ph, pi) => (
          <div key={ph.name} className="bracket-col">
            <h4 className="bracket-phase">{ph.name}</h4>
            <div className="bracket-games">
              {slotsOf(ph, pi).map((g, i) => (
                <div key={g ? g.id : `vazio-${i}`} className={`bracket-slot ${g ? "" : "is-empty"}`}>
                  {g && <CupMatch g={g} cup={cup} />}
                </div>
              ))}
            </div>
          </div>
        ))}
        {/* Linha de baixo, na coluna da final: assim a final continua centralizada entre as semifinais */}
        {third && (
          <div className="bracket-third" style={{ "--col": phases.length }}>
            <h4 className="bracket-phase">{third.phase || "3º lugar"}</h4>
            <CupMatch g={third} cup={cup} />
          </div>
        )}
        <div className="bracket-col bracket-champ">
          <h4 className="bracket-phase">Pódio</h4>
          <ol className="podium">
            {podium.map((p) => {
              const { nome, tag } = splitName(p.name);
              return (
                <li key={p.place} className={`podium-card ${p.cls} ${p.name ? "" : "tbd"}`}>
                  <span className="podium-icon" aria-hidden="true">{p.icon}</span>
                  <span className="podium-label">{p.label}</span>
                  <span className="podium-name">
                    {p.name ? nome : "A definir"}
                    {p.name && tag && <span className="cm-tag">{tag}</span>}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </article>
  );
}

export default function Cups({ cups, onOpenRules }) {
  if (!cups) return <Empty title="Aba do mata-mata não encontrada" text="A planilha precisa de uma aba com “Champions” ou “Europa” no nome." />;
  if (!cups.cups.length) return <Empty title="Chaves ainda não montadas" text="As chaves aparecem aqui quando a aba do mata-mata estiver preenchida." />;

  const [status, ...notes] = cups.notes;

  return (
    <section>
      <h2 className="section-title">Champions e Europa League</h2>
      <p className="muted small intro">
        Mata-mata em jogo único. Os 5 primeiros da classificação ao fim do 1º turno disputam a Champions League e os 5
        últimos, a Europa League. Os dois piores de cada grupo fazem a preliminar, e os perdedores das semifinais
        decidem o 3º lugar. Cada jogador escolhe 1 clube entre os que já usa no campeonato e vai com ele o mata-mata
        todo.{" "}
        <button className="link" onClick={() => onOpenRules("mata-mata")}>Ver as regras do mata-mata</button>
      </p>
      {status && <p className="cup-status">{status}</p>}

      {cups.cups.map((c) => (
        <Bracket key={c.key} cup={c} />
      ))}

      {notes.length > 0 && (
        <div className="explain">
          <h3>Como funciona</h3>
          {notes.map((n) => (
            <p key={n} className="note">{n}</p>
          ))}
        </div>
      )}
    </section>
  );
}
