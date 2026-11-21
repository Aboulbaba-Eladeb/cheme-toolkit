import { useEffect, useMemo, useState } from "react";
import type { Tool, Output, NumInput } from "../core/types";
import { InputError } from "../core/types";
import { UNITS, toSI, fromSI, fmt } from "../core/units";
import { tr, t, type Lang } from "../i18n";
import { Tex } from "./Tex";

type Row = Record<string, number | string>;
interface State { values: Record<string, string>; units: Record<string, string>; choices: Record<string, string>; rows: Row[] }

const defaults = (tool: Tool): State => ({
  values: Object.fromEntries(tool.inputs.map(i => [i.id, String(i.value)])),
  units: Object.fromEntries(tool.inputs.map(i => [i.id, i.unit])),
  choices: Object.fromEntries((tool.choices ?? []).map(c => [c.id, c.value])),
  rows: (tool.table?.rows ?? []).map(r => ({ ...r })),
});

/** State ⇄ URL query, so a link reproduces the exact calculation. */
export function stateFromQuery(tool: Tool, q: URLSearchParams): State {
  const s = defaults(tool);
  for (const i of tool.inputs) {
    const raw = q.get(i.id);
    if (!raw) continue;
    const [v, u] = raw.split("~");
    if (v !== undefined && v !== "") s.values[i.id] = v;
    if (u && UNITS[i.dim].some(x => x.id === u)) s.units[i.id] = u;
  }
  for (const c of tool.choices ?? []) { const v = q.get("c." + c.id); if (v && c.options.some(o => o.value === v)) s.choices[c.id] = v; }
  const rows = q.get("rows");
  if (rows && tool.table) { try { const r = JSON.parse(rows); if (Array.isArray(r)) s.rows = r.slice(0, tool.table.maxRows); } catch { /* ignore bad links */ } }
  return s;
}
function stateToQuery(tool: Tool, s: State) {
  const q = new URLSearchParams();
  for (const i of tool.inputs) if (visible(i, s.choices)) q.set(i.id, `${s.values[i.id]}~${s.units[i.id]}`);
  for (const c of tool.choices ?? []) q.set("c." + c.id, s.choices[c.id]);
  if (tool.table) q.set("rows", JSON.stringify(s.rows));
  return q.toString();
}
const visible = (i: NumInput, choices: Record<string, string>) => {
  if (!i.when) return true;
  const want = Array.isArray(i.when.value) ? i.when.value : [i.when.value];
  return want.includes(choices[i.when.choice]);
};
const parseNum = (s: string) => (s.trim() === "" ? NaN : Number(s.replace(/,/g, ".").replace(/\s/g, "")));

