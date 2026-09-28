import { Fragment, useState } from "react";
import { signed } from "../parsers.js";
import { REG, CRITERIOS_DESEMPATE } from "../regulamento.js";
import Empty from "./Empty.jsx";
import PlayerDetail from "./PlayerDetail.jsx";

const LEGEND = [
  ["Pts", "Pontos: vitória vale 3, empate vale 1 e derrota não pontua."],
  ["J", `Jogos disputados. Cada participante joga ${REG.jogosPorParticipante} no campeonato.`],
  ["V / E / D", "Vitórias, empates e derrotas."],
  ["SG", "Saldo de gols ajustado: cada partida conta no máximo +3 ou -3."],
  ["GM", "Gols marcados, pelo placar real."],
  ["%", "Aproveitamento: pontos conquistados sobre os pontos possíveis."],
];

const COLS = 10;

export default function Standings({ standings, games, onOpenRules }) {
  // Só um participante aberto por vez: abrir outro recolhe o anterior
  const [open, setOpen] = useState(null);
  if (!standings) return <Empty title="Aba de classificação não encontrada" text="A planilha precisa de uma aba com “Classificação” no nome." />;
  if (!standings.rows.length) return <Empty title="Classificação vazia" text="Cadastre os participantes na planilha para montar a tabela." />;

  const last = standings.rows[standings.rows.length - 1];

  return (
    <section>
      <h2 className="section-title">Classificação</h2>
      <p className="muted small intro">Toque em um participante para ver os jogos e os números dele.</p>

      <div className="table-wrap">
        <table className="standings">
          <thead>
            <tr>
              <th scope="col" className="num">Pos.</th>
              <th scope="col" className="left">Participante</th>
              <th scope="col" className="num" title="Pontos">Pts</th>
              <th scope="col" className="num" title={`Jogos (de ${REG.jogosPorParticipante})`}>J</th>
              <th scope="col" className="num" title="Vitórias">V</th>
              <th scope="col" className="num" title="Empates">E</th>
              <th scope="col" className="num" title="Derrotas">D</th>
              <th scope="col" className="num" title="Saldo de gols ajustado">SG</th>
              <th scope="col" className="num opt" title="Gols marcados">GM</th>
              <th scope="col" className="num opt" title="Aproveitamento">%</th>
            </tr>
          </thead>
          <tbody>
            {standings.rows.map((p) => {
              const isLast = p === last && standings.rows.length > 1;
              const key = p.full;
              const isOpen = open === key;
              const detailId = `detalhe-${p.pos}`;
              const toggle = () => setOpen(isOpen ? null : key);
              return (
                <Fragment key={`${p.pos}-${p.full}`}>
                <tr
                  className={`row-toggle ${p.pos === 1 ? "is-leader" : isLast ? "is-last" : ""} ${isOpen ? "is-open" : ""}`}
                  onClick={toggle}
                >
                  <td className="num rank">{p.pos}</td>
                  <th scope="row" className="left player">
                    <button
                      type="button"
                      className="player-name player-toggle"
                      aria-expanded={isOpen}
                      aria-controls={detailId}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggle();
                      }}
                    >
                      <span className="chevron" aria-hidden="true">›</span>
                      {p.nome}
                      {isLast && <span className="lantern" title="Hoje, o último colocado ganharia o Coringa da Lanterna na 2ª edição">Lanterna</span>}
                    </button>
                    {p.tag && <span className="player-sub">{p.tag}</span>}
                  </th>
                  <td className="num pts">{p.pts}</td>
                  <td className="num">{p.j}</td>
                  <td className="num">{p.v}</td>
                  <td className="num">{p.e}</td>
                  <td className="num">{p.d}</td>
                  <td className={`num ${p.sg > 0 ? "up" : p.sg < 0 ? "down" : ""}`}>{signed(p.sg)}</td>
                  <td className="num opt">{p.gm}</td>
                  <td className="num opt">{p.aprov == null ? "–" : p.aprov}</td>
                </tr>
                {isOpen && (
                  <tr className="detail-row" id={detailId}>
                    <td colSpan={COLS}>
                      <PlayerDetail p={p} games={games} />
                    </td>
                  </tr>
                )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="explain">
        <h3>Como ler a tabela</h3>
        <dl className="legend">
          {LEGEND.map(([term, desc]) => (
            <div key={term}>
              <dt>{term}</dt>
              <dd>{desc}</dd>
            </div>
          ))}
        </dl>

        <h3>Ordem de desempate</h3>
        <ol className="criteria">
          {CRITERIOS_DESEMPATE.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ol>
        <p className="note">
          No saldo ajustado, uma vitória por 7 x 0 continua 7 x 0 no placar, mas conta +3 para o vencedor e -3 para o
          derrotado na classificação.
        </p>
        <button className="link" onClick={() => onOpenRules("pontuacao")}>Ver o regulamento completo</button>
      </div>
    </section>
  );
}
