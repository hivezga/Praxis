import Link from "next/link";

export default function RulesCheatsheetPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <Link href="/" className="text-xs text-slate-500 transition-colors hover:text-slate-300">
        ← Back
      </Link>
      <h1 className="mt-3 text-3xl font-light tracking-tight text-slate-100">
        Quick rules reference
      </h1>
      <p className="mt-2 text-sm text-slate-500">
        Distilled from the official rulebooks in <code className="font-mono text-slate-400">/docs/</code>.
        Use the rulebook for definitive answers.
      </p>

      <div className="mt-8 space-y-4">
        <Block title="Tax multiplier">
          <p className="text-slate-300">
            Multiplier = <strong className="font-semibold">Tax base</strong> +{" "}
            <strong className="font-semibold">Health welfare modifier</strong> +{" "}
            <strong className="font-semibold">Education welfare modifier</strong>
          </p>
          <Table
            headers={["Track position", "Tax base", "Welfare modifier"]}
            rows={[
              ["Section A", "3", "+2"],
              ["Section B", "2", "+1"],
              ["Section C", "1", "0"],
            ]}
          />
          <p className="text-xs text-slate-500">
            Range: 1 (low tax + private welfare) to 7 (high tax + universal welfare)
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
          <ul className="space-y-2 text-slate-300">
            <li>
              <span className="font-semibold text-working">Working class</span> — VP for each
              Prosperity step gained (= new value); +2 VP per active Trade Union (≥4 workers);
              +1 VP per $10 cash
            </li>
            <li>
              <span className="font-semibold text-middle">Middle class</span> — VP for Prosperity
              steps; +1 VP per 2 storage goods; +1 VP per $15 cash
            </li>
            <li>
              <span className="font-semibold text-capitalist">Capitalist class</span> — VP from
              Wealth table based on Capital value
            </li>
            <li>
              <span className="font-semibold text-state">State</span> — VP = sum of two lowest
              Legitimacy values; +1 VP per Political Agenda match; +1 VP per $30 in Treasury
              at game end
            </li>
          </ul>
        </Block>

        <Block title="End-game policy bonuses">
          <Table
            headers={["Policies in favored section", "1", "2", "3", "4", "5"]}
            rows={[
              ["Working (section A)", "1", "4", "8", "12", "18"],
              ["Middle (section B)",  "1", "3", "6", "10", "15"],
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
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-slate-500">
        {title}
      </h2>
      <div className="space-y-3 text-sm">{children}</div>
    </section>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800">
            {headers.map((h) => (
              <th
                key={h}
                className="py-1.5 pr-4 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500 first:pl-0"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={`py-2 pr-4 first:pl-0 ${
                    j === 0 ? "text-slate-300" : "font-mono text-slate-400"
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
