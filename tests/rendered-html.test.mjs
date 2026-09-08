import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set(
    "test",
    `${process.pid}-${Date.now()}-${pathname}`,
  );
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Anqi Qu landing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  const normalizedHtml = html.replaceAll("<!-- -->", "");
  assert.match(html, /<title>Anqi Qu<\/title>/i);

  // The homepage owns the /og.png share card (it lives on the homepage, not the
  // shared layout, so no other route inherits it).
  assert.match(html, /<meta property="og:title" content="Anqi Qu"\/?>/i);
  assert.match(
    html,
    /<meta property="og:image" content="https:\/\/anqiqu\.com\/og\.png"\/?>/i,
  );

  assert.doesNotMatch(html, /INTRODUCING ANQI INTELLIGENCE/);
  assert.match(html, /Anqi Qu/);
  assert.match(html, /Our most advanced multimodal human model yet\./);
  assert.match(html, /OBSERVED IN PROXIMITY TO PEOPLE AT/);
  assert.match(html, /Technical specifications/);
  assert.match(html, /Dimensions/);
  assert.match(normalizedHtml, /H:\s*166 cm/);
  assert.match(normalizedHtml, /W:\s*variable/);
  assert.match(normalizedHtml, /D:\s*<a href="\/contact">Book a demo to find out for yourself ;\)<\/a>/);
  assert.match(html, /Multimodal support/);
  assert.match(html, /Rhodes Scholar/);
  assert.match(html, /Economics, Statistics, Computer Science/);
  assert.doesNotMatch(html, /CURRENT|FOUNDATION/);
  assert.doesNotMatch(html, /General-purpose reasoning/);
  assert.doesNotMatch(html, /✓/);
  assert.match(html, /Compare adjacent solutions/);
  assert.match(html, /Security &amp; compliance/);
  assert.match(html, /<span>NOT CERTIFIED<\/span><h3>SOC 2<\/h3>/);
  assert.match(html, /href="\/contact"/);
  assert.doesNotMatch(html, /Radix Trading/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/);
});

test("server-renders contact options with supplied URLs", async () => {
  const response = await render("/contact");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /<title>Book a Demo \| Anqi Qu<\/title>/i);
  assert.doesNotMatch(html, /Select a communication protocol\./);
  assert.match(html, /https:\/\/www\.instagram\.com\/anqi\._\.thewateraddict/);
  assert.match(html, /https:\/\/www\.linkedin\.com\/in\/anqiqu\//);
  assert.match(html, /mailto:anqi@anqiqu\.com/);
  assert.match(html, /\/brand\/social\/email\.svg/);
  assert.match(html, /https:\/\/x\.com\/Anqinator/);
  assert.doesNotMatch(html, />Instagram<|>LinkedIn<|>Email<|>X</);
});

test("server-renders the Sandbox underground loading gate", async () => {
  const response = await render("/sandbox");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /<title>Anqi Qu<\/title>/i);

  // The sandbox shares as "Anqi Qu | Sandbox" with no image — it does not
  // inherit the homepage's card or its /og.png.
  assert.match(html, /<meta property="og:title" content="Anqi Qu \| Sandbox"\/?>/i);
  assert.match(html, /<meta name="twitter:title" content="Anqi Qu \| Sandbox"\/?>/i);
  assert.doesNotMatch(html, /<meta property="og:image"/i);
  assert.doesNotMatch(html, /<meta name="twitter:image"/i);

  assert.match(html, /Anqi Qu Sandbox/);
  assert.match(html, /A floating solarpunk island above the clouds/);
  assert.match(html, /data-mode="loading"/);
  assert.match(html, /sandbox-cavern/);
  assert.match(html, /sandbox-3d-canvas/);
  assert.match(html, /<noscript>/);
  assert.match(html, /Return to the server room/);
  // The painted 2D scene is fully retired: no terrain art, no positioned
  // location markup in the SSR payload.
  assert.doesNotMatch(html, /sandbox-scene|sandbox-terrain|sandbox-decoration|sandbox-location/);
  assert.doesNotMatch(html, /terrain-transparent\.webp/);
  assert.doesNotMatch(html, /site-header|desktop-nav|Book a demo/);
});

