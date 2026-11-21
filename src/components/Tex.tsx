import katex from "katex";
import "katex/dist/katex.min.css";
import { useMemo } from "react";

/** Renders LaTeX; equations always read left-to-right, also inside the Arabic interface. */
export function Tex({ children, block = true }: { children: string; block?: boolean }) {
  const html = useMemo(() => katex.renderToString(children, { throwOnError: false, displayMode: block, strict: "ignore" }), [children, block]);
  return <span className={block ? "tex tex-block" : "tex"} dir="ltr" dangerouslySetInnerHTML={{ __html: html }} />;
}
