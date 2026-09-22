import { useMemo, useState } from "react";
import { useSheet, REFRESH_MS } from "./useSheet.js";
import { parseStandings, parseGames, parseGenericSheet } from "./parsers.js";
import Scoreboard from "./components/Scoreboard.jsx";
import Standings from "./components/Standings.jsx";
import Games from "./components/Games.jsx";
import DataTable from "./components/DataTable.jsx";
import Empty from "./components/Empty.jsx";
import Rules from "./components/Rules.jsx";

const TABS = [
  { id: "classificacao", label: "Classificação" },
  { id: "jogos", label: "Jogos" },
  { id: "participantes", label: "Participantes" },
  { id: "clubes", label: "Clubes" },
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
      participants: parseGenericSheet(sheets, "participantes"),
      clubs: parseGenericSheet(sheets, "clubes"),
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

        {data && tab === "classificacao" && <Standings standings={data.standings} onOpenRules={openRules} />}
        {data && tab === "jogos" && <Games games={data.games} onOpenRules={openRules} />}
        {data && tab === "participantes" && (
          <DataTable title="Participantes" table={data.participants} missing="Participantes" />
        )}
        {data && tab === "clubes" && <DataTable title="Clubes" table={data.clubs} missing="Clubes" />}
      </main>

      <footer className="footer">
        <p className="motto">Amigos, resenha e diversão</p>
        Dados lidos da planilha oficial da Liga Soriano. A página se atualiza sozinha a cada {REFRESH_MS / 1000} segundos.
      </footer>
    </div>
  );
}
