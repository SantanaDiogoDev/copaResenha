import { REG } from "../regulamento.js";

export default function Scoreboard({ leader, standings, games, updatedAt, loading, hasError, onRefresh, refreshSeconds }) {
  // Com a aba Jogos usa os resultados lançados; sem ela, estima pela soma de jogos da classificação
  const played = games?.list
    ? games.list.filter((g) => g.played).length
    : standings?.rows
    ? Math.round(standings.rows.reduce((sum, p) => sum + p.j, 0) / 2)
    : 0;
  const total = Math.max(REG.totalPartidas, games?.list?.length || 0);
  const time = updatedAt?.toLocaleTimeString("pt-BR");

  return (
    <header className="scoreboard">
      <div className="board-top">
        <div className="brand">
          <img className="logo" src="/logo.png" alt="Escudo da Liga Soriano" width="224" height="224" />
          <h1 className="title">Liga Soriano</h1>
        </div>
        <div className="live">
          <span className={`dot ${hasError ? "dot-off" : ""}`} aria-hidden="true" />
          <span>
            {loading && !updatedAt ? "Conectando à planilha" : time ? `Atualizado às ${time}` : "Sem conexão"}
          </span>
          <button className="refresh" onClick={onRefresh} title={`Atualiza sozinho a cada ${refreshSeconds}s`}>
            Atualizar agora
          </button>
        </div>
      </div>

      {leader && (
        <div className="leader">
          <div className="leader-who">
            <p className="leader-label">Líder</p>
            <p className="leader-name">{leader.nome}</p>
            {leader.tag && <p className="leader-sub">{leader.tag}</p>}
          </div>
          <div className="leader-stats">
            <p className="big" aria-label={`${leader.pts} pontos`}>
              {leader.pts}
              <span>pts</span>
            </p>
            <p className="leader-sub">
              {leader.v} {leader.v === 1 ? "vitória" : "vitórias"} em {leader.j} {leader.j === 1 ? "jogo" : "jogos"}
            </p>
          </div>
          {leader && (
            <div className="progress" aria-label={`${played} de ${total} partidas disputadas`}>
              <div className="progress-bar" style={{ width: `${(played / total) * 100}%` }} />
              <p>
                {played} de {total} partidas disputadas
              </p>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
