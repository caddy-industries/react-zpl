// Interactivity for the docs site. Pages are fully rendered at build time;
// this only switches tabs and label sizes and copies code.

function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), 1500);
}

async function copy(text, what) {
  try {
    await navigator.clipboard.writeText(text);
    toast(`${what} copied`);
  } catch {
    toast('Copy was blocked. Select the code and copy it instead.');
  }
}

const isZplTab = (ex) => ex.querySelector('[data-view="zpl"]').getAttribute('aria-selected') === 'true';

document.addEventListener('click', (e) => {
  const tab = e.target.closest('.ex [data-view]');
  if (tab) {
    const ex = tab.closest('.ex');
    for (const b of ex.querySelectorAll('[data-view]')) b.setAttribute('aria-selected', String(b === tab));
    for (const v of ex.querySelectorAll('.view')) v.hidden = v.dataset.for !== tab.dataset.view;
    ex.querySelector('[data-copy-ex]').textContent = isZplTab(ex) ? 'Copy ZPL' : 'Copy code';
    return;
  }

  const size = e.target.closest('.ex .sizes [data-size]');
  if (size) {
    const ex = size.closest('.ex');
    for (const b of ex.querySelectorAll('.sizes [data-size]')) b.setAttribute('aria-pressed', String(b === size));
    for (const el of ex.querySelectorAll('[data-r]')) el.hidden = el.dataset.r !== size.dataset.size;
    return;
  }

  const copyEx = e.target.closest('[data-copy-ex]');
  if (copyEx) {
    const ex = copyEx.closest('.ex');
    if (isZplTab(ex)) copy(ex.querySelector('pre[data-zpl]:not([hidden])').textContent, 'ZPL');
    else copy(ex.querySelector('pre[data-react]').textContent, 'Code');
    return;
  }

  const block = e.target.closest('[data-copy-block]');
  if (block) {
    copy(block.closest('.codeblock').querySelector('pre').textContent, 'Code');
    return;
  }

  const plain = e.target.closest('[data-copy]');
  if (plain) {
    copy(plain.dataset.copy, 'Command');
    return;
  }

  const theme = e.target.closest('[data-theme-toggle]');
  if (theme) {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {}
    return;
  }

  const page = e.target.closest('[data-copy-page]');
  if (page) {
    fetch(page.dataset.copyPage)
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((md) => copy(md, 'Page'))
      .catch(() => toast("Couldn't load this page's Markdown."));
    return;
  }

  // Close the mobile docs menu when a page is picked.
  const menuLink = e.target.closest('.docs-menu a');
  if (menuLink) menuLink.closest('details').open = false;
});

// Follow system theme changes unless the visitor picked a theme.
try {
  if (!localStorage.getItem('theme')) {
    matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) document.documentElement.dataset.theme = e.matches ? 'light' : 'dark';
    });
  }
} catch {}

// Mark the section being read in "On this page".
const tocLinks = [...document.querySelectorAll('.toc a[href^="#"]')];
if (tocLinks.length && 'IntersectionObserver' in window) {
  const headings = tocLinks.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1)))).filter(Boolean);
  const visible = new Set();
  const update = () => {
    const current = headings.find((h) => visible.has(h)) ?? headings.filter((h) => h.getBoundingClientRect().top < 120).pop() ?? headings[0];
    for (const a of tocLinks) a.classList.toggle('active', a.hash === `#${current.id}`);
  };
  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) en.isIntersecting ? visible.add(en.target) : visible.delete(en.target);
      update();
    },
    { rootMargin: '-80px 0px -60% 0px' },
  );
  for (const h of headings) io.observe(h);
}
