import { useState } from "react";
import { TOOLS, CATEGORIES } from "../tools";
import { tr, t, type Lang } from "../i18n";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function Home({ lang }: { lang: Lang }) {
  const [q, setQ] = useState("");
  const words = norm(q).split(/\s+/).filter(Boolean);
  const match = (id: string) => {
    const tool = TOOLS.find(x => x.id === id)!;
    const hay = norm([tool.name.en, tool.name.ar, tool.summary.en, tool.summary.ar, tool.id].join(" "));
    return words.every(w => hay.includes(w));
  };
  const any = TOOLS.some(x => match(x.id));

  return (
    <div className="home">
      <section className="hero">
        <h1>{t("brand", lang)}</h1>
        <p className="lede">{t("tagline", lang)}</p>
        <input className="search" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder={t("search", lang)} aria-label={t("search", lang)} />
      </section>

      <a className="calc-card" href="#/calc">
        <span className="calc-ico" aria-hidden="true">ƒ(x)</span>
        <span><b>{t("calc", lang)}</b><small>{t("calcDesc", lang)}</small></span>
        <span className="go" aria-hidden="true">{lang === "ar" ? "←" : "→"}</span>
      </a>

      {CATEGORIES.map(c => {
        const list = TOOLS.filter(x => x.category === c.id && match(x.id));
        if (!list.length) return null;
        return (
          <section key={c.id} className="cat">
            <h2><span className="cat-ico" aria-hidden="true">{c.icon}</span>{tr(c.name, lang)} <small>{list.length}</small></h2>
            <div className="cards">
              {list.map(x => (
                <a key={x.id} className={"tool-card cat-" + c.id} href={`#/tool/${x.id}`}>
                  <b>{tr(x.name, lang)}</b>
                  <span>{tr(x.summary, lang)}</span>
                </a>
              ))}
            </div>
          </section>
        );
      })}
      {!any && <p className="muted">{t("noMatch", lang)}</p>}
    </div>
  );
}
