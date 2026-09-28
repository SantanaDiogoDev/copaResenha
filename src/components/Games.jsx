import { useEffect, useMemo, useState } from "react";
import { REG } from "../regulamento.js";
import DataTable from "./DataTable.jsx";
import Empty from "./Empty.jsx";

function Side({ name, club, won, className }) {
  return (
    <span className={`side ${className} ${won ? "won" : ""}`}>
      {name}
      {club && <span className="side-club">{club}</span>}
    </span>
  );
}

export function Match({ m }) {
  const homeWon = m.played && m.hg > m.ag;
  const awayWon = m.played && m.ag > m.hg;
  const when = [m.date, m.hour].filter(Boolean).join(", ");
  const meta = [when, m.wo ? m.status || "W.O." : !m.played && m.status].filter(Boolean).join(", ");

  return (
    <li className="match">
      <Side name={m.home} club={m.homeClub} won={homeWon} className="home" />
      <span className={`score ${m.played ? "" : "pending"}`} aria-label={m.played ? `${m.hg} a ${m.ag}` : "a disputar"}>
        {m.played ? (
          <>
            {m.hg}
            <span className="x">x</span>
            {m.ag}
          </>
        ) : (
          "x"
        )}
      </span>
      <Side name={m.away} club={m.awayClub} won={awayWon} className="away" />
      {meta && <span className={`meta ${m.wo ? "meta-wo" : ""}`}>{meta}</span>}
    </li>
  );
}

// Agrupa por rodada dentro do turno/returno (a numeração da planilha segue direto de 1 a 18;
// aqui volta a contar de 1 no returno, que é como o regulamento chama as rodadas)
function pageKey(g) {
  return g.roundNum ? `${g.leg || ""}#${g.roundNum}` : g.round || "sem-rodada";
}

export function pageLabel(g) {
  if (g.roundNum) {
    const inLeg = g.roundNum > REG.jogosPorTurno ? g.roundNum - REG.jogosPorTurno : g.roundNum;
    return g.leg ? `Rodada ${inLeg} · ${g.leg}` : `Rodada ${inLeg}`;
  }
  return g.round || "Jogos";
}

function buildPages(list) {
  const map = new Map();
  for (const g of list) {
    const key = pageKey(g);
    if (!map.has(key)) map.set(key, { key, label: pageLabel(g), games: [] });
    map.get(key).games.push(g);
  }
  return [...map.values()];
}

function RoundPager({ list, onOpenRules }) {
  const pages = useMemo(() => buildPages(list), [list]);
  const [page, setPage] = useState(0);
  const [ready, setReady] = useState(false);

  // Na primeira carga, pula direto para a rodada em andamento (a 1ª com jogo pendente)
  useEffect(() => {
    if (ready || !pages.length) return;
    const i = pages.findIndex((p) => p.games.some((g) => !g.played));
    setPage(i >= 0 ? i : pages.length - 1);
    setReady(true);
  }, [pages, ready]);

  if (!pages.length) return <p className="muted">Nenhum jogo cadastrado ainda.</p>;

  const index = Math.min(page, pages.length - 1);
  const current = pages[index];
  const goto = (i) => setPage(Math.max(0, Math.min(pages.length - 1, i)));

  return (
    <>
      <p className="muted small intro">
        Cada participante enfrenta todos os outros duas vezes. No returno o jogo é espelhado: os clubes usados na ida
        são trocados entre os dois jogadores.{" "}
        <button className="link" onClick={() => onOpenRules("espelhado")}>Entenda o jogo espelhado</button>
      </p>

      <div className="pager">
        <button className="refresh" onClick={() => goto(index - 1)} disabled={index === 0} aria-label="Rodada anterior">
          ‹ Anterior
        </button>
        <select
          className="pager-select"
          value={current.key}
          onChange={(e) => goto(pages.findIndex((p) => p.key === e.target.value))}
          aria-label="Ir para rodada"
        >
          {pages.map((p) => (
            <option key={p.key} value={p.key}>{p.label}</option>
          ))}
        </select>
        <button className="refresh" onClick={() => goto(index + 1)} disabled={index === pages.length - 1} aria-label="Próxima rodada">
          Próxima ›
        </button>
      </div>

      <h3 className="round-title pager-title">{current.label}</h3>
      <ul className="matches">
        {current.games.map((m, i) => (
          <Match key={`${m.home}-${m.away}-${i}`} m={m} />
        ))}
      </ul>
    </>
  );
}

export default function Games({ games, onOpenRules }) {
  if (!games) return <Empty title="Aba de jogos não encontrada" text="A planilha precisa de uma aba com “Jogos” no nome." />;
  if (games.generic) return <DataTable title="Jogos" table={games.generic} missing="Jogos" />;

  return (
    <section>
      <h2 className="section-title">Jogos</h2>
      <RoundPager list={games.list} onOpenRules={onOpenRules} />
    </section>
  );
}