export function ToolView({ tool, lang, query }: { tool: Tool; lang: Lang; query: URLSearchParams }) {
  const [s, setS] = useState<State>(() => stateFromQuery(tool, query));
  const [resUnits, setResUnits] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  // keep the address bar in step with the inputs (replaceState: no history spam)
  useEffect(() => {
    const url = `#/tool/${tool.id}?${stateToQuery(tool, s)}`;
    if (location.hash !== url) history.replaceState(null, "", url);
  }, [tool, s]);

  const shown = tool.inputs.filter(i => visible(i, s.choices));
  const bad = new Set(shown.filter(i => !Number.isFinite(parseNum(s.values[i.id]))).map(i => i.id));

  const out = useMemo((): { ok: true; out: Output } | { ok: false; msg: string } | null => {
    if (bad.size) return null;
    try {
      const si: Record<string, number> = {};
      for (const i of tool.inputs) si[i.id] = toSI(visible(i, s.choices) ? parseNum(s.values[i.id]) : i.value, i.dim, visible(i, s.choices) ? s.units[i.id] : i.unit);
      return { ok: true, out: tool.compute(si, s.choices, s.rows) };
    } catch (e) {
      return { ok: false, msg: e instanceof InputError ? tr(e.text, lang) : String((e as Error).message) };
    }
  }, [tool, s, lang, bad.size]);

  const set = (patch: Partial<State>) => setS(prev => ({ ...prev, ...patch }));
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(location.href); } catch { /* clipboard blocked */ }
    setCopied(true); setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="tool">
      <header className="tool-head">
        <a className="back" href="#/">{lang === "ar" ? "→" : "←"} {t("home", lang)}</a>
        <h1>{tr(tool.name, lang)}</h1>
        <p className="lede">{tr(tool.summary, lang)}</p>
      </header>

      <div className="tool-grid">
        <section className="card inputs" aria-labelledby="in-h">
          <div className="card-head"><h2 id="in-h">{t("inputs", lang)}</h2>
            <button className="ghost small" type="button" onClick={() => { setS(defaults(tool)); setResUnits({}); }}>{t("reset", lang)}</button></div>

          {(tool.choices ?? []).map(c => (
            <div className="field" key={c.id}>
              <span className="lbl">{tr(c.label, lang)}</span>
              {c.options.length <= 3 ? (
                <div className="seg" role="radiogroup" aria-label={tr(c.label, lang)}>
                  {c.options.map(o => (
                    <button key={o.value} type="button" role="radio" aria-checked={s.choices[c.id] === o.value}
                      onClick={() => set({ choices: { ...s.choices, [c.id]: o.value } })}>{tr(o.label, lang)}</button>
                  ))}
                </div>
              ) : (
                <select value={s.choices[c.id]} onChange={e => set({ choices: { ...s.choices, [c.id]: e.target.value } })}>
                  {c.options.map(o => <option key={o.value} value={o.value}>{tr(o.label, lang)}</option>)}
                </select>
              )}
            </div>
          ))}

          {shown.map(i => (
            <div className={"field" + (bad.has(i.id) ? " bad" : "")} key={i.id}>
              <label className="lbl" htmlFor={"in-" + i.id}><Tex block={false}>{i.sym}</Tex> {tr(i.label, lang)}</label>
              <div className="num">
                <input id={"in-" + i.id} inputMode="decimal" dir="ltr" value={s.values[i.id]} aria-invalid={bad.has(i.id)}
                  onChange={e => set({ values: { ...s.values, [i.id]: e.target.value } })} />
                {UNITS[i.dim].length > 1 ? (
                  <select aria-label="unit" value={s.units[i.id]} onChange={e => {
                    // convert the number so the physical quantity stays the same
                    const v = parseNum(s.values[i.id]), nu = e.target.value;
                    const nv = Number.isFinite(v) ? String(Number(fromSI(toSI(v, i.dim, s.units[i.id]), i.dim, nu).toPrecision(6))) : s.values[i.id];
                    set({ units: { ...s.units, [i.id]: nu }, values: { ...s.values, [i.id]: nv } });
                  }}>
                    {UNITS[i.dim].map(u => <option key={u.id} value={u.id}>{u.label}</option>)}
                  </select>
                ) : <span className="unit-fixed">{UNITS[i.dim][0].label}</span>}
              </div>
              {bad.has(i.id) ? <small className="err">{t("invalid", lang)}</small> : i.hint ? <small className="hint">{tr(i.hint, lang)}</small> : null}
            </div>
          ))}

          {tool.table && (
            <div className="field">
              <span className="lbl">{tr(tool.table.label, lang)}</span>
              <div className="tbl-wrap">
                <table className="in-table">
                  <thead><tr>{tool.table.columns.map(c => <th key={c.id}>{tr(c.label, lang)}</th>)}<th aria-label={t("remove", lang)} /></tr></thead>
                  <tbody>
                    {s.rows.map((r, ri) => (
                      <tr key={ri}>
                        {tool.table!.columns.map(c => (
                          <td key={c.id}><input dir="ltr" inputMode={c.id === tool.table!.nameColumn ? "text" : "decimal"} value={String(r[c.id] ?? "")}
                            onChange={e => { const rows = s.rows.map((x, k) => (k === ri ? { ...x, [c.id]: c.id === tool.table!.nameColumn ? e.target.value : e.target.value } : x)); set({ rows }); }} /></td>
                        ))}
                        <td><button type="button" className="ghost icon" aria-label={t("remove", lang)} disabled={s.rows.length <= tool.table!.minRows}
                          onClick={() => set({ rows: s.rows.filter((_, k) => k !== ri) })}>×</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button type="button" className="ghost small" disabled={s.rows.length >= tool.table.maxRows}
                onClick={() => set({ rows: [...s.rows, Object.fromEntries(tool.table!.columns.map(c => [c.id, c.id === tool.table!.nameColumn ? "" : c.id === "K" ? 1 : 0]))] })}>+ {t("addRow", lang)}</button>
            </div>
          )}
        </section>

        <section className="card results" aria-live="polite" aria-labelledby="res-h">
          <div className="card-head"><h2 id="res-h">{t("results", lang)}</h2>
            <button className="ghost small" type="button" onClick={copyLink}>{copied ? t("copied", lang) : t("share", lang)}</button></div>

          {!out ? <p className="muted">{t("error", lang)}</p>
            : !out.ok ? <div className="note warn">{out.msg}</div>
            : <>
              <div className="res-main">
                {out.out.results.filter(r => r.main).map(r => <ResultCard key={r.id} r={r} lang={lang} unit={resUnits[r.id] ?? r.unit} onUnit={u => setResUnits({ ...resUnits, [r.id]: u })} big />)}
              </div>
              {out.out.results.some(r => !r.main) && (
                <dl className="res-more">
                  {out.out.results.filter(r => !r.main).map(r => <ResultCard key={r.id} r={r} lang={lang} unit={resUnits[r.id] ?? r.unit} onUnit={u => setResUnits({ ...resUnits, [r.id]: u })} />)}
                </dl>
              )}
              {out.out.table && (
                <div className="tbl-wrap"><table className="out-table">
                  <thead><tr>{out.out.table.columns.map((c, k) => <th key={k}>{tr(c, lang)}</th>)}</tr></thead>
                  <tbody dir="ltr">{out.out.table.rows.map((r, k) => <tr key={k}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
                </table></div>
              )}
              {(out.out.notes ?? []).map((n, k) => <div key={k} className={"note " + n.kind}>{tr(n.text, lang)}</div>)}

              <h3 className="sol-h">{t("solution", lang)}</h3>
              <ol className="steps">
                {out.out.steps.map((st, k) => <li key={k}><p>{tr(st.text, lang)}</p><Tex>{st.tex}</Tex></li>)}
              </ol>
              <details className="refs"><summary>{t("references", lang)}</summary><ul dir="ltr">{tool.references.map(r => <li key={r}>{r}</li>)}</ul></details>
            </>}
        </section>
      </div>
    </div>
  );
}

function ResultCard({ r, lang, unit, onUnit, big }: { r: Output["results"][number]; lang: Lang; unit: string; onUnit: (u: string) => void; big?: boolean }) {
  const units = UNITS[r.dim];
  const val = r.dim === "none" ? r.value : fromSI(r.value, r.dim, unit);
  const body = (
    <>
      <span className="r-val" dir="ltr">{fmt(val)}</span>
      {units.length > 1
        ? <select className="r-unit" aria-label="unit" value={unit} onChange={e => onUnit(e.target.value)}>{units.map(u => <option key={u.id} value={u.id}>{u.label}</option>)}</select>
        : r.dim !== "none" ? <span className="r-unit">{units[0].label}</span> : null}
    </>
  );
  return big
    ? <div className="r-big"><span className="r-lbl"><Tex block={false}>{r.sym}</Tex> {tr(r.label, lang)}</span><div className="r-row">{body}</div></div>
    : <div className="r-line"><dt><Tex block={false}>{r.sym}</Tex> {tr(r.label, lang)}</dt><dd>{body}</dd></div>;
}
