import Empty from "./Empty.jsx";

export default function DataTable({ title, table, missing }) {
  if (!table) return <Empty title={`Aba “${missing}” não encontrada`} text={`Crie uma aba com “${missing}” no nome para ela aparecer aqui.`} />;
  if (!table.rows.length) return <Empty title={`${title}: nada cadastrado`} text="Preencha a aba na planilha e a lista aparece aqui automaticamente." />;

  const hasGroup = table.rows.some((r) => r._group);

  return (
    <section>
      <h2 className="section-title">{title}</h2>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              {hasGroup && <th scope="col" className="left">Grupo</th>}
              {table.columns.map((c) => (
                <th scope="col" key={c} className="left">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((r, i) => (
              <tr key={i}>
                {hasGroup && <td className="left muted">{r._group}</td>}
                {table.columns.map((c, j) =>
                  j === 0 ? (
                    <th scope="row" key={c} className="left">{r[c]}</th>
                  ) : (
                    <td key={c} className="left">{r[c]}</td>
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
