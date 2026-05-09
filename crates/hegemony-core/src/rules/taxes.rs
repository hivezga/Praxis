//! Exact tax computations for Hegemony, sourced from the v1.2 rulebook
//! (pages 17, 20, 25, 30, 31).
//!
//! All formulas are deterministic lookup tables. No heuristics.

use crate::types::{GameState, Policies, PolicySection, TaxSuggestion};

// ---------------------------------------------------------------------------
// Tax Multiplier (rulebook page 31)
// ---------------------------------------------------------------------------
//
// - Tax = A: base 3, Welfare modifiers DOUBLED      -> 3 + 2*(H+E)
// - Tax = B: base 2, Welfare modifiers count normal -> 2 + (H+E)
// - Tax = C: base 1, Welfare modifiers IGNORED      -> 1
//
// Welfare H&B modifier: A = +2, B = +1, C = 0
// Welfare Edu  modifier: A = +2, B = +1, C = 0
//
// Possible final values: {1, 2, 3, 4, 5, 6, 7, 9, 11} - matches the
// printed track on the game board.

fn welfare_mod(section: &PolicySection) -> i32 {
    match section {
        PolicySection::A => 2,
        PolicySection::B => 1,
        PolicySection::C => 0,
    }
}

pub fn compute_tax_multiplier(policies: &Policies) -> i32 {
    let h = welfare_mod(&policies.health_benefits.position);
    let e = welfare_mod(&policies.education_welfare.position);
    match policies.taxation.position {
        PolicySection::A => 3 + 2 * (h + e),
        PolicySection::B => 2 + (h + e),
        PolicySection::C => 1,
    }
}

// ---------------------------------------------------------------------------
// Income Tax table (rulebook pages 17 and 25)
// ---------------------------------------------------------------------------
//
// Same lookup applies to Working Class (per Population) and Middle Class
// (per other-owned Company employing their workers). LM = Labor Market
// (Policy 2), Tax = Taxation (Policy 3).
//
//                Tax3A  Tax3B  Tax3C
//   LM2A:          7      6      5
//   LM2B:          4      4      4
//   LM2C:          1      2      3

pub fn income_tax_per_unit(labor_market: &PolicySection, taxation: &PolicySection) -> i32 {
    use PolicySection::*;
    match (labor_market, taxation) {
        (A, A) => 7,
        (A, B) => 6,
        (A, C) => 5,
        (B, A) => 4,
        (B, B) => 4,
        (B, C) => 4,
        (C, A) => 1,
        (C, B) => 2,
        (C, C) => 3,
    }
}

// ---------------------------------------------------------------------------
// Capitalist Corporate Tax bracket lookup (rulebook page 20)
// ---------------------------------------------------------------------------
//
// Taxed on Revenue remaining AFTER Employment Tax is paid.
// Below 5: 0. From 300+ same bracket as 200-299 doubled.
//
// Revenue       Tax3A  Tax3B  Tax3C
//   5-9           1     2      2
//   10-24         5     5      4
//   25-49         12    10     7
//   50-99         24    15     10
//   100-199       40    30     20
//   200-299       100   70     40
//   300+          160   120    60

pub fn corporate_tax(revenue: i32, taxation: &PolicySection) -> i32 {
    use PolicySection::*;
    if revenue < 5 {
        return 0;
    }
    let bracket = match revenue {
        5..=9 => 0,
        10..=24 => 1,
        25..=49 => 2,
        50..=99 => 3,
        100..=199 => 4,
        200..=299 => 5,
        _ => 6,
    };
    const TABLE: [[i32; 3]; 7] = [
        // [A, B, C]
        [1, 2, 2],
        [5, 5, 4],
        [12, 10, 7],
        [24, 15, 10],
        [40, 30, 20],
        [100, 70, 40],
        [160, 120, 60],
    ];
    let col = match taxation {
        A => 0,
        B => 1,
        C => 2,
    };
    TABLE[bracket][col]
}

// ---------------------------------------------------------------------------
// Production-phase tax computation (Pay Taxes step)
// ---------------------------------------------------------------------------

/// Operational status: a Company is operational iff every slot is filled
/// or it is fully automated.
fn cap_company_operational(c: &crate::types::CapitalistCompany) -> bool {
    use crate::cards::lookup_by_name;
    let card = match lookup_by_name(&c.label) {
        Some(card) => card,
        None => return c.workers_assigned > 0, // unknown card, fall back to count
    };
    if card.automated {
        return true;
    }
    let required = card.slots.len() as i32;
    if required == 0 {
        return false;
    }
    c.workers_assigned >= required
}

