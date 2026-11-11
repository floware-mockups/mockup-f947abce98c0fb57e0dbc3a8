import { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import rawSeed from "./spec.json";
type MockupData = {title:string;description:string;accent:string;theme?:{palette:string;fonts:string};resetPlacement?:string;pages:{id:string;title:string;description:string;metrics:{label:string;value:string}[];columns:string[];rows:string[][];form:string[];sections?:string[]}[]};
const seed: MockupData = rawSeed;
import "./style.css";
import "./theme.css";
// WZ-2039: palette e font sono token CSS (theme.css); la struttura non cambia.
// Senza tema resta l'aspetto storico, con l'accento scelto dal modello.
const theme = Reflect.get(seed, "theme") as
  { palette: string; fonts: string } | undefined;
document.documentElement.dataset.accent = seed.accent;
if (theme) {
  document.documentElement.dataset.palette = theme.palette;
  document.documentElement.dataset.fonts = theme.fonts;
  // Solo la coppia scelta viene scaricata (font OFL incorporati, vedi fonts/OFL.txt).
  const fonts = import.meta.glob("./fonts/*.css");
  void fonts[`./fonts/${theme.fonts}.css`]?.();
}
const color = "bg-(--mk-primary) text-(--mk-on-primary)";
// WZ-2037: campi opzionali della specifica; in assenza valgono ordine e
// posizione storici.
const defaultSections = ["metrics", "table", "form"];
const sectionsOf = (page: object): string[] => {
  const sections = (page as { sections?: unknown }).sections;
  return Array.isArray(sections) && sections.length === 3
    ? sections
    : defaultSections;
};
const resetPlacement =
  Reflect.get(seed, "resetPlacement") === "top" ? "top" : "bottom";
function App() {
  const [pages, setPages] = useState(structuredClone(seed.pages));
  const [active, setActive] = useState(
    location.hash.slice(1) || seed.pages[0].id,
  );
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    const changed = () => {
      setActive(location.hash.slice(1));
      setSearch("");
      setMessage("");
    };
    window.addEventListener("hashchange", changed);
    return () => window.removeEventListener("hashchange", changed);
  }, []);
  const page = pages.find((p) => p.id === active) ?? pages[0];
  const resetButton = (
    <button
      className="mt-4 rounded border border-(--mk-sidebar-muted) px-3 py-2 text-sm"
      onClick={() => {
        setPages(structuredClone(seed.pages));
        setSearch("");
        setMessage("Dati dimostrativi ripristinati");
      }}
    >
      Ripristina demo
    </button>
  );
  return (
    <div className="min-h-screen bg-(--mk-bg) text-(--mk-text) md:flex">
      <aside className="border-b border-(--mk-divider) bg-(--mk-sidebar) p-6 text-(--mk-on-sidebar) md:min-h-screen md:w-64 md:border-r">
        {resetPlacement === "top" && <div className="mb-5">{resetButton}</div>}
        <div
          className={`mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl font-bold ${color}`}
        >
          M
        </div>
        <h1 data-testid="mockup-title" className="text-xl font-bold">{seed.title}</h1>
        <p className="mt-2 text-sm text-(--mk-sidebar-muted)">
          {seed.description}
        </p>
        <nav
          aria-label="Schermate"
          className="mt-8 flex flex-wrap gap-2 md:flex-col"
        >
          {pages.map((p) => (
            <a
              key={p.id}
              href={`#${p.id}`}
              aria-current={page.id === p.id ? "page" : undefined}
              className={`rounded-lg px-4 py-3 text-sm font-medium ${page.id === p.id ? "bg-(--mk-nav-active) text-(--mk-on-nav-active)" : "hover:bg-(--mk-sidebar-hover)"}`}
            >
              {p.title}
            </a>
          ))}
        </nav>
        <p className="mt-8 text-xs leading-relaxed text-(--mk-sidebar-muted)">
          Prototipo pubblico · Dati di esempio: Floware sostituisce i dati
          personali più comuni con dati inventati e maschera codici fiscali e
          IBAN. Le modifiche durano soltanto in questa sessione.
        </p>
        {resetPlacement === "bottom" && resetButton}
      </aside>
      <main className="mx-auto w-full max-w-6xl p-5 md:p-10">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-(--mk-primary)">
          Spazio dimostrativo ·{" "}
          <span data-testid="mockup-sample-data">Dati di esempio</span>
        </p>
        <h2 className="text-3xl font-bold">{page.title}</h2>
        <p className="mt-2 text-(--mk-muted)">{page.description}</p>
        {sectionsOf(page).map((section) => (
          <div key={section} data-section={section}>
            {section === "metrics" && (
              <>
                <div className="my-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {page.metrics.map((m, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-(--mk-divider) bg-(--mk-surface) p-5 shadow-sm"
                    >
                      <p className="text-sm text-(--mk-muted)">{m.label}</p>
                      <p className="mt-3 text-3xl font-semibold">{m.value}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
            {section === "table" && (
              <>
                {page.columns.length > 0 && (
                  <section className="overflow-hidden rounded-xl border border-(--mk-divider) bg-(--mk-surface) shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--mk-divider) p-5">
                      <h3 className="font-semibold">Elenco</h3>
                      <label className="text-sm">
                        Filtra{" "}
                        <input
                          className="ml-2 rounded-md border border-(--mk-border) bg-(--mk-surface) px-3 py-2"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Cerca nel prototipo"
                        />
                      </label>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-(--mk-subtle)">
                          <tr>
                            {page.columns.map((c, i) => (
                              <th key={i} className="px-5 py-3">
                                {c}
                              </th>
                            ))}
                            <th className="px-5 py-3">Azioni</th>
                          </tr>
                        </thead>
                        <tbody>
                          {page.rows
                            .map((row, index) => ({ row, index }))
                            .filter(({ row }) =>
                              row
                                .join(" ")
                                .toLowerCase()
                                .includes(search.toLowerCase()),
                            )
                            .map(({ row, index }) => (
                              <tr
                                key={index}
                                className="border-t border-(--mk-divider)"
                              >
                                {row.map((cell, i) => (
                                  <td key={i} className="px-5 py-4">
                                    {cell}
                                  </td>
                                ))}
                                <td className="px-5 py-4">
                                  <button
                                    className="font-medium text-(--mk-danger)"
                                    onClick={() => {
                                      setPages(
                                        pages.map((p) =>
                                          p.id === page.id
                                            ? {
                                                ...p,
                                                rows: p.rows.filter(
                                                  (_, i) => i !== index,
                                                ),
                                              }
                                            : p,
                                        ),
                                      );
                                      setMessage("Elemento rimosso dalla demo");
                                    }}
                                  >
                                    Rimuovi
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                    {page.rows.filter((r) =>
                      r.join(" ").toLowerCase().includes(search.toLowerCase()),
                    ).length === 0 && (
                      <p className="p-5 text-(--mk-muted)">
                        Nessun elemento trovato.
                      </p>
                    )}
                  </section>
                )}
              </>
            )}
            {section === "form" && (
              <>
                {page.form.length > 0 && (
                  <section className="mt-6 rounded-xl border border-(--mk-divider) bg-(--mk-surface) p-5 shadow-sm">
                    <h3 className="mb-4 font-semibold">
                      Aggiungi un esempio inventato
                    </h3>
                    <form
                      key={page.id}
                      className="grid gap-4 sm:grid-cols-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const form = e.currentTarget;
                        const data = new FormData(form);
                        const row = page.columns.map((_, i) =>
                          String(data.get(`field-${i}`) ?? "Esempio"),
                        );
                        setPages(
                          pages.map((p) =>
                            p.id === page.id
                              ? { ...p, rows: [...p.rows, row] }
                              : p,
                          ),
                        );
                        form.reset();
                        setMessage("Esempio aggiunto nella sessione");
                      }}
                    >
                      {page.form.map((f, i) => (
                        <label key={i} className="grid gap-2 text-sm">
                          {f}
                          <input
                            required
                            maxLength={120}
                            name={`field-${i}`}
                            className="rounded-md border border-(--mk-border) bg-(--mk-surface) px-3 py-2"
                            autoComplete="off"
                          />
                        </label>
                      ))}
                      <div className="sm:col-span-2">
                        <button
                          type="submit"
                          className={`rounded-lg px-5 py-2.5 font-medium ${color}`}
                        >
                          Aggiungi
                        </button>
                      </div>
                    </form>
                  </section>
                )}
              </>
            )}
          </div>
        ))}
        <p role="status" className="mt-5 text-sm text-(--mk-muted)">
          {message}
        </p>
      </main>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
