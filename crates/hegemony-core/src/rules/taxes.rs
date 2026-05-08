use crate::types::{GameState, Policies, PolicySection, TaxSuggestion};

// Base tax value per Taxation policy section.
fn tax_base(section: &PolicySection) -> i32 {
    match section {
        PolicySection::A => 3,
        PolicySection::B => 2,
        PolicySection::C => 1,
    }
}

// Welfare-policy modifier per section.
fn welfare_mod(section: &PolicySection) -> i32 {
    match section {
        PolicySection::A => 2,
        PolicySection::B => 1,
        PolicySection::C => 0,
    }
}

/// Compute the tax multiplier from the current policy positions.
pub fn compute_tax_multiplier(policies: &Policies) -> i32 {
    let base = tax_base(&policies.taxation.position);
    let welfare = welfare_mod(&policies.health_benefits.position)
        + welfare_mod(&policies.education_welfare.position);
    base + welfare
}

/// Generate a heuristic tax suggestion based on the current game state.
pub fn suggest_taxes(state: &GameState) -> TaxSuggestion {
    let m = compute_tax_multiplier(&state.policies);
    let working = &state.classes.working;
    let middle = &state.classes.middle;
    let capitalist = &state.classes.capitalist;

    let working_income_tax = (working.population as f64 * m as f64 * 0.5).floor() as i32;
    let working_income_tax = working_income_tax.max(0);

    let middle_income_tax = (middle.population as f64 * m as f64 * 0.5).floor() as i32;
    let middle_income_tax = middle_income_tax.max(0);

    let middle_employment_tax = middle.companies.len() as i32 * m;

    let capitalist_income_tax = (capitalist.revenue / 10) * m;

    let capitalist_employment_tax = capitalist.companies.len() as i32 * m;

    let total_to_treasury = working_income_tax
        + middle_income_tax
        + middle_employment_tax
        + capitalist_income_tax
        + capitalist_employment_tax;

    TaxSuggestion {
        multiplier: m,
        working_income_tax,
        middle_income_tax,
        middle_employment_tax,
        capitalist_income_tax,
        capitalist_employment_tax,
        total_to_treasury,
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{PolicyId, PolicyState, Policies};

    fn make_policies(tax: PolicySection, health: PolicySection, edu: PolicySection) -> Policies {
        Policies {
            fiscal_policy: PolicyState { id: PolicyId::FiscalPolicy, position: PolicySection::C },
            labor_market: PolicyState { id: PolicyId::LaborMarket, position: PolicySection::C },
            taxation: PolicyState { id: PolicyId::Taxation, position: tax },
            health_benefits: PolicyState { id: PolicyId::HealthBenefits, position: health },
            education_welfare: PolicyState { id: PolicyId::EducationWelfare, position: edu },
            foreign_trade: PolicyState { id: PolicyId::ForeignTrade, position: PolicySection::C },
            immigration: PolicyState { id: PolicyId::Immigration, position: PolicySection::A },
        }
    }

    // All 9 combinations of taxation × (healthBenefits + educationWelfare)
    // Min: taxation=C (1), both welfare=C (0+0) → 1
    // Max: taxation=A (3), both welfare=A (2+2) → 7

    #[test]
    fn multiplier_min_c_c_c() {
        let p = make_policies(PolicySection::C, PolicySection::C, PolicySection::C);
        assert_eq!(compute_tax_multiplier(&p), 1);
    }

    #[test]
    fn multiplier_c_c_b() {
        let p = make_policies(PolicySection::C, PolicySection::C, PolicySection::B);
        assert_eq!(compute_tax_multiplier(&p), 2);
    }

    #[test]
    fn multiplier_c_b_b() {
        let p = make_policies(PolicySection::C, PolicySection::B, PolicySection::B);
        assert_eq!(compute_tax_multiplier(&p), 3);
    }

    #[test]
    fn multiplier_b_c_c() {
        let p = make_policies(PolicySection::B, PolicySection::C, PolicySection::C);
        assert_eq!(compute_tax_multiplier(&p), 2);
    }

    #[test]
    fn multiplier_b_b_b() {
        let p = make_policies(PolicySection::B, PolicySection::B, PolicySection::B);
        assert_eq!(compute_tax_multiplier(&p), 4);
    }

    #[test]
    fn multiplier_a_c_c() {
        let p = make_policies(PolicySection::A, PolicySection::C, PolicySection::C);
        assert_eq!(compute_tax_multiplier(&p), 3);
    }

    #[test]
    fn multiplier_a_a_c() {
        let p = make_policies(PolicySection::A, PolicySection::A, PolicySection::C);
        assert_eq!(compute_tax_multiplier(&p), 5);
    }

    #[test]
    fn multiplier_a_c_a() {
        let p = make_policies(PolicySection::A, PolicySection::C, PolicySection::A);
        assert_eq!(compute_tax_multiplier(&p), 5);
    }

    #[test]
    fn multiplier_max_a_a_a() {
        let p = make_policies(PolicySection::A, PolicySection::A, PolicySection::A);
        assert_eq!(compute_tax_multiplier(&p), 7);
    }

    #[test]
    fn all_multipliers_in_range() {
        for tax in [PolicySection::A, PolicySection::B, PolicySection::C] {
            for health in [PolicySection::A, PolicySection::B, PolicySection::C] {
                for edu in [PolicySection::A, PolicySection::B, PolicySection::C] {
                    let p = make_policies(tax.clone(), health.clone(), edu.clone());
                    let m = compute_tax_multiplier(&p);
                    assert!(m >= 1 && m <= 7, "multiplier {} out of range for {:?}/{:?}/{:?}", m, tax, health, edu);
                }
            }
        }
    }

    #[test]
    fn suggest_taxes_uses_starting_state() {
        use crate::starting_state::create_starting_state;
        use crate::types::{ClassId, ExpansionFlags, ExpansionModules, GameMode, NewGameInput};

        let state = create_starting_state(NewGameInput {
            name: None,
            mode: GameMode::Solo,
            player_count: 4,
            classes_in_play: vec![ClassId::Working, ClassId::Middle, ClassId::Capitalist, ClassId::State],
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

        // taxation=A, health=C, edu=C → multiplier = 3
        let suggestion = suggest_taxes(&state);
        assert_eq!(suggestion.multiplier, 3);
        // working: floor(10 * 3 * 0.5) = 15
        assert_eq!(suggestion.working_income_tax, 15);
        // middle: floor(10 * 3 * 0.5) = 15
        assert_eq!(suggestion.middle_income_tax, 15);
        // middle companies: 2 * 3 = 6
        assert_eq!(suggestion.middle_employment_tax, 6);
        // capitalist: floor(120/10) * 3 = 36
        assert_eq!(suggestion.capitalist_income_tax, 36);
        // capitalist companies: 4 * 3 = 12
        assert_eq!(suggestion.capitalist_employment_tax, 12);
        assert_eq!(suggestion.total_to_treasury, 15 + 15 + 6 + 36 + 12);
    }
}
