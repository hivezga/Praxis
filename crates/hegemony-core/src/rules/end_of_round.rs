//! End-of-round computation: wages, taxes, prosperity, and atomic
//! application to GameState.
//!
//! Wage rules (rulebook page 11, 16, 20, 25, 28):
//!   - Each Company pays a flat wage from its printed L1/L2/L3 table,
//!     not per-worker. Wage flows to the Class controlling the Workers.
//!   - Capitalist Companies pay from Revenue.
//!   - Middle Companies pay from Middle's money. Working Class employees
//!     in a Middle Company are paid by the Middle Class.
//!   - Public Companies are paid by the State Treasury (page 11).
//!   - Strike (page 16): operational Striked Companies skip BOTH wages
//!     and production; Working Class gains 1 Influence per such Company.
//!     Strikes on L3-wage Companies are discarded at start of Production.
//!   - Cooperative Farms pay no wages (Working keeps the produce).

use crate::cards::{lookup_by_name, wage_at, WorkerClass};
use crate::rules::taxes::suggest_taxes;
use crate::rules::vp::vp_for;
use crate::types::{
    CapitalistCompany, ClassId, GameState, MiddleCompany, ProsperityDelta, PublicCompany,
    RoundSuggestion, VpAtScoring, WagesSuggestion, WelfareCostsSuggestion,
};

// ---------------------------------------------------------------------------
// Operational checks (rulebook page 11): a Company is operational iff
// every required Worker slot is filled OR it is fully automated.
// ---------------------------------------------------------------------------