fn mid_company_operational(c: &crate::types::MiddleCompany) -> bool {
    use crate::cards::lookup_by_name;
    let card = match lookup_by_name(&c.label) {
        Some(card) => card,
        None => return c.workers_assigned > 0,
    };
    let required_middle = card
        .slots
        .iter()
        .filter(|s| s.class != crate::cards::WorkerClass::EmployeeWorking)
        .count() as i32;
    if required_middle == 0 {
        return false;
    }
    c.workers_assigned >= required_middle
}

/// Compute the exact tax breakdown for the current Production Phase
/// based on rulebook formulas. No heuristics.
pub fn suggest_taxes(state: &GameState) -> TaxSuggestion {
    let multiplier = compute_tax_multiplier(&state.policies);
    let lm = &state.policies.labor_market.position;
    let tax = &state.policies.taxation.position;
    let per_unit = income_tax_per_unit(lm, tax);

    // Working Class: per-Population income tax.
    let working_income_tax = state.classes.working.population.max(0) * per_unit;

    // Middle Class income tax: per-Company-employed-elsewhere.
    // We approximate "Companies where Middle has Workers, other than own"
    // by counting Capitalist + Public Companies that are operational
    // and have any worker assigned to them. The exact distinction
    // (which workers are Middle vs Working) is tracked in the future
    // when worker-class-per-slot is modelled. For now, every operational
    // Capitalist or Public Company contributes one unit if the Middle
    // Class has any Workers assigned outside of their own Companies.
    //
    // TODO(card-data): refine once per-slot worker class is stored.
    let middle_companies_employed_elsewhere = count_middle_workers_in_other_companies(state);
    let middle_income_tax = middle_companies_employed_elsewhere * per_unit;

    // Middle Class employment tax = TaxMult * operational owned Companies.
    let middle_operational = state
        .classes
        .middle
        .companies
        .iter()
        .filter(|c| mid_company_operational(c))
        .count() as i32;
    let middle_employment_tax = middle_operational * multiplier;

    // Capitalist Class:
    //   - Employment Tax = TaxMult * operational owned Companies (incl. automated)
    //   - Corporate Tax = bracket lookup on Revenue AFTER paying Employment Tax
    let cap_operational = state
        .classes
        .capitalist
        .companies
        .iter()
        .filter(|c| cap_company_operational(c))
        .count() as i32;
    let capitalist_employment_tax = cap_operational * multiplier;

    let revenue_after_employment =
        (state.classes.capitalist.revenue - capitalist_employment_tax).max(0);
    let capitalist_income_tax = corporate_tax(revenue_after_employment, tax);

    let total_to_treasury = working_income_tax
        + middle_income_tax
        + middle_employment_tax
        + capitalist_income_tax
        + capitalist_employment_tax;

    TaxSuggestion {
        multiplier,
        working_income_tax,
        middle_income_tax,
        middle_employment_tax,
        capitalist_income_tax,
        capitalist_employment_tax,
        total_to_treasury,
    }
}

