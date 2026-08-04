import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

async function renderRoute(pathname) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
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

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  return response.text();
}

test("renders development preview metadata", async () => {
  const html = await renderRoute("/");
  assert.match(html, developmentPreviewMeta);
  assert.match(html, /Student Demo/);
  assert.match(html, /Admin Demo/);
});

test("renders the rebuilt casino lobby", async () => {
  const html = await renderRoute("/casino");
  assert.match(html, /<title>Casino · PlayGrid<\/title>/);
  assert.match(html, /casino-page-[^"']+\.js/);
});

test("renders the responsive sports market feed", async () => {
  const html = await renderRoute("/sports");
  assert.match(html, /<title>Sports · PlayGrid<\/title>/);
  assert.match(html, /sports-page-[^"']+\.js/);
});

test("renders the mobile-safe sports market detail", async () => {
  const html = await renderRoute("/sports/india-australia-odi");
  assert.match(html, /<title>India vs Australia · PlayGrid<\/title>/);
  assert.match(html, /Total pool/);
  assert.match(html, /Pool probability history/);
});

for (const [route, game] of [
  ["/casino/dice", "Dice"],
  ["/casino/mines", "Mines"],
  ["/casino/plinko", "Plinko"],
  ["/casino/chicken", "Chicken"],
  ["/casino/crash", "Crash"],
]) {
  test(`renders the animated ${game} frame`, async () => {
    const html = await renderRoute(route);
    assert.match(html, new RegExp(`<title>${game} · PlayGrid</title>`));
    assert.match(html, /casino-page-[^"']+\.js/);
  });
}

test("ships all casino controls and animation surfaces in the client bundle", async () => {
  const assetsDirectory = new URL("../dist/client/assets/", import.meta.url);
  const files = await readdir(assetsDirectory);
  const casinoBundle = files.find(
    (file) => file.startsWith("casino-page-") && file.endsWith(".js"),
  );
  assert.ok(casinoBundle, "casino client bundle was not emitted");
  const source = await readFile(new URL(casinoBundle, assetsDirectory), "utf8");
  for (const signature of [
    "Five games. One clear balance.",
    "Start Auto Bet",
    "Stop Auto Bet",
    "Stop on Profit",
    "Stop on Loss",
    "Win Chance",
    "Choose mines and place a bet",
    "Gems per Bet",
    "Choose risk and rows",
    "One lane per click",
    "Cashout Step",
    "data-target-lane",
    "Next round launching",
    "Multiplier rising",
    "animateMotion",
    "Fairness receipt preview",
  ]) {
    assert.match(source, new RegExp(signature.replaceAll(".", "\\.")));
  }
});

test("ships mobile sports filters and the collapsible bet slip", async () => {
  const assetsDirectory = new URL("../dist/client/assets/", import.meta.url);
  const files = await readdir(assetsDirectory);
  const sportsBundle = files.find(
    (file) => file.startsWith("sports-page-") && file.endsWith(".js"),
  );
  assert.ok(sportsBundle, "sports client bundle was not emitted");
  const source = await readFile(new URL(sportsBundle, assetsDirectory), "utf8");
  for (const signature of [
    "Market status",
    "Filter markets by sport",
    "Review bet on",
    "Collapse bet slip",
    "Place play-money bet",
  ]) {
    assert.match(source, new RegExp(signature));
  }
});
