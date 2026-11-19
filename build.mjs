// Builds the website: fills index.html with the text/images from content/*.json
// and writes the finished site to dist/. Vercel runs this automatically on every change.
//
// How it works: elements in index.html carry markers that say which content field
// they show, e.g. <span data-c="hero.title">  →  content/hero.json → "title".
//   data-c="file.field"        text (new lines become line breaks)
//   data-c-src / -href / -content   image path, link or meta tag value
//   data-c-tel / -wa / -mail    phone / WhatsApp / email links built from a number or address
//   data-c-map                 Google Maps embed for a location
//   data-list="file.field"     repeat the [data-item] children once per list entry
//   data-f="field"             a field of the current list entry ("." = the entry itself,
//                              "#n" = its position 01, 02…, "a|b" = a, or b if a is empty)
import fs from 'fs';
import path from 'path';
import * as cheerio from 'cheerio';

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(ROOT, 'dist');

// ---------- load content ----------
const data = {};
for (const f of fs.readdirSync(path.join(ROOT, 'content'))) {
  if (f.endsWith('.json')) {
    data[f.replace(/\.json$/, '')] = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', f), 'utf8'));
  }
}

const get = (obj, p) => p.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
const str = v => (v == null ? '' : String(v));
const digits = v => {
  let d = str(v).replace(/\D/g, '');
  if (d.startsWith('0')) d = '92' + d.slice(1); // local Pakistani format → international
  return d;
};
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const initials = name => str(name).split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');

const $ = cheerio.load(fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'));

function setText($el, value) {
  const v = str(value);
  if ($el.is('[data-optional]') && !v.trim()) { $el.remove(); return; }
  if ($el.is('[data-oneline]')) { $el.text(v.replace(/,?\s*\n\s*/g, ', ')); return; }
  if ($el.is('title')) { $el.text(v); return; }
  $el.html(esc(v).replace(/\n/g, '<br>'));
}

function fieldValue(item, field, index) {
  if (field === '.') return item;
  if (field === '#n') return String(index + 1).padStart(2, '0');
  for (const f of field.split('|')) {
    const v = item && typeof item === 'object' ? item[f] : undefined;
    if (v != null && str(v).trim() !== '') return v;
  }
  return '';
}

// Repeat a container's [data-item] children for each entry in arr.
function renderList($container, arr) {
  const templates = $container.children('[data-item]').toArray();
  if (!templates.length) return;
  const items = Array.isArray(arr) ? arr : [];
  const anchor = $('<template data-anchor></template>');
  $(templates[0]).before(anchor);
  items.forEach((item, i) => {
    // reuse the original cards in turn, so icons/styles cycle for new entries
    const $el = $(templates[i % templates.length]).clone();
    renderItem($el, item, i);
    anchor.before($el);
    anchor.before('\n'); // keep spacing between items, as in the original
  });
  templates.forEach(t => $(t).remove());
  anchor.remove();
}

function renderItem($el, item, i) {
  // nested lists first (e.g. bullet points inside a service card)
  $el.find('[data-f-list]').each((_, sub) => {
    const $sub = $(sub);
    renderList($sub, item && item[$sub.attr('data-f-list')]);
    $sub.find('[data-f]').attr('data-done', '');
  });
  const fields = $el.find('[data-f]:not([data-done])').toArray();
  if ($el.is('[data-f]')) fields.push($el[0]);
  for (const node of fields) {
    const $n = $(node);
    let v = fieldValue(item, $n.attr('data-f'), i);
    if ($n.is('[data-initials]')) v = initials(v);
    if ($n.is('[data-quote]')) v = `"${str(v)}"`;
    setText($n, v);
  }
  if ($el.is('[data-f-href]')) $el.attr('href', str(fieldValue(item, $el.attr('data-f-href'), i)) || '#contact');
}

// ---------- lists ----------
$('[data-list]').each((_, el) => renderList($(el), get(data, $(el).attr('data-list'))));

// ---------- single fields ----------
$('[data-c]').each((_, el) => setText($(el), get(data, $(el).attr('data-c'))));
$('[data-c-content]').each((_, el) => $(el).attr('content', str(get(data, $(el).attr('data-c-content')))));
$('[data-c-href]').each((_, el) => $(el).attr('href', str(get(data, $(el).attr('data-c-href'))) || '#'));
$('[data-c-src]').each((_, el) => $(el).attr('src', str(get(data, $(el).attr('data-c-src')))));
$('[data-c-tel]').each((_, el) => $(el).attr('href', 'tel:+' + digits(get(data, $(el).attr('data-c-tel')))));
$('[data-c-wa]').each((_, el) => $(el).attr('href', 'https://wa.me/' + digits(get(data, $(el).attr('data-c-wa')))));
$('[data-c-mail]').each((_, el) => $(el).attr('href', 'mailto:' + str(get(data, $(el).attr('data-c-mail'))).trim()));
$('[data-c-map]').each((_, el) => {
  const q = encodeURIComponent(str(get(data, $(el).attr('data-c-map'))));
  $(el).attr('src', `https://maps.google.com/maps?q=${q}&t=&z=14&ie=UTF8&iwloc=&output=embed`);
});
$('[data-c-wa-number]').each((_, el) => $(el).attr('data-wa', digits(get(data, $(el).attr('data-c-wa-number')))));
// contact-form dropdown follows the services list
$('[data-c-options]').each((_, el) => {
  const items = get(data, $(el).attr('data-c-options')) || [];
  const opts = items.map(it => `<option>${esc(str(it.title))}</option>`);
  opts.push('<option>Not sure yet</option>');
  $(el).html('\n' + opts.join('\n') + '\n');
});

// ---------- tidy: remove the markers from the published page ----------
$('*').each((_, el) => {
  for (const a of Object.keys(el.attribs || {})) {
    if (/^data-(c|f|c-.+|f-.+|list|item|optional|oneline|quote|initials|done)$/.test(a)) $(el).removeAttr(a);
  }
});

// ---------- write dist/ ----------
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), $.html());
for (const f of ['styles.css', 'script.js']) fs.copyFileSync(path.join(ROOT, f), path.join(OUT, f));
fs.cpSync(path.join(ROOT, 'assets'), path.join(OUT, 'assets'), { recursive: true });
console.log('Built dist/ from', Object.keys(data).length, 'content files');
