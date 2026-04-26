import Link from "next/link";

export default function RulesCheatsheetPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-slate-200">
      <Link href="/" className="text-xs text-slate-400 hover:text-slate-200">
        ← Back
      </Link>
      <h1 className="mt-2 text-3xl font-bold">Quick rules reference</h1>
      <p className="mt-2 text-sm text-slate-400">
        Distilled from the official rulebooks bundled in <code>/docs/</code>. Use the rulebook for definitive answers.
      </p>

      <section className="mt-8 space-y-6 text-sm">
        <Block title="Tax multiplier">
          <p>
            Multiplier = <strong>Tax base</strong> + <strong>Health welfare modifier</strong> + <strong>Education welfare modifier</strong>.
          </p>
          <ul className="mt-2 list-disc pl-5 text-slate-300">
            <li>Tax base: A=3, B=2, C=1</li>
            <li>Welfare modifier per generous policy: A=+2, B=+1, C=0</li>
            <li>Range: 1 (low tax + private welfare) to 7 (high tax + universal welfare)</li>
          </ul>
        </Block>

        <Block title="Wages by labor market">
          <ul className="list-disc pl-5">
            <li>Section A: minimum wage L3 (highest)</li>
            <li>Section B: L2 or L3 allowed</li>
            <li>Section C: any wage level allowed (L1 ok)</li>
          </ul>
        </Block>

        <Block title="Public services cost">
          <ul className="list-disc pl-5">
            <li>Section A (Universal): free at point of use, costs the State</li>
            <li>Section B (Subsidized): $5 per use to the State</li>
            <li>Section C (Private): $10 per use, paid to private companies</li>
          </ul>
        </Block>

        <Block title="Foreign trade tariffs">
          <ul className="list-disc pl-5">
            <li>Section A: +$10 / +$6 import surcharge on Food / Luxury; 0 business deals/round</li>
            <li>Section B: +$5 / +$3; 1 deal/round</li>
            <li>Section C: no tariffs; 2 deals/round</li>
          </ul>
        </Block>

        <Block title="VP scoring per round">
          <ul className="list-disc pl-5">
            <li><strong>Working class</strong>: +Prosperity steps grant VP equal to new value; 2 VP per active Trade Union; +1 VP per $10 cash</li>
            <li><strong>Middle class</strong>: +Prosperity, +1 VP per 2 storage goods, +1 VP per $15 cash</li>
            <li><strong>Capitalist class</strong>: VP from Wealth table based on Capital</li>
            <li><strong>State</strong>: VP = sum of two lowest Legitimacy values; +1 VP per Political Agenda match; +1 VP per $30 in Treasury at game end</li>
          </ul>
        </Block>

        <Block title="End-game policy bonuses">
          <ul className="list-disc pl-5">
            <li>Working: 1/4/8/12/18 VP for 1–5 policies in section A</li>
            <li>Middle: 1/3/6/10/15 VP for 1–5 policies in section B</li>
            <li>Capitalist: 1/4/8/12/18 VP for 1–5 policies in section C</li>
          </ul>
        </Block>
      </section>
    </main>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</h2>
      <div className="space-y-1">{children}</div>
    </section>
  );
}
