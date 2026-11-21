import { lazy, Suspense, useEffect, useState } from "react";
import { Home } from "./components/Home";
import { ToolView } from "./components/ToolView";
// the unit calculator pulls in mathjs (large), so it loads only when opened
const Calculator = lazy(() => import("./components/Calculator").then(m => ({ default: m.Calculator })));
import { toolById, TOOLS } from "./tools";
import { t, tr, type Lang } from "./i18n";

const store = { get: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } }, set: (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } } };

function parseHash() {
  const h = location.hash.replace(/^#/, "") || "/";
  const [path, qs = ""] = h.split("?");
  return { path, query: new URLSearchParams(qs) };
}

export default function App() {
  const [route, setRoute] = useState(parseHash);
  const [lang, setLang] = useState<Lang>(() => (store.get("cet-lang") as Lang) || (navigator.language.startsWith("ar") ? "ar" : "en"));
  const [theme, setTheme] = useState<string>(() => store.get("cet-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));

  useEffect(() => {
    const on = () => { setRoute(parseHash()); };
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);
  useEffect(() => { document.documentElement.lang = lang; document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"; store.set("cet-lang", lang); }, [lang]);
  useEffect(() => { document.documentElement.dataset.theme = theme; store.set("cet-theme", theme); }, [theme]);
  // scroll to top on real navigation between pages
  useEffect(() => { scrollTo({ top: 0 }); }, [route.path]);

  const toolId = route.path.startsWith("/tool/") ? route.path.slice(6) : null;
  const tool = toolId ? toolById(toolId) : undefined;
  useEffect(() => { document.title = tool ? `${tr(tool.name, lang)} · ${t("brand", lang)}` : route.path === "/calc" ? `${t("calc", lang)} · ${t("brand", lang)}` : t("brand", lang); }, [tool, route.path, lang]);

  return (
    <>
      <header className="top">
        <a className="logo" href="#/" aria-label={t("brand", lang)}>
          <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><path d="M12 4h8v2h-1v7.2l7.4 12.3A2.3 2.3 0 0 1 24.4 29H7.6a2.3 2.3 0 0 1-2-3.5L13 13.2V6h-1z" fill="var(--acc)"/><path d="M9.2 21h13.6l2.3 3.8a.8.8 0 0 1-.7 1.2H7.6a.8.8 0 0 1-.7-1.2z" fill="var(--bg)" opacity=".5"/></svg>
          <span>{t("brand", lang)}</span>
        </a>
        <nav className="top-actions">
          <span className="count">{TOOLS.length} {t("tools", lang)}</span>
          <button type="button" className="ghost small" onClick={() => setLang(lang === "en" ? "ar" : "en")} aria-label="Language">{lang === "en" ? "عربي" : "English"}</button>
          <button type="button" className="ghost small icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label={t("theme", lang)} title={t("theme", lang)}>{theme === "dark" ? "☀" : "☾"}</button>
        </nav>
      </header>

      <main className="wrap">
        {tool ? <ToolView key={tool.id} tool={tool} lang={lang} query={route.query} />
          : route.path === "/calc" ? <Suspense fallback={<p className="muted">…</p>}><Calculator lang={lang} query={route.query} /></Suspense>
          : <Home lang={lang} />}
      </main>

      <footer className="foot wrap">
        <p>{t("footer", lang)}</p>
        <p className="muted">{t("verify", lang)} · {t("offline", lang)}</p>
      </footer>
    </>
  );
}
