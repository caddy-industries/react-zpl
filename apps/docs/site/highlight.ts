/** Build-time syntax highlighting for the code shown on the site. */

export const esc = (s: string) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

const KEYWORDS = new Set(
  'import export default from function return const let var if else for of in while new type interface extends satisfies as async await true false null undefined typeof class'.split(
    ' ',
  ),
);

export function highlightTsx(src: string) {
  const re =
    /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`)|(<\/?)([A-Za-z][\w.]*)|\b([A-Za-z_$][\w$]*)(?==(?:["'{]))|\b(\d+(?:\.\d+)?)\b|\b([A-Za-z_$][\w$]*)\b/g;
  let out = '';
  let last = 0;
  for (const m of src.matchAll(re)) {
    out += esc(src.slice(last, m.index));
    last = m.index + m[0].length;
    if (m[1]) out += `<span class="m">${esc(m[1])}</span>`;
    else if (m[2]) out += `<span class="s">${esc(m[2])}</span>`;
    else if (m[4]) out += `${esc(m[3])}<span class="t">${esc(m[4])}</span>`;
    else if (m[5]) out += `<span class="a">${m[5]}</span>`;
    else if (m[6]) out += `<span class="n">${m[6]}</span>`;
    else if (m[7]) out += KEYWORDS.has(m[7]) ? `<span class="k">${m[7]}</span>` : m[7];
  }
  return out + esc(src.slice(last));
}

export function highlightZpl(zpl: string) {
  return esc(zpl).replace(/([\^~][A-Z0-9@]{1,2})([^\^~\n]*)/g, (_, c, rest) =>
    c === '^FD' ? `<span class="c">${c}</span><span class="d">${rest}</span>` : `<span class="c">${c}</span>${rest}`,
  );
}

export function highlightSh(src: string) {
  return esc(src)
    .replace(/^(\s*)(npx|npm|pnpm)\b/gm, '$1<span class="k">$2</span>')
    .replace(/(--[\w-]+)/g, '<span class="a">$1</span>');
}

export function highlight(lang: string, src: string) {
  if (['tsx', 'ts', 'js', 'jsx'].includes(lang)) return highlightTsx(src);
  if (lang === 'zpl') return highlightZpl(src);
  if (lang === 'sh') return highlightSh(src);
  return esc(src);
}
