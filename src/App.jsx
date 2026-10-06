import { useMemo, useState } from "react";
import { useSheet, REFRESH_MS } from "./useSheet.js";
import { parseStandings, parseGames, parseCups } from "./parsers.js";
import Scoreboard from "./components/Scoreboard.jsx";
import Standings from "./components/Standings.jsx";
import Games from "./components/Games.jsx";
import Cups from "./components/Cups.jsx";
import Empty from "./components/Empty.jsx";
import Rules from "./components/Rules.jsx";

const TABS = [
  { id: "classificacao", label: "Classificação" },
  { id: "jogos", label: "Jogos" },
  { id: "mata-mata", label: "Mata-mata" },
  { id: "regras", label: "Regras" },
];

export default function App() {
  const { sheets, error, loading, updatedAt, reload } = useSheet();
  const [tab, setTab] = useState("classificacao");
  const [ruleTarget, setRuleTarget] = useState(null);

  // Abre a aba Regras já na seção indicada
  const openRules = (sectionId) => {
    setRuleTarget(sectionId || null);
    setTab("regras");
  };

  const data = useMemo(() => {
    if (!sheets) return null;
    return {
      standings: parseStandings(sheets),
      games: parseGames(sheets),
      cups: parseCups(sheets),
    };
  }, [sheets]);

  return (
    <div className="page">
      <Scoreboard
        leader={data?.standings?.rows?.[0]}
        standings={data?.standings}
        games={data?.games}
        updatedAt={updatedAt}
        loading={loading}
        hasError={Boolean(error)}
        onRefresh={reload}
        refreshSeconds={REFRESH_MS / 1000}
      />

      {error && (
        <p className="alert" role="alert">
          {error}
          {data && " Mostrando os últimos dados carregados."}
        </p>
      )}

      <nav className="tabs" role="tablist" aria-label="Seções do campeonato">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            className="tab"
            onClick={() => {
              setRuleTarget(null);
              setTab(t.id);
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="panel">
        {tab === "regras" && <Rules target={ruleTarget} />}
        {tab !== "regras" && !data && loading && <p className="muted">Carregando a planilha…</p>}
        {tab !== "regras" && !data && !loading && <Empty title="Sem dados ainda" text="Assim que a planilha responder, o campeonato aparece aqui." />}

        {data && tab === "classificacao" && <Standings standings={data.standings} games={data.games} cups={data.cups} onOpenRules={openRules} />}
        {data && tab === "jogos" && <Games games={data.games} onOpenRules={openRules} />}
        {data && tab === "mata-mata" && <Cups cups={data.cups} onOpenRules={openRules} />}
      </main>

      <footer className="footer">
        <p className="motto">Amigos, resenha e diversão</p>
        Dados lidos da planilha oficial da Liga Soriano. A página se atualiza sozinha a cada {REFRESH_MS / 1000} segundos.
      </footer>
    </div>
  );
}
