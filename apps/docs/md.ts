/**
 * A small Markdown converter for the docs pages. It covers what the pages use:
 * headings, paragraphs, lists, tables, code fences, block quotes, inline code,
 * links, bold and italics, plus two docs blocks:
 *
 *   :::cards                       a grid of link cards
 *   - [Title](#slug) Description
 *   :::
 *
 *   {{example barcodes/01-code128}}  a live label preview from the catalog
 */

export interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/<[^>]+>|`/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export interface MarkdownOptions {
  /** HTML for a `{{example key}}` embed. */
  example: (key: string) => string;
  /** Rewrites a link target, e.g. "#barcode" to "../barcode/". */
  link: (href: string) => string;
  /** HTML for a fenced code block. */
  code: (lang: string, text: string) => string;
}

function inline(s: string, link: (href: string) => string): string {
  // Pull code spans out first so nothing inside them is formatted.
  const codes: string[] = [];
  s = s.replace(/`([^`]+)`/g, (_, c) => `\u0000${codes.push(c) - 1}\u0000`);
  s = esc(s)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, href) => {
      const external = /^https?:/.test(href);
      return `<a href="${external ? href : link(href)}"${external ? ' target="_blank" rel="noopener"' : ''}>${text}</a>`;
    })
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${esc(codes[Number(i)])}</code>`);
}

function cells(row: string) {
  // Split on pipes that aren't escaped as \|.
  return row
    .trim()
    .replace(/^\||\|$/g, '')
    .split(/(?<!\\)\|/)
    .map((c) => c.trim().replace(/\\\|/g, '|'));
}

export function markdown(src: string, { example: renderExample, link, code }: MarkdownOptions) {
  const inl = (s: string) => inline(s, link);
  const lines = src.replace(/\r/g, '').split('\n');
  const out: string[] = [];
  const toc: Heading[] = [];
  let i = 0;
  let para: string[] = [];
  const flush = () => {
    if (para.length) out.push(`<p>${inl(para.join(' '))}</p>`);
    para = [];
  };

  while (i < lines.length) {
    const line = lines[i];
    const fence = line.match(/^```(\w*)/);
    if (fence) {
      flush();
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) body.push(lines[i++]);
      i++;
      out.push(code(fence[1] || 'text', body.join('\n')));
      continue;
    }
    const example = line.match(/^\{\{example ([\w/-]+)\}\}$/);
    if (example) {
      flush();
      out.push(renderExample(example[1]));
      i++;
      continue;
    }
    if (line.trim() === ':::cards') {
      flush();
      const cards: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ':::') {
        const m = lines[i].match(/^- \[([^\]]+)\]\(([^)]+)\)\s*(.*)$/);
        if (m) cards.push(`<a class="link-card" href="${link(m[2])}"><b>${inl(m[1])}</b><span>${inl(m[3])}</span></a>`);
        i++;
      }
      i++;
      out.push(`<div class="link-cards">${cards.join('')}</div>`);
      continue;
    }
    const heading = line.match(/^(#{2,3}) (.+)$/);
    if (heading) {
      flush();
      const level = heading[1].length as 2 | 3;
      const text = heading[2];
      const id = slugify(text);
      toc.push({ id, text: inl(text), level });
      out.push(`<h${level} id="${id}"><a href="#${id}" class="anchor" aria-hidden="true">#</a>${inl(text)}</h${level}>`);
      i++;
      continue;
    }
    if (line.startsWith('|')) {
      flush();
      const rows: string[] = [];
      while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++]);
      const [head, , ...body] = rows;
      out.push(
        `<div class="table"><table><thead><tr>${cells(head).map((c) => `<th>${inl(c)}</th>`).join('')}</tr></thead><tbody>${body
          .map((r) => `<tr>${cells(r).map((c) => `<td>${inl(c)}</td>`).join('')}</tr>`)
          .join('')}</tbody></table></div>`,
      );
      continue;
    }
    if (line.startsWith('> ')) {
      flush();
      const body: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) body.push(lines[i++].slice(2));
      out.push(`<div class="callout">${inl(body.join(' '))}</div>`);
      continue;
    }
    const item = line.match(/^(-|\d+\.) (.+)$/);
    if (item) {
      flush();
      const ordered = item[1] !== '-';
      const items: string[] = [];
      while (i < lines.length) {
        const m = lines[i].match(/^(-|\d+\.) (.+)$/);
        if (m) items.push(m[2]);
        else if (/^\s+\S/.test(lines[i]) && items.length) items[items.length - 1] += ` ${lines[i].trim()}`;
        else break;
        i++;
      }
      const tag = ordered ? 'ol' : 'ul';
      out.push(`<${tag}>${items.map((t) => `<li>${inl(t)}</li>`).join('')}</${tag}>`);
      continue;
    }
    if (line.trim() === '') flush();
    else para.push(line.trim());
    i++;
  }
  flush();
  return { html: out.join('\n'), toc };
}

/** Reads `---` frontmatter with simple `key: value` lines. */
export function frontmatter(src: string) {
  const m = src.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return { data: {} as Record<string, string>, body: src };
  const data: Record<string, string> = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (kv) data[kv[1]] = kv[2];
  }
  return { data, body: src.slice(m[0].length) };
}
