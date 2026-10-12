// =========================================================
// build:html — بيجمّع الصفحات من src/ ويطلّعها HTML جاهز في روت المشروع
//
//   src/layout.html          الهيكل المشترك (head / header / footer / scripts)
//   src/partials/*.html      أجزاء بتتكرر (زي Blade components)
//   src/pages/*.html         كل صفحة: front-matter + sections
//
// صفحة:
//   <!--
//   title: من نحن | هداف
//   description: ...
//   nav: about                 ← اللينك اللي هياخد active في المنيو
//   -->
//   <!-- @section head -->  ... (اختياري: preload / سكريبت خاص بالصفحة)
//   <!-- @section top -->   ... (اختياري: قبل الهيدر، زي الانترو)
//   <!-- @section hero -->  ... (قبل <main>)
//   <!-- @section main -->  ... (المحتوى)
//
// جوه أي ملف:
//   <!-- @include page-hero title="من نحن" -->      ← partial + متغيرات
//   {{title}}  /  {{title|قيمة افتراضية}}             ← متغير
//   <!-- @if media --> ... <!-- @endif -->            ← يظهر لو المتغير موجود
//
// التشغيل:  npm run build:html   (أو  node tools/build-html.mjs --watch)
// =========================================================
import { readFileSync, writeFileSync, readdirSync, watch } from "node:fs";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");

const read = (p) => readFileSync(p, "utf8");

const vars = (s, ctx) =>
  s.replace(/\{\{\s*([\w-]+)(?:\|([^}]*))?\s*\}\}/g, (_, k, def) => (ctx[k] ?? def ?? ""));

const ifs = (s, ctx) => {
  // من الأعمق للأبعد
  const re = /<!--\s*@if\s+(!?)([\w-]+)\s*-->((?:(?!<!--\s*@if\b)[\s\S])*?)<!--\s*@endif\s*-->/;
  let m;
  while ((m = re.exec(s))) {
    const on = Boolean(ctx[m[2]]) !== (m[1] === "!");
    s = s.slice(0, m.index) + (on ? m[3] : "") + s.slice(m.index + m[0].length);
  }
  return s;
};

const parseAttrs = (str = "") => {
  const out = {};
  str.replace(/([\w-]+)="([^"]*)"/g, (_, k, v) => (out[k] = v));
  return out;
};

const render = (s, ctx, depth = 0) => {
  if (depth > 20) throw new Error("include depth > 20");
  s = s.replace(/<!--\s*@include\s+([\w-]+)((?:\s+[\w-]+="[^"]*")*)\s*-->/g, (_, name, attrs) => {
    // الـ partial بياخد متغيرات الصفحة ما عدا title/description (عشان ما يتلخبطوش مع {{title}} بتاع الكارت)
    const { title, description, ...shared } = ctx;
    const local = { ...shared, ...parseAttrs(vars(attrs, ctx)) };
    return render(read(join(src, "partials", `${name}.html`)), local, depth + 1);
  });
  return vars(ifs(s, ctx), ctx);
};

const parsePage = (raw) => {
  const meta = {};
  raw = raw.replace(/^\s*<!--([\s\S]*?)-->/, (_, body) => {
    body.split("\n").forEach((line) => {
      const m = line.match(/^\s*([\w-]+)\s*:\s*(.*)$/);
      if (m) meta[m[1]] = m[2].trim();
    });
    return "";
  });
  const sections = {};
  raw.split(/<!--\s*@section\s+([\w-]+)\s*-->/).forEach((part, i, arr) => {
    if (i % 2 === 1) sections[part] = arr[i + 1].trim();
  });
  return { meta, sections };
};

const activeNav = (html, nav) =>
  html.replace(/\sdata-nav="([\w-]+)"/g, (_, key) => (key === nav ? ' class="active" aria-current="page"' : ""));

const build = () => {
  const layout = read(join(src, "layout.html"));
  const pages = readdirSync(join(src, "pages")).filter((f) => f.endsWith(".html"));
  for (const file of pages) {
    const { meta, sections } = parsePage(read(join(src, "pages", file)));
    const ctx = { ...meta, page: basename(file), pageHero: /@include\s+page-hero/.test(sections.hero || "") ? "1" : "" };
    for (const [k, v] of Object.entries(sections)) ctx[k] = render(v, ctx);
    let html = render(layout, ctx);
    html = activeNav(html, meta.nav);
    html = html.replace(/\n{3,}/g, "\n\n");
    writeFileSync(join(root, file), html);
  }
  console.log(`build:html → ${pages.length} pages`);
};

build();
if (process.argv.includes("--watch")) {
  let t;
  watch(src, { recursive: true }, () => { clearTimeout(t); t = setTimeout(() => { try { build(); } catch (e) { console.error(e.message); } }, 80); });
  console.log("watching src/ …");
}
