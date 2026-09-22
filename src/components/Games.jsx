import DataTable from "./DataTable.jsx";
import Empty from "./Empty.jsx";

function groupByRound(list) {
  const map = new Map();
  list.forEach((g) => {
    const legLabel = g.leg && !g.round.toLowerCase().includes(g.leg.toLowerCase()) ? g.leg.toLowerCase() : "";
    const key = [g.round, legLabel].filter(Boolean).join(", ");
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(g);
  });
  return [...map.entries()];
}

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

function MatchList({ list }) {
  return groupByRound(list).map(([round, games]) => (
    <div className="round" key={round || "sem-rodada"}>
      {round && <h4 className="round-title">{round}</h4>}
      <ul className="matches">
        {games.map((m, i) => (
          <Match key={`${m.home}-${m.away}-${i}`} m={m} />
        ))}
      </ul>
    </div>
  ));
}

export default function Games({ games, onOpenRules }) {
  if (!games) return <Empty title="Aba de jogos não encontrada" text="A planilha precisa de uma aba com “Jogos” no nome." />;
  if (games.generic) return <DataTable title="Jogos" table={games.generic} missing="Jogos" />;

  const upcoming = games.list.filter((g) => !g.played);
  const results = games.list.filter((g) => g.played).reverse();

  return (
    <section>
      <h2 className="section-title">Jogos</h2>
      <p className="muted small intro">
        Cada participante enfrenta todos os outros duas vezes. No returno o jogo é espelhado: os clubes usados na ida
        são trocados entre os dois jogadores.{" "}
        <button className="link" onClick={() => onOpenRules("espelhado")}>Entenda o jogo espelhado</button>
      </p>

      <h3 className="sub-title">Próximos jogos</h3>
      {upcoming.length ? (
        <MatchList list={upcoming} />
      ) : (
        <p className="muted">Todos os jogos cadastrados já foram disputados.</p>
      )}

      <h3 className="sub-title">Resultados</h3>
      {results.length ? (
        <MatchList list={results} />
      ) : (
        <p className="muted">Nenhum resultado lançado ainda.</p>
      )}
    </section>
  );
}
