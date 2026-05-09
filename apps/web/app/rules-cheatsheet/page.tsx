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

      <header className="mb-12 mt-6 border-b border-rule/40 pb-8">
        <p className="poster-eyebrow">A field guide</p>
        <h1 className="poster-h1 mt-3">Quick rules reference</h1>
        <p className="mt-4 max-w-xl font-serif text-fluid-sm italic leading-relaxed text-inkMute">
          Distilled from the official rulebooks bundled in{" "}
          <code className="not-italic font-mono text-inkSoft">/docs/</code>. The
          rulebook remains the definitive answer.
        </p>
      </header>

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
