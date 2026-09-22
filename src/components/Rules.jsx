import { useEffect, useState } from "react";
import { REG, CRITERIOS_DESEMPATE } from "../regulamento.js";
import { Match } from "./Games.jsx";

const SECTIONS = [
  ["formato", "Formato"],
  ["clubes", "Escolha dos clubes"],
  ["espelhado", "Jogo espelhado"],
  ["pontuacao", "Pontuação e desempate"],
  ["desconexao", "Desconexões"],
  ["conduta", "W.O. e conduta"],
  ["coringa", "Coringa da Lanterna"],
];

/* ---------- Calculadora de queda de conexão ---------- */
const parseClock = (value) => {
  const m = value.trim().match(/^(\d{1,2})(?::(\d{1,2}))?$/);
  if (!m) return null;
  const sec = m[2] ? Number(m[2]) : 0;
  const total = Number(m[1]) * 60 + sec;
  return sec > 59 || total > 90 * 60 ? null : total;
};
const fmt = (t) => `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
const n = (v) => Math.max(0, Number(v) || 0);

function DisconnectCalculator() {
  const [clock, setClock] = useState("63:40");
  const [g, setG] = useState({ h: 2, a: 1, ch: 1, ca: 1 });
  const [redCard, setRedCard] = useState(false);
  const t = parseClock(clock);
  const set = (key) => (e) => setG({ ...g, [key]: e.target.value });

  let result;
  if (t == null) {
    result = <p>Informe o minuto da queda no formato mm:ss, entre 00:00 e 90:00.</p>;
  } else if (t < 600 && n(g.h) === 0 && n(g.a) === 0 && !redCard) {
    result = <p><strong>Reiniciem a partida do zero</strong>, com os mesmos clubes. A queda foi antes de 10:00, com 0 x 0 e sem expulsões.</p>;
  } else if (t === 90 * 60) {
    result = <p>O tempo já tinha acabado. Vale o placar da queda: <strong>{n(g.h)} x {n(g.a)}</strong>.</p>;
  } else {
    const rest = 90 * 60 - t;
    result = (
      <>
        <p>
          Joguem uma nova partida de <strong>{fmt(rest)}</strong>, com os mesmos clubes. Ela termina na primeira
          paralisação depois de {fmt(rest)} no relógio.
          {redCard && " Antes de começar, recriem a expulsão; o tempo de preparação não conta."}
        </p>
        <div className="calc-row">
          <span>Placar do complemento</span>
          <input type="number" min="0" value={g.ch} onChange={set("ch")} aria-label="Gols do mandante no complemento" />
          <span className="x">x</span>
          <input type="number" min="0" value={g.ca} onChange={set("ca")} aria-label="Gols do visitante no complemento" />
        </div>
        <p className="calc-final">
          Resultado oficial: <strong>{n(g.h) + n(g.ch)} x {n(g.a) + n(g.ca)}</strong>
        </p>
      </>
    );
  }

  return (
    <div className="calc">
      <h4>Calcule o complemento</h4>
      <div className="calc-row">
        <label htmlFor="calc-clock">Minuto da queda</label>
        <input id="calc-clock" className="clock" inputMode="numeric" value={clock} onChange={(e) => setClock(e.target.value)} placeholder="mm:ss" />
      </div>
      <div className="calc-row">
        <span>Placar na queda</span>
        <input type="number" min="0" value={g.h} onChange={set("h")} aria-label="Gols do mandante na queda" />
        <span className="x">x</span>
        <input type="number" min="0" value={g.a} onChange={set("a")} aria-label="Gols do visitante na queda" />
      </div>
      <label className="calc-check">
        <input type="checkbox" checked={redCard} onChange={(e) => setRedCard(e.target.checked)} />
        Houve expulsão antes da queda
      </label>
      <div className="calc-result" aria-live="polite">{result}</div>
    </div>
  );
}

/* ---------- Aba Regras ---------- */
export default function Rules({ target }) {
  useEffect(() => {
    if (target) document.getElementById(`regra-${target}`)?.scrollIntoView({ block: "start" });
  }, [target]);

  const go = (id) => document.getElementById(`regra-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <section className="rules">
      <h2 className="section-title">Regras da Liga Soriano</h2>
      <p className="lead">
        Resumo do regulamento oficial da 1ª edição. O campeonato é competitivo, mas a proposta continua sendo jogar
        entre amigos com regras claras e justas.
      </p>

      <dl className="facts">
        <div><dt>{REG.participantes}</dt><dd>participantes</dd></div>
        <div><dt>{REG.jogosPorParticipante}</dt><dd>jogos para cada um</dd></div>
        <div><dt>{REG.totalPartidas}</dt><dd>partidas no total</dd></div>
        <div><dt>{REG.estrelasMax}★</dt><dd>limite dos clubes</dd></div>
      </dl>

      <nav className="rules-index" aria-label="Seções das regras">
        {SECTIONS.map(([id, label]) => (
          <button key={id} className="chip" onClick={() => go(id)}>{label}</button>
        ))}
      </nav>

      <article id="regra-formato" className="rule">
        <h3>Formato</h3>
        <p>
          Pontos corridos em turno e returno: cada participante enfrenta todos os outros duas vezes. A classificação
          final é definida só pela tabela, sem mata-mata. As partidas podem ser jogadas em PS5, Xbox Series X|S e PC,
          com crossplay, e todos precisam estar aptos a usá-lo.
        </p>
      </article>

      <article id="regra-clubes" className="rule">
        <h3>Escolha dos clubes</h3>
        <p>
          Cada jogador cadastra <strong>9 clubes diferentes</strong> antes do campeonato, um para cada adversário do
          primeiro turno. Qual clube será usado contra quem também fica registrado antes do início.
        </p>
        <ul className="rule-list">
          <li>Valem apenas clubes masculinos reais de até 4 estrelas.</li>
          <li>Clubes de 4,5 e 5 estrelas são proibidos, exceto pelo Coringa da Lanterna.</li>
          <li>Seleções, equipes especiais e elencos personalizados não são permitidos.</li>
        </ul>
        <p className="callout callout-warn">
          <strong>Uso irregular:</strong> quem entrar em campo com clube acima de 4 estrelas sem direito ao coringa perde
          por <strong>3 x 0</strong>, mesmo que tenha vencido dentro do jogo.
        </p>
      </article>

      <article id="regra-espelhado" className="rule">
        <h3>Jogo espelhado</h3>
        <p>No returno, os dois jogadores trocam os clubes que usaram no turno.</p>
        <h4 className="round-title">Turno</h4>
        <ul className="matches">
          <Match m={{ home: "Jogador A", away: "Jogador B", homeClub: "River Plate", awayClub: "Valencia" }} />
        </ul>
        <h4 className="round-title">Returno</h4>
        <ul className="matches">
          <Match m={{ home: "Jogador A", away: "Jogador B", homeClub: "Valencia", awayClub: "River Plate" }} />
        </ul>
        <p className="muted small">A única exceção é o confronto com o Coringa da Lanterna.</p>
      </article>

      <article id="regra-pontuacao" className="rule">
        <h3>Pontuação e desempate</h3>
        <p>Vitória vale 3 pontos, empate vale 1 para cada jogador e derrota não pontua. Em caso de igualdade, a ordem é:</p>
        <ol className="criteria">
          {CRITERIOS_DESEMPATE.map((c) => <li key={c}>{c}</li>)}
        </ol>
        <p>
          <strong>Saldo de gols ajustado:</strong> para a classificação, o saldo de cada partida fica limitado a +
          {REG.limiteSaldoPorPartida} ou -{REG.limiteSaldoPorPartida}. O placar real continua valendo normalmente.
        </p>
        <div className="example">
          <div><span className="example-label">Placar real</span><span className="example-score">7 x 0</span></div>
          <div><span className="example-label">No saldo da tabela</span><span className="example-score"><span className="up">+3</span> e <span className="down">-3</span></span></div>
        </div>
      </article>

      <article id="regra-desconexao" className="rule">
        <h3>Desconexões durante a partida</h3>
        <p className="callout">
          <strong>Regra central:</strong> a desconexão não apaga o que já aconteceu. O placar permanece e só o tempo
          que faltava é disputado.
        </p>
        <div className="table-wrap">
          <table className="data rules-table">
            <thead>
              <tr><th scope="col" className="left">Situação</th><th scope="col" className="left">O que fazer</th></tr>
            </thead>
            <tbody>
              <tr><th scope="row" className="left">Queda antes de 10:00, com 0 x 0 e sem expulsões</th><td className="left">Reiniciar do zero, com os mesmos clubes.</td></tr>
              <tr><th scope="row" className="left">Qualquer outra queda</th><td className="left">Manter o placar e jogar só o tempo restante.</td></tr>
              <tr><th scope="row" className="left">Saída intencional ou recusa em continuar</th><td className="left">W.O. de 3 x 0, ou o placar atual se for pior para quem saiu.</td></tr>
            </tbody>
          </table>
        </div>

        <p>
          O tempo restante é 90:00 menos o minuto da queda. A nova partida termina na primeira paralisação depois desse
          tempo, e o resultado oficial é o placar da queda somado ao do complemento. Sempre que possível, registrem foto
          ou vídeo do placar e do relógio.
        </p>

        <DisconnectCalculator />

        <h4>Situações especiais</h4>
        <ul className="rule-list">
          <li><strong>Expulsão:</strong> a desvantagem numérica é recriada antes do complemento. Amarelos, cansaço e substituições não.</li>
          <li><strong>Nova queda:</strong> repete-se o procedimento com o placar acumulado e o tempo que ainda falta.</li>
          <li><strong>Prazo para voltar:</strong> até 15 minutos, salvo outro acordo entre os jogadores.</li>
          <li><strong>Queda do servidor ou dos dois jogadores:</strong> não gera punição automática.</li>
          <li><strong>Terceira queda do mesmo jogador:</strong> derrota administrativa por 3 x 0, se houver evidência suficiente.</li>
          <li><strong>Sem prova conclusiva:</strong> a organização decide com base nas capturas, vídeos e informações disponíveis.</li>
        </ul>
      </article>

      <article id="regra-conduta" className="rule">
        <h3>W.O., abandono e conduta</h3>
        <ul className="rule-list">
          <li>As partidas devem ser combinadas com bom senso, dentro dos prazos definidos pela organização.</li>
          <li>W.O. ou ausência recorrente pode gerar derrota administrativa e outras punições.</li>
          <li>Quem abandonar a competição pode ser retirado da edição atual e banido da seguinte.</li>
          <li>Manipular resultados, entregar partidas ou burlar regras invalida benefícios e pode gerar exclusão.</li>
        </ul>
      </article>

      <article id="regra-coringa" className="rule">
        <h3>Coringa da Lanterna</h3>
        <p className="muted small">Vale a partir da 2ª edição.</p>
        <p>
          O último colocado da edição anterior ganha o direito de usar um clube especial, acima de 4 estrelas, nos
          dois jogos contra o campeão anterior. Para isso, precisa ter concluído regularmente todas as suas partidas.
        </p>

        <div className="table-wrap">
          <table className="data rules-table">
            <thead>
              <tr><th scope="col" className="left">Distância do último para o penúltimo</th><th scope="col" className="left">Clube especial</th></tr>
            </thead>
            <tbody>
              <tr><th scope="row" className="left">Até 5 pontos</th><td className="left">Até 4,5 estrelas</td></tr>
              <tr><th scope="row" className="left">6 pontos ou mais</th><td className="left">Até 5 estrelas</td></tr>
            </tbody>
          </table>
        </div>

        <ul className="rule-list">
          <li>O campeão usa, nos dois jogos, o clube normal de até 4 estrelas cadastrado para esse confronto.</li>
          <li>O clube especial é o mesmo no turno e no returno. É o único confronto que não segue o jogo espelhado.</li>
          <li>Ele conta como um dos 9 clubes cadastrados e não pode ser usado contra mais ninguém.</li>
          <li>A escolha deve ser informada antes do início do campeonato.</li>
        </ul>

        <p className="example-text">
          <strong>Exemplo:</strong> o 10º colocado terminou 7 pontos atrás do 9º. Na edição seguinte, ele pode usar um
          clube de até 5 estrelas, só contra o campeão anterior e nos dois jogos.
        </p>

        <h4>Quando o benefício muda de mãos</h4>
        <ul className="rule-list">
          <li>Quem abandonou a edição, foi banido ou levou punição por W.O. intencional perde o direito.</li>
          <li>Se o último colocado não voltar, o coringa passa ao pior colocado entre os que retornarem.</li>
          <li>Se o campeão não voltar, o confronto especial é contra o melhor colocado entre os que retornarem.</li>
          <li>Estreantes não recebem o coringa automaticamente.</li>
        </ul>
      </article>

      <p className="muted small final">
        Situações não previstas são decididas pela organização, preservando a justiça competitiva, o bom andamento do
        campeonato e o espírito de amigos, resenha e diversão.
      </p>
    </section>
  );
}
