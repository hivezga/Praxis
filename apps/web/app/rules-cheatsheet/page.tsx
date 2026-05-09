import Link from "next/link";

export default function RulesCheatsheetPage() {
  return (
    <main id="main" className="mx-auto max-w-3xl px-5 py-12 sm:px-6 sm:py-16">
      <Link
        href="/"
        className="inline-flex min-h-tap items-center font-serif text-fluid-sm italic text-inkMute transition-colors hover:text-inkSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        ← Back to home
      </Link>

      <header className="mb-12 mt-6">
        <p className="poster-eyebrow">Field manual</p>
        <h1 className="poster-h1 mt-3">Rules at a glance</h1>
        <hr className="mt-4 border-0 border-t-2 border-rule/60" />
        <p className="mt-4 max-w-2xl font-serif text-fluid-base italic leading-relaxed text-inkSoft text-pretty">
          A two-page field manual for the order of operations every round, what each
          phase pays, and the legal moves available to each class. The rulebooks
          bundled in <code className="not-italic font-mono text-inkSoft">/docs/</code>{" "}
          remain the definitive answer.
        </p>
      </header>

      <div className="mb-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
        <RuleColumn
          title="Round in five movements"
          items={[
            ["Preparation", "Reset action markers, refresh cards, place new production tiles, return spent voting cubes."],
            ["Action",      "Players take turns playing action cards. Continue until everyone has passed."],
            ["Production",  "Workers produce goods at assigned companies. Capitalist & Middle pay wages."],
            ["Elections",   "Resolve pending bills. Vote with cubes drawn from each class's bag."],
            ["Scoring",     "Apply taxes, welfare costs, prosperity gains and VP. Use the End-round wizard."],
          ]}
        />
        <RuleColumn
          title="What each class wants"
          items={[
            ["Working — Solidarity",   "Maximize prosperity; avoid emigration. Score VP from public services and union strength."],
            ["Middle — Enterprise",    "Own and run companies; balance loans against revenue. Score VP from companies and influence."],
            ["Capitalist — Capital",   "Accumulate capital and pass laissez-faire bills. Score VP from capital, FTZ goods and stocks."],
            ["State — Sovereignty",    "Keep treasury solvent; supply public services. Score VP from state companies and policies."],
          ]}
        />
      </div>

      <section className="mb-10">
        <p className="poster-eyebrow mb-2">Common mistakes</p>
        <h2 className="font-display text-poster-md uppercase tracking-tight text-ink">
          Things tables get wrong
        </h2>
        <hr className="mt-4 border-0 border-t-2 border-rule/60" />
        <ul className="mt-2">
          {[
            ["Wages before goods.",    "Pay wages first in Production. Only then do workers' goods enter storage."],
            ["Bill markers persist.",  "Each class has 3 bill markers. Returned only when a bill resolves."],
            ["Influence ≠ media.",     "Spending Influence is one resource; Media influence (track) is another. Don't conflate."],
            ["Foreign capital is a pool.", "Workers and Middle hire from population pools; Capitalist may hire foreign capital separately."],
          ].map(([head, body]) => (
            <li
              key={head}
              className="grid grid-cols-[auto_1fr] gap-4 border-b border-rule/30 py-4"
            >
              <span aria-hidden className="pt-1 text-inkMute">◆</span>
              <div>
                <div className="font-display text-fluid-base uppercase tracking-tight text-ink">
                  {head}
                </div>
                <p className="mt-1 font-serif text-fluid-sm italic leading-relaxed text-inkSoft">
                  {body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-6">
        <p className="poster-eyebrow mb-2">Numbers desk</p>
        <h2 className="font-display text-poster-md uppercase tracking-tight text-ink">
          Tables &amp; modifiers
        </h2>
        <hr className="mt-4 border-0 border-t-2 border-rule/60" />
      </section>

      <div className="space-y-8">
        <Block title="Tax multiplier">
          <p className="font-serif text-fluid-base leading-relaxed text-inkSoft">
            Multiplier ={" "}
            <strong className="font-medium text-ink">Tax base</strong> +{" "}
            <strong className="font-medium text-ink">Health welfare modifier</strong>{" "}
            +{" "}
            <strong className="font-medium text-ink">Education welfare modifier</strong>
          </p>
          <Table
            headers={["Track position", "Tax base", "Welfare modifier"]}
            rows={[
              ["Section A", "3", "+2"],
              ["Section B", "2", "+1"],
              ["Section C", "1", "0"],
            ]}
          />
          <p className="font-serif text-fluid-xs italic text-inkMute">
            Range: 1 (low tax + private welfare) to 7 (high tax + universal welfare).
          </p>
        </Block>

        <Block title="Wages by labor market">
          <Table
            headers={["Labor market", "Minimum wage level"]}
            rows={[
              ["Section A", "L3 (highest)"],
              ["Section B", "L2 or L3"],
              ["Section C", "Any (L1 allowed)"],
            ]}
          />
        </Block>

        <Block title="Public services cost">
          <Table
            headers={["Section", "Policy", "Cost per use"]}
            rows={[
              ["A", "Universal", "Free (State pays)"],
              ["B", "Subsidized", "$5 to State"],
              ["C", "Private", "$10 to companies"],
            ]}
          />
        </Block>

        <Block title="Foreign trade tariffs">
          <Table
            headers={["Section", "Food surcharge", "Luxury surcharge", "Business deals/round"]}
            rows={[
              ["A", "+$10", "+$6", "0"],
              ["B", "+$5",  "+$3", "1"],
              ["C", "none", "none", "2"],
            ]}
          />
        </Block>

        <Block title="VP scoring per round">
          <ul className="space-y-3 font-serif text-fluid-base leading-relaxed text-inkSoft">
            <li>
              <FactionTag classId="working" /> Working class — VP for each Prosperity step
              gained (= new value); +2 VP per active Trade Union (≥4 workers); +1 VP per
              $10 cash.
            </li>
            <li>
              <FactionTag classId="middle" /> Middle class — VP for Prosperity steps; +1 VP
              per 2 storage goods; +1 VP per $15 cash.
            </li>
            <li>
              <FactionTag classId="capitalist" /> Capitalist class — VP from the Wealth
              table based on Capital value.
            </li>
            <li>
              <FactionTag classId="state" /> The State — VP equal to the sum of the two
              lowest Legitimacy values; +1 VP per Political Agenda match; +1 VP per $30 in
              Treasury at game end.
            </li>
          </ul>
        </Block>

        <Block title="End-game policy bonuses">
          <Table
            headers={["Policies in favored section", "1", "2", "3", "4", "5"]}
            rows={[
              ["Working (section A)",    "1", "4", "8", "12", "18"],
              ["Middle (section B)",     "1", "3", "6", "10", "15"],
              ["Capitalist (section C)", "1", "4", "8", "12", "18"],
            ]}
          />
        </Block>
      </div>
    </main>
  );
}

function RuleColumn({ title, items }: { title: string; items: [string, string][] }) {
  return (
    <div>
      <h3 className="font-display text-fluid-xl uppercase tracking-tight text-ink">
        {title}
      </h3>
      <hr className="mt-2 border-t border-rule/40" />
      <ol className="mt-1">
        {items.map(([head, body], i) => (
          <li
            key={head}
            className="grid grid-cols-[auto_1fr] gap-4 border-b border-rule/30 py-4 last:border-b-0"
          >
            <span className="pt-1 font-mono text-xs text-inkMute">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <div className="font-display text-fluid-base uppercase tracking-tight text-ink">
                {head}
              </div>
              <p className="mt-1 font-serif text-fluid-sm italic leading-relaxed text-inkSoft">
                {body}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-rule/60 bg-surface/30 p-5 sm:p-6">
      <h2 className="mb-4 border-b border-rule/40 pb-3 font-display text-poster-md uppercase tracking-tight text-ink">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function FactionTag({ classId }: { classId: "working" | "middle" | "capitalist" | "state" }) {
  const tint: Record<typeof classId, string> = {
    working:    "bg-working text-working-ink",
    middle:     "bg-middle text-middle-ink",
    capitalist: "bg-capitalist text-capitalist-ink",
    state:      "bg-state text-state-ink",
  };
  return (
    <span
      aria-hidden
      className={`mr-1 inline-block h-3 w-3 rounded-sm ${tint[classId]}`}
    />
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-fluid-sm">
        <thead>
          <tr className="border-b border-rule/60">
            {headers.map((h) => (
              <th
                key={h}
                className="py-2 pr-4 text-left font-display text-[10px] font-normal uppercase tracking-[0.2em] text-inkMute first:pl-0"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-rule/30">
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`py-2.5 pr-4 first:pl-0 ${
                    j === 0
                      ? "font-serif text-inkSoft"
                      : "font-mono text-inkSoft"
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
