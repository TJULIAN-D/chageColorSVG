// Para agregar un logo: súbelo a Logos/, crea otra página copiando una existente y añade una línea aquí.
const LOGOS = {
  horizontal: { name: 'Horizontal', page: 'index.html', svg: 'Logos/Logo-Horizontal-Celestia.svg' },
  vertical: { name: 'Vertical', page: 'vertical.html', svg: 'Logos/Logo-vertical-Celestia.svg' },
  ovalado: { name: 'Ovalado', page: 'ovalado.html', svg: 'Logos/Logo-obalado-Celestia.svg' },
  circular: { name: 'Circular', page: 'circular.html', svg: 'Logos/Logo-Circular-Celestia.svg' },
};
const SHAPES = 'path,rect,circle,ellipse,polygon,polyline,line,text';
const $ = id => document.getElementById(id);
const current = LOGOS[document.body.dataset.logo];

$('nav').replaceChildren(...Object.values(LOGOS).map(l => {
  const a = document.createElement('a');
  a.href = l.page;
  a.textContent = l.name;
  if (l === current) a.setAttribute('aria-current', 'page');
  return a;
}));
$('title').textContent = 'Logo ' + current.name;

// Tema: sin elección sigue al sistema; el botón lo fija en claro u oscuro y se recuerda
const root = document.documentElement;
const dark = () => root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
try { if (localStorage.theme) root.dataset.theme = localStorage.theme; } catch {}
const themeBtn = document.createElement('button');
themeBtn.id = 'theme';
const paint = () => themeBtn.textContent = dark() ? '☀ Claro' : '☾ Oscuro';
themeBtn.onclick = () => {
  root.dataset.theme = dark() ? 'light' : 'dark';
  try { localStorage.theme = root.dataset.theme; } catch {}
  paint();
};
paint();
$('nav').append(themeBtn);

// Los estilos computados vienen como rgb(); el input color necesita #rrggbb
const toHex = c => {
  const m = c.match(/\d+/g);
  return m ? '#' + m.slice(0, 3).map(n => (+n).toString(16).padStart(2, '0')).join('') : null;
};

// Aplica a las formas propias del grupo (no a las de subgrupos, que tienen su propio control)
const own = g => [...g.querySelectorAll(SHAPES)].filter(s => s.closest('g') === g);

fetch(current.svg)
  .then(r => r.ok ? r.text() : Promise.reject(r.status))
  .then(text => {
    const svg = new DOMParser().parseFromString(text, 'image/svg+xml').documentElement;
    $('view').replaceChildren(document.importNode(svg, true));
    build($('view').firstElementChild);
  })
  .catch(e => $('view').textContent = 'No se pudo cargar el logo (' + e + ')');

function build(svg) {
  const list = $('groups');
  const groups = [...svg.querySelectorAll('g')].filter(g => own(g).length)
    .map((g, i) => ({ shapes: own(g), name: g.id || 'grupo ' + (i + 1) }));
  // Formas sueltas (fuera de todo <g>): cada una es su propio elemento
  [...svg.querySelectorAll(SHAPES)].filter(s => !s.closest('g'))
    .forEach((s, i) => groups.push({ shapes: [s], name: s.id || 'forma ' + (i + 1) }));
  groups.forEach(({ shapes, name }) => {
    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = '<span></span>';
    row.firstChild.textContent = name;
    for (const prop of ['fill', 'stroke']) {
      const first = shapes.map(s => toHex(getComputedStyle(s)[prop])).find(Boolean);
      if (!first) continue; // 'none': no hay nada que colorear
      const inp = document.createElement('input');
      inp.type = 'color';
      inp.value = first;
      inp.title = prop === 'fill' ? 'Relleno' : 'Borde';
      inp.oninput = () => shapes.forEach(s => s.style[prop] = inp.value);
      row.append(inp);
    }
    // Resalta el grupo al pasar el ratón por su fila
    row.onmouseenter = () => shapes.forEach(s => s.style.opacity = .3);
    row.onmouseleave = () => shapes.forEach(s => s.style.opacity = '');
    list.append(row);
  });
  $('save').hidden = false;
}

$('save').onclick = () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString($('view').firstElementChild)], { type: 'image/svg+xml' }));
  a.download = 'logo-' + current.name.toLowerCase() + '-editado.svg';
  a.click();
  URL.revokeObjectURL(a.href);
};
