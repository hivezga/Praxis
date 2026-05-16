// End-to-end smoke for /tools/working-class.
//
// Caller must run `pnpm dev` or `pnpm start` separately (BASE_URL env to
// override). Exits 0 on success, 1 on first failed assertion. Run from
// apps/web: `node scripts/wc-companion-smoke.mjs`.
//
// Coverage matches the manual Playwright walk verified during ticket
// implementation: R1 defaults, dispatch recompute, C&C toggle, policy
// change, alerts, TU eligibility/form, reset, localStorage persistence,
// mobile breakpoint. Pure functional checks are already covered by Vitest
// in lib/tools/__tests__/wc-companion.test.ts — this script is the
// integration layer.

import { chromium } from "playwright";

import { BASE_URL } from "./_lib.mjs";

const ROUTE = `${BASE_URL}/tools/working-class`;

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
      .find((p) => p.textContent === "Action Alerts")
      ?.closest("div")
      ?.textContent?.trim();
    return {
      pop: document.querySelector('input[aria-label="Population"]')?.value,
      multiplier: findDd("Tax multiplier"),
      taxPerUnit: findDd("Income tax / unit"),
      wcTax: findDd("WC income tax"),
      foodBill: findDd("Food bill"),
      bundle: findDd("Bundle cost"),
      wagesNeeded: findDd("Wages needed"),
      chips,
      alerts,
    };
  });
}

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  // Clean slate — clear any persisted state from prior runs.
  await page.goto(ROUTE);
  await page.evaluate(() => {
    window.localStorage.removeItem("wc-companion-inputs-v1");
    window.localStorage.removeItem("wc-r1-banner-dismissed");
  });
  await page.reload();

  section("Round 1 defaults");
  let out = await readOutputs(page);
  assert(out.pop === "15", `population = 15 (got ${out.pop})`);
  assert(out.multiplier === "×5", `tax multiplier = ×5 (got ${out.multiplier})`);
  assert(out.taxPerUnit === "4¥", `income tax/unit = 4¥ (got ${out.taxPerUnit})`);
  assert(out.wcTax === "60¥", `WC income tax = 60¥ (got ${out.wcTax})`);
  assert(out.foodBill === "45¥", `food bill = 45¥ (got ${out.foodBill})`);
  assert(out.bundle === "210¥", `bundle cost = 210¥ (got ${out.bundle})`);
  assert(out.wagesNeeded === "270¥", `wages needed = 270¥ (got ${out.wagesNeeded})`);

  section("Dispatch + recompute (population +1)");
  await page.locator('button[aria-label="Increase Population"]').click();
  out = await readOutputs(page);
  assert(out.pop === "16", `population = 16 (got ${out.pop})`);
  assert(out.wcTax === "64¥", `WC income tax recomputes to 64¥ (got ${out.wcTax})`);

  section("Crisis & Control toggle reveals coop fields");
  await page.getByRole("checkbox", { name: "Crisis & Control expansion" }).click();
  const hasHealth = await page.locator('input[aria-label="Health coops"]').count();
  const hasEdu = await page.locator('input[aria-label="Education coops"]').count();
  assert(hasHealth === 1, "Health coops counter appears");
  assert(hasEdu === 1, "Education coops counter appears");

  section("Policy change (Taxation A → C)");
  await page
    .locator('[role="radiogroup"][aria-label="Taxation position"] [role="radio"]:nth-of-type(3)')
    .click();
  out = await readOutputs(page);
  assert(out.multiplier === "×1", `multiplier collapses to ×1 (got ${out.multiplier})`);
  assert(
    out.chips.join("|") === "0 Good|5 Neutral|2 Trouble",
    `chips = 0G/5N/2T (got ${out.chips.join("|")})`,
  );

  section("Strike alert fires at wage level 2");
  await page
    .locator('[role="radiogroup"][aria-label="Lowest wage level"] [role="radio"]:nth-of-type(2)')
    .click();
  out = await readOutputs(page);
  assert(/Strike risk/.test(out.alerts ?? ""), "strike alert visible");

  section("Demonstration boundary (unemp > vacancies + 2)");
  for (let i = 0; i < 2; i++) {
    await page.locator('button[aria-label="Increase Unemployed"]').click();
  }
  out = await readOutputs(page);
  assert(!/Demonstration risk/.test(out.alerts ?? ""), "no demo alert at unemp=2");
  await page.locator('button[aria-label="Increase Unemployed"]').click();
  out = await readOutputs(page);
  assert(/Demonstration risk/.test(out.alerts ?? ""), "demo alert fires at unemp=3");

  section("Trade Union eligibility + form");
  // Fill via Playwright role lookup since the colour inputs don't have wrapping labels.
  await page.getByRole("spinbutton", { name: "red employed" }).fill("4");
  const beforeForm = await page.evaluate(() => {
    const li = [...document.querySelectorAll("li")].find((el) =>
      el.textContent?.includes("Red — industrial"),
    );
    return li?.textContent ?? "";
  });
  assert(beforeForm.includes("Eligible"), "red shows Eligible badge after 4 employed");
  await page.locator('li:has-text("Red — industrial") button:not([disabled])').click();
  const afterForm = await page.evaluate(() => {
    const li = [...document.querySelectorAll("li")].find((el) =>
      el.textContent?.includes("Red — industrial"),
    );
    const tuFooter = [...document.querySelectorAll("p")].find((p) =>
      p.textContent?.startsWith("TU VP now"),
    )?.textContent ?? "";
    return { li: li?.textContent ?? "", footer: tuFooter };
  });
  assert(afterForm.li.includes("Formed"), "red flips to Formed after click");
  assert(/TU VP now:\s*1/.test(afterForm.footer), "TU VP now = 1 after first formation");

  section("Reset restores R1 defaults");
  await page.locator('button:has-text("Reset to Round 1 defaults")').click();
  out = await readOutputs(page);
  assert(out.pop === "15", `pop back to 15 (got ${out.pop})`);
  assert(out.multiplier === "×5", `multiplier back to ×5 (got ${out.multiplier})`);
  assert(out.wcTax === "60¥", `WC income tax back to 60¥ (got ${out.wcTax})`);

  section("localStorage persistence across navigation");
  await page.locator('button[aria-label="Increase Population"]').click();
  await page.locator('button[aria-label="Increase Population"]').click();
  // Wait for the persistence useEffect to flush the new state to localStorage
  // before navigating — clicks resolve before React schedules the write.
  await page.waitForFunction(() => {
    const raw = window.localStorage.getItem("wc-companion-inputs-v1");
    if (!raw) return false;
    try {
      return JSON.parse(raw).population === 17;
    } catch {
      return false;
    }
  }, null, { timeout: 5_000 });
  await page.goto(`${BASE_URL}/`);
  await page.goto(ROUTE);
  // Wait for the hydration effect to dispatch and re-render with stored value.
  await page
    .waitForFunction(
      () =>
        document.querySelector('input[aria-label="Population"]')?.value === "17",
      null,
      { timeout: 5_000 },
    )
    .catch(() => {});
  out = await readOutputs(page);
  assert(out.pop === "17", `pop persists as 17 across nav (got ${out.pop})`);

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
  assert(!/\bgap|repeat\b/.test(layout.cols) && !layout.cols.includes(" "), `single column grid (got "${layout.cols}")`);

  await browser.close();

  console.log(`\n${passCount} passed, ${failCount} failed`);
  if (failCount > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