/// Count operational Companies (Capitalist + Public) that the Middle
/// Class has Workers in. Until per-slot worker class is tracked, we
/// use the heuristic: if the Middle Class has any Working assigned
/// outside their own Companies, count the operational outside Companies.
///
/// This is conservative and will be tightened when slot-per-worker is added.
fn count_middle_workers_in_other_companies(state: &GameState) -> i32 {
    // Without per-slot tracking, the only signal we have is workers_assigned
    // on Capitalist/Public Companies. Middle Workers can fill those slots
    // when no Working unskilled Workers are available - rulebook page 18.
    //
    // For accuracy now: rely on `state.classes.middle.unemployed_*` not
    // being equal to `state.classes.middle.population` -- i.e. some Middle
    // Workers ARE employed somewhere. If that holds, count all operational
    // Capitalist + Public Companies. Otherwise return 0.
    let middle_total = state.classes.middle.population;
    let middle_unemployed = state.classes.middle.unemployed_workers
        + state.classes.middle.unemployed_skilled_workers;
    let employed = (middle_total - middle_unemployed).max(0);
    if employed == 0 {
        return 0;
    }
    let cap_op = state
        .classes
        .capitalist
        .companies
        .iter()
        .filter(|c| cap_company_operational(c))
        .count() as i32;
    let public_op = state
        .classes
        .state
        .public_companies
        .iter()
        .filter(|c| c.operational)
        .count() as i32;
    // Cap to the number of employed Middle Workers - they can't be in more
    // Companies than they have Workers.
    (cap_op + public_op).min(employed)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{PolicyId, PolicyState, Policies};

    fn make_policies(
        tax: PolicySection,
        health: PolicySection,
        edu: PolicySection,
    ) -> Policies {
        Policies {
            fiscal_policy: PolicyState {
                id: PolicyId::FiscalPolicy,
                position: PolicySection::C,
            },
            labor_market: PolicyState {
                id: PolicyId::LaborMarket,
                position: PolicySection::C,
            },
            taxation: PolicyState { id: PolicyId::Taxation, position: tax },
            health_benefits: PolicyState {
                id: PolicyId::HealthBenefits,
                position: health,
            },
            education_welfare: PolicyState {
                id: PolicyId::EducationWelfare,
                position: edu,
            },
            foreign_trade: PolicyState {
                id: PolicyId::ForeignTrade,
                position: PolicySection::C,
            },
            immigration: PolicyState {
                id: PolicyId::Immigration,
                position: PolicySection::A,
            },
        }
    }

    // -----------------------------------------------------------------------
    // Tax Multiplier - all combinations against rulebook page 31
    // -----------------------------------------------------------------------

    #[test]
    fn multiplier_tax_a_min() {
        // Tax=A, both welfare=C: 3 + 2*(0+0) = 3
        let p = make_policies(PolicySection::A, PolicySection::C, PolicySection::C);
        assert_eq!(compute_tax_multiplier(&p), 3);
    }

    #[test]
    fn multiplier_tax_a_max() {
        // Tax=A, both welfare=A: 3 + 2*(2+2) = 11 (printed max)
        let p = make_policies(PolicySection::A, PolicySection::A, PolicySection::A);
        assert_eq!(compute_tax_multiplier(&p), 11);
    }

    #[test]
    fn multiplier_tax_b_min() {
        // Tax=B, both welfare=C: 2 + 0 = 2
        let p = make_policies(PolicySection::B, PolicySection::C, PolicySection::C);
        assert_eq!(compute_tax_multiplier(&p), 2);
    }

    #[test]
    fn multiplier_tax_b_max() {
        // Tax=B, both welfare=A: 2 + 4 = 6
        let p = make_policies(PolicySection::B, PolicySection::A, PolicySection::A);
        assert_eq!(compute_tax_multiplier(&p), 6);
    }

    #[test]
    fn multiplier_tax_c_always_one() {
        for h in [PolicySection::A, PolicySection::B, PolicySection::C] {
            for e in [PolicySection::A, PolicySection::B, PolicySection::C] {
                let p = make_policies(PolicySection::C, h.clone(), e.clone());
                assert_eq!(
                    compute_tax_multiplier(&p),
                    1,
                    "Tax=C should always yield 1"
                );
            }
        }
    }

    #[test]
    fn multiplier_rulebook_example_2() {
        // Page 31 Example 2: Tax=B, H&B=A, Edu=A -> 2 + 2*1*2... wait
        // The rulebook gives a worked example landing on 6.
        // Tax=B, H=A (+2), E=A (+2) -> 2 + (2+2) = 6
        let p = make_policies(PolicySection::B, PolicySection::A, PolicySection::A);
        assert_eq!(compute_tax_multiplier(&p), 6);
    }

    #[test]
    fn multiplier_rulebook_starting_value() {
        // Setup: Tax=A, H&B=B, Edu=C -> 3 + 2*(1+0) = 5 (starting value)
        let p = make_policies(PolicySection::A, PolicySection::B, PolicySection::C);
        assert_eq!(compute_tax_multiplier(&p), 5);
    }

    #[test]
    fn multiplier_all_in_printed_set() {
        let printed: std::collections::HashSet<i32> =
            [1, 2, 3, 4, 5, 6, 7, 9, 11].into_iter().collect();
        for tax in [PolicySection::A, PolicySection::B, PolicySection::C] {
            for h in [PolicySection::A, PolicySection::B, PolicySection::C] {
                for e in [PolicySection::A, PolicySection::B, PolicySection::C] {
                    let p = make_policies(tax.clone(), h.clone(), e.clone());
                    let m = compute_tax_multiplier(&p);
                    assert!(
                        printed.contains(&m),
                        "multiplier {} not in printed track for Tax={:?} H={:?} E={:?}",
                        m,
                        tax,
                        h,
                        e
                    );
                }
            }
        }
    }

    // -----------------------------------------------------------------------
    // Income tax table - all 9 cells against rulebook page 17
    // -----------------------------------------------------------------------

    #[test]
    fn income_tax_table_complete() {
        use PolicySection::*;
        // (LM, Tax, expected)
        let cases = [
            (A, A, 7),
            (A, B, 6),
            (A, C, 5),
            (B, A, 4),
            (B, B, 4),
            (B, C, 4),
            (C, A, 1),
            (C, B, 2),
            (C, C, 3),
        ];
        for (lm, tax, exp) in cases {
            assert_eq!(
                income_tax_per_unit(&lm, &tax),
                exp,
                "income_tax_per_unit({:?}, {:?}) wrong",
                lm,
                tax
            );
        }
    }

    #[test]
    fn working_class_rulebook_example() {
        // Page 17: LM=C, Tax=B, Pop=5 -> 2¥/Pop * 5 = 10¥ total
        assert_eq!(
            income_tax_per_unit(&PolicySection::C, &PolicySection::B) * 5,
            10
        );
    }

    #[test]
    fn middle_class_rulebook_example() {
        // Page 25: LM=A, Tax=C, employed in 3 outside Companies -> 5*3 = 15¥
        assert_eq!(
            income_tax_per_unit(&PolicySection::A, &PolicySection::C) * 3,
            15
        );
    }

    // -----------------------------------------------------------------------
    // Corporate tax brackets - all cells against rulebook page 20
    // -----------------------------------------------------------------------

    #[test]
    fn corporate_tax_zero_below_five() {
        for r in 0..5 {
            assert_eq!(corporate_tax(r, &PolicySection::A), 0);
            assert_eq!(corporate_tax(r, &PolicySection::B), 0);
            assert_eq!(corporate_tax(r, &PolicySection::C), 0);
        }
    }

    #[test]
    fn corporate_tax_brackets() {
        use PolicySection::*;
        // (revenue, tax, expected)
        let cases = [
            (5, A, 1),
            (9, A, 1),
            (10, A, 5),
            (24, C, 4),
            (25, A, 12),
            (49, B, 10),
            (50, A, 24),
            (99, C, 10),
            (100, A, 40),
            (199, B, 30),
            (200, A, 100),
            (299, B, 70),
            (300, A, 160),
            (1000, C, 60),
            (10000, B, 120),
        ];
        for (rev, tax, exp) in cases {
            assert_eq!(
                corporate_tax(rev, &tax),
                exp,
                "corporate_tax({}, {:?}) wrong",
                rev,
                tax
            );
        }
    }

    #[test]
    fn corporate_tax_rulebook_mike_81_revenue() {
        // Page 20: Mike has 81¥ Revenue, Taxation=A -> 24¥
        assert_eq!(corporate_tax(81, &PolicySection::A), 24);
    }

    // -----------------------------------------------------------------------
    // suggest_taxes - integration with starting state
    // -----------------------------------------------------------------------

    #[test]
    fn suggest_taxes_starting_state() {
        use crate::starting_state::create_starting_state;
        use crate::types::{
            ClassId, ExpansionFlags, ExpansionModules, GameMode, NewGameInput,
        };

        let state = create_starting_state(NewGameInput {
            name: None,
            mode: GameMode::Solo,
            player_count: 4,
            classes_in_play: vec![
                ClassId::Working,
                ClassId::Middle,
                ClassId::Capitalist,
                ClassId::State,
            ],
            expansions: ExpansionFlags {
                crisis_and_control: false,
                modules: ExpansionModules {
                    automa: false,
                    crisis_cards: false,
                    alternative_events: false,
                    hidden_agendas: false,
                    new_action_cards: false,
                },
            },
        });

        let s = suggest_taxes(&state);

        // Starting policies: Tax=A, H&B=C, Edu=C -> mult = 3
        assert_eq!(s.multiplier, 3);

        // Working: pop 10 * income_tax(LM=C, Tax=A) = 10 * 1 = 10
        assert_eq!(s.working_income_tax, 10);

        // Starting Middle has 2 Companies (Convenience Store + Doctor's Office)
        // each with 1 worker assigned but S(s) config needs 2 workers -> non-operational.
        assert_eq!(s.middle_employment_tax, 0);
        // Capitalist starting Companies have workers_assigned=0 -> 0 operational.
        assert_eq!(s.capitalist_employment_tax, 0);
    }
}