fn cap_operational(c: &CapitalistCompany) -> bool {
    let card = match lookup_by_name(&c.label) {
        Some(card) => card,
        None => return c.workers_assigned > 0,
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

fn mid_operational(c: &MiddleCompany) -> bool {
    let card = match lookup_by_name(&c.label) {
        Some(card) => card,
        None => return c.workers_assigned > 0,
    };
    let required_middle = card
        .slots
        .iter()
        .filter(|s| s.class != WorkerClass::EmployeeWorking)
        .count() as i32;
    if required_middle == 0 {
        return false;
    }
    c.workers_assigned >= required_middle
}

fn pub_operational(c: &PublicCompany) -> bool {
    c.operational
}

// ---------------------------------------------------------------------------
// Wage helpers
// ---------------------------------------------------------------------------

/// Wage paid by a Capitalist Company in this Production Phase.
///
/// Per rulebook v1.2 page 16, strike resolution at the START of the
/// Production Phase:
///   1. Discard the Strike token from all Companies with Level 3 Wages.
///   2. For each operational Co still on strike (L1/L2 wages), no
///      production and no wage paid; Working gains 1 Influence each.
///   3. Discard all remaining Strike tokens.
///
/// Therefore: L3 + on_strike pays its full wage normally (strike was
/// discarded before wages computed). L1/L2 + on_strike pays nothing.
/// Non-operational Companies pay nothing regardless of strike state.
fn cap_wage(c: &CapitalistCompany) -> i32 {
    if !cap_operational(c) {
        return 0;
    }
    if c.on_strike && c.wage_level < 3 {
        return 0;
    }
    match lookup_by_name(&c.label) {
        Some(card) => wage_at(card, c.wage_level),
        None => 0,
    }
}

/// Total wage a Middle Company pays in this round.
///
/// Rulebook page 25: "you have to pay Wages for all the Working Class
/// Workers in your Companies." The spreadsheet wages-per-company.csv
/// confirms Middle Class wages are PER WORKER (not flat per Company).
/// So total wage = per-worker rate × number of Working-Class employees
/// currently assigned to the Company.
///
/// Pure Middle-only Companies (S(s) variant: 0 WC employees) pay no
/// wages in monetary terms - MC workers don't pay themselves.
///
/// Striked operational Companies skip wages.
fn mid_wage(c: &MiddleCompany) -> i32 {
    if !mid_operational(c) {
        return 0;
    }
    let card = match lookup_by_name(&c.label) {
        Some(card) => card,
        None => return 0,
    };
    let per_worker = wage_at(card, c.wage_level);
    per_worker * c.working_class_employees.max(0)
}

/// State pays Public Company wages from the Treasury (rulebook page 11).
fn pub_wage(c: &PublicCompany) -> i32 {
    if !pub_operational(c) {
        return 0;
    }
    match lookup_by_name(&c.label) {
        Some(card) => wage_at(card, c.wage_level),
        None => 0,
    }
}

/// How much of a Middle Company's wage flows to the Working Class.
/// Since Middle Class wages are paid PER WORKING-CLASS EMPLOYEE
/// (rulebook page 25), 100% of `mid_wage` goes to the Working Class.
fn mid_wage_to_working(c: &MiddleCompany) -> i32 {
    mid_wage(c)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/// Strikes-resolution effect: count operational Striked Capitalist
/// Companies (excluding L3-wage ones, which discard the strike at start
/// of Production - rulebook page 16). Working Class gains 1 Influence
/// per such Company.
pub fn strike_influence_to_working(state: &GameState) -> i32 {
    state
        .classes
        .capitalist
        .companies
        .iter()
        .filter(|c| c.on_strike && cap_operational(c) && c.wage_level < 3)
        .count() as i32
}

/// Compute the deterministic round summary using rulebook formulas.
pub fn compute_round_suggestion(state: &GameState) -> RoundSuggestion {
    let taxes = suggest_taxes(state);
    let multiplier = taxes.multiplier;

    // Wages paid by employer Class.
    let from_capitalist: i32 = state
        .classes
        .capitalist
        .companies
        .iter()
        .map(cap_wage)
        .sum();

    let from_middle: i32 = state
        .classes
        .middle
        .companies
        .iter()
        .map(mid_wage)
        .sum();

    // Working Class income: portion of Middle wages that goes to Working
    // employees + ALL Capitalist wages (Capitalist wages always pay
    // Working Class workers, by ownership-of-class rules - Working Class
    // is the only worker pool a Capitalist Company can employ in
    // unskilled green slots).
    let to_working_from_middle: i32 = state
        .classes
        .middle
        .companies
        .iter()
        .map(mid_wage_to_working)
        .sum();
    let to_working = from_capitalist + to_working_from_middle;

    // Public Company wages: paid by State Treasury, flow to Working Class.
    let from_state_to_working: i32 = state
        .classes
        .state
        .public_companies
        .iter()
        .map(pub_wage)
        .sum();

    RoundSuggestion {
        taxes,
        wages: WagesSuggestion {
            from_capitalist,
            from_middle,
            to_working: to_working + from_state_to_working,
        },
        // Welfare State (rulebook page 31): when Welfare Policy is in
        // section A, Health/Education are sold for free - no money
        // changes hands. The State pays NOTHING for "free" welfare;
        // it only loses opportunity to charge. Therefore from_state = 0.
        welfare_costs: WelfareCostsSuggestion {
            from_state: 0,
            notes: "Free Welfare (Policies 4A/5A) costs the State no money - resources still flow but no payment is required.".to_string(),
        },
        prosperity_delta: prosperity_delta(state),
        vp_at_scoring: VpAtScoring {
            working: vp_for(ClassId::Working, state).total,
            middle: vp_for(ClassId::Middle, state).total,
            capitalist: vp_for(ClassId::Capitalist, state).total,
            state: vp_for(ClassId::State, state).total,
        },
        notes: vec![format!("Tax multiplier: \u{d7}{}", multiplier)],
    }
}

/// Heuristic prosperity delta - kept as suggestion only (the actual
/// prosperity move is a player-choice Free Action during the Action
/// Phase). Working/Middle gain +1 if their cumulative resources held
/// match or exceed Population.
fn prosperity_delta(state: &GameState) -> ProsperityDelta {
    let w = &state.classes.working;
    let m = &state.classes.middle;
    let working = if w.storage.health + w.storage.education + w.storage.luxury >= w.population {
        1
    } else {
        0
    };
    let middle = if m.storage.health + m.storage.education + m.storage.luxury >= m.population {
        1
    } else {
        0
    };
    ProsperityDelta { working, middle }
}

/// Apply the round suggestion to GameState atomically. Movements:
///   - Taxes -> Treasury
///   - Capitalist wages: Revenue -> Working money
///   - Middle wages: Middle money -> Working money (employee portion only)
///                + Middle money -> Middle (for own Middle workers)
///   - Public wages: Treasury -> Working money
///   - Working Class: +1 Influence per Striked operational L1/L2-wage Cap Co
pub fn apply_round_suggestion(state: &GameState, suggestion: &RoundSuggestion) -> GameState {
    let mut next = state.clone();

    // Treasury inflow from taxes.
    next.classes.state.treasury =
        (next.classes.state.treasury + suggestion.taxes.total_to_treasury).max(0);

    // Capitalist Companies pay wages out of Revenue.
    next.classes.capitalist.revenue =
        (next.classes.capitalist.revenue - suggestion.wages.from_capitalist).max(0);

    // Middle Companies pay wages out of Middle's money pool. Within the
    // Middle Class, only the portion paid to Working Class employees
    // leaves; the rest stays internally so subtract only `to_working`
    // sourced from middle.
    let mid_to_working: i32 = next
        .classes
        .middle
        .companies
        .iter()
        .map(mid_wage_to_working)
        .sum();
    next.classes.middle.money =
        (next.classes.middle.money - suggestion.wages.from_middle).max(0);
    // The Middle Class internally retains `from_middle - mid_to_working`
    // (i.e. wages paid to its own Workers) -- but since money is already
    // deducted as a single bookkeeping op above, we add that back:
    let mid_internal = (suggestion.wages.from_middle - mid_to_working).max(0);
    next.classes.middle.money += mid_internal;

    // Working Class money inflow: capitalist wages + middle-employee
    // portion + state-paid public wages. The `wages.to_working` field
    // already includes all three.
    next.classes.working.money =
        (next.classes.working.money + suggestion.wages.to_working).max(0);

    // State pays Public Company wages from Treasury. Re-derive to avoid
    // pollution from the `to_working` aggregate.
    let public_wages: i32 = next
        .classes
        .state
        .public_companies
        .iter()
        .map(pub_wage)
        .sum();
    next.classes.state.treasury = (next.classes.state.treasury - public_wages).max(0);

    // Strike effect: Working Class gains 1 Influence per operational
    // Striked Capitalist Co at L1/L2 wage. L3-wage Striked Cos discard
    // their token at start of Production (handled separately).
    let strike_inf = strike_influence_to_working(state);
    next.classes.working.storage.influence =
        (next.classes.working.storage.influence + strike_inf).max(0);

    // Discard ALL Strike tokens after Production resolves (rulebook p.16).
    // Both L3 (cleared at phase start) and L1/L2 (after producing influence)
    // tokens go away by end of Production.
    for c in next.classes.capitalist.companies.iter_mut() {
        c.on_strike = false;
    }

    next
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use crate::starting_state::create_starting_state;
    use crate::types::*;

    fn default_input() -> NewGameInput {
        NewGameInput {
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
            local_player_class: None,
        }
    }

    #[test]
    fn round_suggestion_starting_state() {
        let state = create_starting_state(default_input());
        let s = compute_round_suggestion(&state);
        // Starting policies (rulebook page 8): Tax=A, H=B, E=C -> mult = 3 + 2*(1+0) = 5
        assert_eq!(s.taxes.multiplier, 5);
        // Capitalist starting Cos have workers_assigned=0 -> non-operational, no wages.
        assert_eq!(s.wages.from_capitalist, 0);
        // Middle Cos at start: Convenience Store + Doctor's Office both have
        // 1 worker each but need 2 (S(s) config) -> non-operational, 0 wages.
        // Even when operational, S(s) Cos have no WC employees so wages=0.
        assert_eq!(s.wages.from_middle, 0);
        assert_eq!(s.wages.to_working, 0);
    }

    #[test]
    fn supermarket_with_full_workers_pays_l1_wage() {
        let mut state = create_starting_state(default_input());
        // Supermarket has 4 worker slots. Fill them. wage_level=1 -> 15¥.
        let sm = state
            .classes
            .capitalist
            .companies
            .iter_mut()
            .find(|c| c.label == "Supermarket")
            .unwrap();
        sm.workers_assigned = 4;
        sm.wage_level = 1;

        let s = compute_round_suggestion(&state);
        assert_eq!(s.wages.from_capitalist, 15);
        assert_eq!(s.wages.to_working, 15);
    }

    #[test]
    fn striked_supermarket_pays_no_wages() {
        let mut state = create_starting_state(default_input());
        let sm = state
            .classes
            .capitalist
            .companies
            .iter_mut()
            .find(|c| c.label == "Supermarket")
            .unwrap();
        sm.workers_assigned = 4;
        sm.wage_level = 2;
        sm.on_strike = true;

        let s = compute_round_suggestion(&state);
        assert_eq!(s.wages.from_capitalist, 0);
        // L1 or L2 striked operational Cap Co -> +1 Influence to Working.
        let strike_inf = strike_influence_to_working(&state);
        assert_eq!(strike_inf, 1);
    }

    #[test]
    fn l3_striked_supermarket_still_pays_wages() {
        // Rulebook p.16: L3 strike tokens are discarded at start of
        // Production BEFORE wages compute. So an on_strike L3 Co pays
        // its full wage (25¥ for Supermarket).
        let mut state = create_starting_state(default_input());
        let sm = state
            .classes
            .capitalist
            .companies
            .iter_mut()
            .find(|c| c.label == "Supermarket")
            .unwrap();
        sm.workers_assigned = 4;
        sm.wage_level = 3;
        sm.on_strike = true;

        let s = compute_round_suggestion(&state);
        assert_eq!(s.wages.from_capitalist, 25, "L3 strike must pay wages");
    }

    #[test]
    fn apply_round_clears_all_strike_tokens() {
        let mut state = create_starting_state(default_input());
        for c in state.classes.capitalist.companies.iter_mut() {
            c.workers_assigned = 4;
            c.on_strike = true;
        }
        let s = compute_round_suggestion(&state);
        let next = apply_round_suggestion(&state, &s);
        for c in &next.classes.capitalist.companies {
            assert!(!c.on_strike, "all strike tokens should clear post-Production");
        }
    }

    #[test]
    fn striked_l3_wage_no_influence() {
        let mut state = create_starting_state(default_input());
        let sm = state
            .classes
            .capitalist
            .companies
            .iter_mut()
            .find(|c| c.label == "Supermarket")
            .unwrap();
        sm.workers_assigned = 4;
        sm.wage_level = 3;
        sm.on_strike = true;

        // L3-wage strikes are discarded at start of Production - no Influence.
        let strike_inf = strike_influence_to_working(&state);
        assert_eq!(strike_inf, 0);
    }

    #[test]
    fn welfare_cost_to_state_is_zero_when_policy_a() {
        let mut state = create_starting_state(default_input());
        state.policies.health_benefits.position = PolicySection::A;
        state.policies.education_welfare.position = PolicySection::A;
        let s = compute_round_suggestion(&state);
        assert_eq!(s.welfare_costs.from_state, 0);
    }

    #[test]
    fn apply_round_suggestion_treasury_grows_by_taxes() {
        let state = create_starting_state(default_input());
        let s = compute_round_suggestion(&state);
        let next = apply_round_suggestion(&state, &s);
        // Treasury starts 120, +taxes total. Public wages would also be
        // deducted but starting Public Cos vec is empty.
        assert_eq!(
            next.classes.state.treasury,
            state.classes.state.treasury + s.taxes.total_to_treasury
        );
    }

    #[test]
    fn apply_round_suggestion_working_money_grows() {
        let mut state = create_starting_state(default_input());
        // Set up Supermarket fully operational at L2 = 20¥ wage.
        let sm = state
            .classes
            .capitalist
            .companies
            .iter_mut()
            .find(|c| c.label == "Supermarket")
            .unwrap();
        sm.workers_assigned = 4;
        sm.wage_level = 2;

        let s = compute_round_suggestion(&state);
        let next = apply_round_suggestion(&state, &s);
        assert!(
            next.classes.working.money > state.classes.working.money,
            "Working money should grow when Cap Cos pay wages"
        );
    }

    #[test]
    fn apply_round_capitalist_revenue_drops_by_wages() {
        let mut state = create_starting_state(default_input());
        let sm = state
            .classes
            .capitalist
            .companies
            .iter_mut()
            .find(|c| c.label == "Supermarket")
            .unwrap();
        sm.workers_assigned = 4;
        sm.wage_level = 3; // 25¥

        let s = compute_round_suggestion(&state);
        let next = apply_round_suggestion(&state, &s);
        assert_eq!(
            next.classes.capitalist.revenue,
            state.classes.capitalist.revenue - 25
        );
    }
}
