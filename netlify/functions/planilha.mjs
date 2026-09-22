import * as XLSX from "xlsx";

// ID do arquivo no Google Drive. Pode ser trocado pela variável de ambiente SHEET_ID no Netlify.
const SHEET_ID = process.env.SHEET_ID || "1t1o8E36jIaEojy5s7CY8dQKMFR3kfrOZ";

// 1ª URL: planilha nativa do Google Sheets. 2ª URL: arquivo .xlsx guardado no Drive.
const sources = (id) => [
  `https://docs.google.com/spreadsheets/d/${id}/export?format=xlsx`,
  `https://drive.google.com/uc?export=download&id=${id}`,
];

export default async () => {
  const errors = [];

  for (const base of sources(SHEET_ID)) {
    const url = `${base}&t=${Date.now()}`; // evita cache do Google
    try {
      const res = await fetch(url, { redirect: "follow" });
      const type = res.headers.get("content-type") || "";
      if (!res.ok || type.includes("text/html")) {
        errors.push(`${res.status} (${type || "sem content-type"}) em ${base}`);
        continue;
      }

      const workbook = XLSX.read(Buffer.from(await res.arrayBuffer()), { type: "buffer" });
      const sheets = {};
      for (const name of workbook.SheetNames) {
        if (name.startsWith("_")) continue; // abas auxiliares, como _Calculos
        sheets[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name], {
          header: 1,
          raw: false, // valores já formatados como aparecem na planilha
          defval: "",
          blankrows: true,
        });
      }

      return Response.json(
        { fetchedAt: new Date().toISOString(), sheets },
        { headers: { "Cache-Control": "no-store" } }
      );
    } catch (err) {
      errors.push(`${err.message} em ${base}`);
    }
  }

  return Response.json(
    {
      error:
        "Não foi possível baixar a planilha. Confira se o compartilhamento está como “Qualquer pessoa com o link: leitor”.",
      detail: errors,
    },
    { status: 502, headers: { "Cache-Control": "no-store" } }
  );
};

export const config = { path: "/api/planilha" };