test("gives a shared writing piece its own share card, not the homepage's", async () => {
  const response = await render("/writing/my-month-up-here");
  assert.equal(response.status, 200);

  const html = await response.text();

  // The browser-tab title keeps the site's existing shape.
  assert.match(html, /<title>My Month Up Here \| Anqi Qu<\/title>/i);

  // The share card reads "Anqi Qu | Writings | <title>" on both OpenGraph
  // (iMessage and other link-preview readers) and Twitter/X — not the
  // homepage's bare "Anqi Qu".
  assert.match(
    html,
    /<meta property="og:title" content="Anqi Qu \| Writings \| My Month Up Here"\/?>/i,
  );
  assert.match(
    html,
    /<meta name="twitter:title" content="Anqi Qu \| Writings \| My Month Up Here"\/?>/i,
  );

  // It is a piece, canonical to itself, not the "website" homepage card.
  assert.match(html, /<meta property="og:type" content="article"\/?>/i);
  assert.match(
    html,
    /<meta property="og:url" content="https:\/\/anqiqu\.com\/writing\/my-month-up-here"\/?>/i,
  );
  assert.match(
    html,
    /<link rel="canonical" href="https:\/\/anqiqu\.com\/writing\/my-month-up-here"\/?>/i,
  );

  // With no `image` in its frontmatter, the piece carries NO share image — it
  // never borrows the homepage's /og.png.
  assert.doesNotMatch(html, /<meta property="og:image"/i);
  assert.doesNotMatch(html, /<meta name="twitter:image"/i);

  // The homepage tagline / card must not leak onto a writing piece's card.
  assert.doesNotMatch(html, /Our most advanced multimodal human model yet\./);
});

test("labels a shared manifesto piece with its own section", async () => {
  const response = await render("/manifesto/anqo-optimisto-manifesto");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(
    html,
    /<meta property="og:title" content="Anqi Qu \| Manifesto \| Anqo-Optimisto Manifesto"\/?>/i,
  );
});

test("gives Research its own share card, with no image", async () => {
  const response = await render("/research");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /<meta property="og:title" content="Anqi Qu \| Research"\/?>/i);
  assert.match(html, /<meta name="twitter:title" content="Anqi Qu \| Research"\/?>/i);
  assert.doesNotMatch(html, /<meta property="og:image"/i);
  assert.doesNotMatch(html, /<meta name="twitter:image"/i);
});

test("keeps production content centralized and reduced-motion safe", async () => {
  const [content, css, layout, page, packageJson] = await Promise.all([
    readFile(new URL("../app/content.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(content, /export const contactLinks/);
  assert.match(content, /export const specifications/);
  assert.doesNotMatch(content, /Radix Trading/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /@keyframes logo-marquee/);
  assert.match(css, /filter:\s*brightness\(0\) invert\(1\)/);
  assert.match(css, /hero-parenthetical/);
  assert.match(css, /--gyro-x/);
  assert.match(css, /@keyframes orbit-sweep/);
  assert.match(css, /@keyframes orbit-drift-three/);
  assert.match(css, /technical-star/);
  assert.match(css, /technical-pattern-pulse/);
  assert.match(css, /#comparison::before/);
  assert.match(css, /company-logo-item-nvidia/);
  assert.match(css, /company-logo-item-featured/);
  assert.match(css, /contact-option-x/);
  assert.match(css, /contact-value[^}]*font-size:\s*16px/);
  assert.match(css, /border-radius:\s*16px/);
  assert.match(css, /@media \(max-width: 360px\)/);
  assert.match(layout, /metadataBase:\s*new URL\("https:\/\/anqiqu\.com"\)/);
  assert.match(layout, /themeColor:\s*"#000000"/);
  // The share-card image lives on the homepage now, not the shared layout, so
  // no other route inherits /og.png. (The layout still references og.png in its
  // JSON-LD Person schema, which is site-wide structured data, not a card.)
  assert.match(page, /url:\s*"\/og\.png"/);
  assert.doesNotMatch(layout, /openGraph|twitter/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  await assert.rejects(
    access(new URL("../app/_sites-preview", import.meta.url)),
  );
});
