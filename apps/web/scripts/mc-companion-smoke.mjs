// End-to-end smoke for /tools/middle-class.
// Caller runs `pnpm dev` or `pnpm start` separately. Run from apps/web:
// `node scripts/mc-companion-smoke.mjs`. Exit 0 on success, 1 on fail.
//
// Pure function math is in lib/tools/__tests__/mc-companion.test.ts.
// This is the integration layer: dispatch wiring, alerts, persistence,
// reset, and mobile breakpoint.

import { chromium } from "playwright";

import { BASE_URL } from "./_lib.mjs";

const ROUTE = `${BASE_URL}/tools/middle-class`;

let passCount = 0;
let failCount = 0;

function assert(condition, label) {
  if (condition) {
    passCount += 1;
    console.log(`  ✓ ${label}`);
  } else {
    failCount += 1;
    console.error(`  ✗ ${label}`);
  }
}

function section(name) {
  console.log(`\n— ${name} —`);
}

async function readOutputs(page) {
  return page.evaluate(() => {
    const findDd = (label) => {
      const dt = [...document.querySelectorAll("dt")].find(
        (el) => el.textContent.trim() === label,
      );
      return dt?.nextElementSibling?.textContent?.trim() ?? null;
    };
    const chips = [...document.querySelectorAll("span")]
      .map((s) => s.textContent.trim())
      .filter((t) => /^\d+ (Good|Neutral|Trouble)$/.test(t));
    const alerts = [...document.querySelectorAll("p")]
      .find((p) => p.textContent === "Alerts")
      ?.closest("div")
      ?.textContent?.trim();
    return {
      pop: document.querySelector('input[aria-label="Population"]')?.value,
      multiplier: findDd("Tax multiplier"),
      mcIncomeTax: findDd("MC income tax"),
      mcEmploymentTax: findDd("MC employment tax"),
      totalTaxes: findDd("Total taxes"),
      mandatoryOutlay: findDd("Mandatory outlay"),
      sectionBCount: findDd("Section B policies (1–5)"),
      eogPolicyVp: findDd("Policy VP"),
      eogStorageVp: findDd("Storage VP"),
      eogCashVp: findDd("Cash VP (÷15)"),
      eogTotalVp: findDd("Total EOG VP"),
      chips,
      alerts,
    };
  });
}

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await ctx.newPage();

  // Clean slate
  await page.goto(ROUTE);
  await page.evaluate(() => {
    window.localStorage.removeItem("mc-companion-inputs-v1");
    window.localStorage.removeItem("mc-r1-banner-dismissed");
  });
  await page.reload();

  section("Round 1 defaults");
  let out = await readOutputs(page);
  assert(out.pop === "10", `population = 10 (got ${out.pop})`);
  assert(out.multiplier === "×5", `tax multiplier = ×5 (got ${out.multiplier})`);
  assert(out.mcIncomeTax === "0¥", `income tax = 0¥ at 0 outside cos (got ${out.mcIncomeTax})`);
  assert(out.mcEmploymentTax === "10¥", `employment tax = 10¥ at 2 ops × 5 (got ${out.mcEmploymentTax})`);
  assert(out.totalTaxes === "10¥", `total taxes = 10¥ (got ${out.totalTaxes})`);
  assert(out.mandatoryOutlay === "130¥", `mandatory outlay = 130¥ (10 + 120 food) (got ${out.mandatoryOutlay})`);
  assert(out.sectionBCount === "2", `section B count = 2 (laborMarket B + health B) (got ${out.sectionBCount})`);
  assert(out.eogPolicyVp === "+3", `eog policy VP = +3 (triangular 2) (got ${out.eogPolicyVp})`);
  assert(out.eogCashVp === "+2", `eog cash VP = +2 (40/15) (got ${out.eogCashVp})`);

  section("Loan risk alert (inflow < mandatory at R1)");
  assert(/Loan risk/.test(out.alerts ?? ""), "loan risk alert visible at R1");

  section("Scoring boost available (ops 2 > prosperity 0)");
  assert(
    !/Scoring boost lost/.test(out.alerts ?? ""),
    "scoring boost is NOT lost at R1",
  );

  section("Dispatch + recompute: revenue input");
  await page.getByRole("spinbutton", { name: "Revenue" }).fill("200");
  out = await readOutputs(page);
  // inflow = 40 + 200 = 240, mandatory 130, net 110 → ewp = 7
  assert(!/Loan risk/.test(out.alerts ?? ""), "loan risk clears when revenue covers mandatory");

  section("Policy change (Health B → A) — section B count drops");
  await page
    .locator(
      '[role="radiogroup"][aria-label="Health & Benefits position"] [role="radio"]:nth-of-type(1)',
    )
    .click();
  out = await readOutputs(page);
  assert(out.sectionBCount === "1", `section B = 1 after Health → A (got ${out.sectionBCount})`);
  assert(out.eogPolicyVp === "+1", `policy VP = +1 (triangular 1) (got ${out.eogPolicyVp})`);

  section("Policy change (all 5 to B) — max policy VP");
  for (const policy of [
    "Fiscal Policy",
    "Labor Market",
    "Taxation",
    "Health & Benefits",
    "Education Welfare",
  ]) {
    await page
      .locator(
        `[role="radiogroup"][aria-label="${policy} position"] [role="radio"]:nth-of-type(2)`,
      )
      .click();
  }
  out = await readOutputs(page);
  assert(out.sectionBCount === "5", `section B = 5 (got ${out.sectionBCount})`);
  assert(out.eogPolicyVp === "+15", `policy VP = +15 (triangular 5) (got ${out.eogPolicyVp})`);

  section("Scoring-boost-lost boundary (ops == prosperity)");
  // Bump prosperity to 2 (same as ops). Use Counter +.
  await page.locator('button[aria-label="Increase Prosperity"]').click();
  await page.locator('button[aria-label="Increase Prosperity"]').click();
  out = await readOutputs(page);
  assert(
    /Scoring boost lost/.test(out.alerts ?? ""),
    "scoring boost lost when prosperity catches ops",
  );

  section("Reset restores R1 defaults");
  await page.locator('button:has-text("Reset to Round 1 defaults")').click();
  out = await readOutputs(page);
  assert(out.pop === "10", `pop back to 10 (got ${out.pop})`);
  assert(out.sectionBCount === "2", `section B back to 2 (got ${out.sectionBCount})`);
  assert(out.eogPolicyVp === "+3", `policy VP back to +3 (got ${out.eogPolicyVp})`);

  section("localStorage persistence across navigation");
  await page.locator('button[aria-label="Increase Population"]').click();
  await page.waitForFunction(
    () => {
      const raw = window.localStorage.getItem("mc-companion-inputs-v1");
      if (!raw) return false;
      try {
        return JSON.parse(raw).population === 11;
      } catch {
        return false;
      }
    },
    null,
    { timeout: 5_000 },
  );
  await page.goto(`${BASE_URL}/`);
  await page.goto(ROUTE);
  await page
    .waitForFunction(
      () =>
        document.querySelector('input[aria-label="Population"]')?.value === "11",
      null,
      { timeout: 5_000 },
    )
    .catch(() => {});
  out = await readOutputs(page);
  assert(out.pop === "11", `pop persists as 11 across nav (got ${out.pop})`);

  section("Mobile breakpoint stack (375px)");
  await page.setViewportSize({ width: 375, height: 812 });
  const layout = await page.evaluate(() => {
    const grid = document.querySelector("main .grid");
    const inputs = document.querySelector('[aria-label="Inputs"]');
    const outputs = document.querySelector('[aria-label="Outputs"]');
    const ir = inputs.getBoundingClientRect();
    const or = outputs.getBoundingClientRect();
    return {
      sameLeft: Math.abs(ir.left - or.left) < 2,
      outputsBelow: or.top > ir.bottom - 50,
      cols: window.getComputedStyle(grid).gridTemplateColumns,
    };
  });
  assert(layout.sameLeft, "inputs and outputs share left edge");
  assert(layout.outputsBelow, "outputs stack below inputs");
  assert(!layout.cols.includes(" "), `single column grid (got "${layout.cols}")`);

  await browser.close();

  console.log(`\n${passCount} passed, ${failCount} failed`);
  if (failCount > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
