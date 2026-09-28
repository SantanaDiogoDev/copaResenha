import { norm, signed, splitName } from "../parsers.js";
import { REG } from "../regulamento.js";
import { pageLabel } from "./Games.jsx";

// Na aba Jogos o nome pode vir com ou sem o apelido entre parênteses. Quando os dois lados têm
// apelido, ele decide (há participantes com o mesmo primeiro nome, ex.: dois Gustavos)
function isPlayer(name, p) {
  const { nome, tag } = splitName(name);
  if (tag && p.tag) return norm(tag) === norm(p.tag);
  return norm(nome) === norm(p.nome);
}

// Jogos do participante, sempre do ponto de vista dele (gols dele primeiro)
export function playerGames(p, list = []) {
  return list
    .filter((g) => isPlayer(g.home, p) || isPlayer(g.away, p))
    .map((g) => {
      const home = isPlayer(g.home, p);
      const gf = home ? g.hg : g.ag;
      const ga = home ? g.ag : g.hg;
      return {
        ...g,
        isHome: home,
        opponent: home ? g.away : g.home,
        club: home ? g.homeClub : g.awayClub,
        oppClub: home ? g.awayClub : g.homeClub,
        gf,
        ga,
        result: !g.played ? null : gf > ga ? "V" : gf < ga ? "D" : "E",
      };
    });
}

const cap = (n) => Math.max(-REG.limiteSaldoPorPartida, Math.min(REG.limiteSaldoPorPartida, n));
const RESULT_LABEL = { V: "Vitória", E: "Empate", D: "Derrota" };

export default function PlayerDetail({ p, games }) {
  if (!games?.list) {
    return <p className="muted small">Os jogos aparecem aqui quando a planilha tiver a aba “Jogos”.</p>;
  }

  const all = playerGames(p, games.list);
  const played = all.filter((g) => g.played);
  const gm = played.reduce((s, g) => s + g.gf, 0);
  const gs = played.reduce((s, g) => s + g.ga, 0);
  const sgAjust = played.reduce((s, g) => s + cap(g.gf - g.ga), 0);
  const remaining = Math.max(0, REG.jogosPorParticipante - played.length);

  const stats = [
    ["Gols feitos", gm, ""],
    ["Gols sofridos", gs, ""],
    ["Saldo real", signed(gm - gs), gm - gs],
    ["Saldo ajustado", signed(sgAjust), sgAjust],
    ["Média de gols", played.length ? (gm / played.length).toFixed(1).replace(".", ",") : "–", ""],
    ["Jogos restantes", remaining, ""],
  ];

  return (
    <div className="player-detail">
      <dl className="pd-stats">
        {stats.map(([label, value, sign]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd className={sign > 0 ? "up" : sign < 0 ? "down" : ""}>{value}</dd>
          </div>
        ))}
      </dl>

      {played.length ? (
        <>
          <h4 className="pd-title">Jogos disputados ({played.length})</h4>
          <ul className="pd-games">
            {played.map((g, i) => (
              <li key={`${g.home}-${g.away}-${i}`} className="pd-game">
                <span className={`pd-badge pd-${g.result}`} title={RESULT_LABEL[g.result]}>{g.result}</span>
                <span className="pd-score" aria-label={`${g.gf} a ${g.ga}`}>
                  {g.gf}<span className="x">x</span>{g.ga}
                </span>
                <span className="pd-opp">
                  <span className="pd-vs">vs</span> {g.opponent}
                  {(g.club || g.oppClub) && (
                    <span className="pd-clubs">{[g.club, g.oppClub].filter(Boolean).join(" x ")}</span>
                  )}
                </span>
                <span className="pd-round">
                  {pageLabel(g)} · {g.isHome ? "Mandante" : "Visitante"}
                  {g.wo && <span className="meta-wo"> · {g.status || "W.O."}</span>}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="muted small">Ainda não disputou nenhum jogo.</p>
      )}
    </div>
  );
}
