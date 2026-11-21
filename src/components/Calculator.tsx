import { useMemo, useState } from "react";
import { evaluate, EXAMPLES } from "../core/calc";
import { t, type Lang } from "../i18n";

export function Calculator({ lang, query }: { lang: Lang; query: URLSearchParams }) {
  const [expr, setExpr] = useState(query.get("e") ?? EXAMPLES[0]);
  const res = useMemo(() => {
    if (!expr.trim()) return null;
    try { return { ok: true as const, ...evaluate(expr) }; } catch (e) { return { ok: false as const, msg: (e as Error).message }; }
  }, [expr]);
  const update = (v: string) => { setExpr(v); history.replaceState(null, "", "#/calc?e=" + encodeURIComponent(v)); };

  return (
    <div className="tool calc">
      <header className="tool-head">
        <a className="back" href="#/">{lang === "ar" ? "→" : "←"} {t("home", lang)}</a>
        <h1>{t("calc", lang)}</h1>
        <p className="lede">{t("calcDesc", lang)}</p>
      </header>
      <section className="card">
        <input className="calc-in" dir="ltr" value={expr} onChange={e => update(e.target.value)} placeholder={t("calcPh", lang)} aria-label={t("calc", lang)} spellCheck={false} autoFocus />
        <div className="calc-out" aria-live="polite" dir="ltr">
          {res && (res.ok
            ? <><span className="r-val">{res.text}</span>{res.si && <small>{t("inSI", lang)}: {res.si}</small>}</>
            : <span className="err">{res.msg}</span>)}
        </div>
        <p className="hint">{t("calcHelp", lang)}</p>
        <h3 className="sol-h">{t("examples", lang)}</h3>
        <div className="chips">{EXAMPLES.map(e => <button key={e} type="button" className="chip" dir="ltr" onClick={() => update(e)}>{e}</button>)}</div>
      </section>
    </div>
  );
}
