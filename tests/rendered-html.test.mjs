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

test("server-renders the Anqi Intelligence landing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  const normalizedHtml = html.replaceAll("<!-- -->", "");
  assert.match(html, /<title>Anqi Intelligence<\/title>/i);
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
  assert.match(html, /<title>Book a Demo \| Anqi Intelligence<\/title>/i);
  assert.doesNotMatch(html, /Select a communication protocol\./);
  assert.match(html, /https:\/\/www\.instagram\.com\/anqi\._\.thewateraddict/);
  assert.match(html, /https:\/\/www\.linkedin\.com\/in\/anqiqu\//);
  assert.match(html, /mailto:anqi@anqiqu\.com/);
  assert.match(html, /\/brand\/social\/email\.svg/);
  assert.match(html, /https:\/\/x\.com\/Anqinator/);
  assert.doesNotMatch(html, />Instagram<|>LinkedIn<|>Email<|>X</);
});

test("keeps production content centralized and reduced-motion safe", async () => {
  const [content, css, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/content.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
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
  assert.match(layout, /images:\s*\["\/og\.png"\]/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  await assert.rejects(
    access(new URL("../app/_sites-preview", import.meta.url)),
  );
});
