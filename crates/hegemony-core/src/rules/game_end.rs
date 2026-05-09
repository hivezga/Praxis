//! Game-End scoring routine (rulebook v1.2 pages 13, 17, 21, 25, 29).
//!
//! Triggered after the Round 5 Scoring Phase. Applies:
//!   - Loan penalty: WC/MC/State pay 55¥ per Loan from money/treasury,
//!     then lose 1 VP per 5¥ unpaid. Capitalist loses 5 VP per Loan
//!     with no payoff option (rulebook p.13).
//!   - Policy section table: each class scores from the count of
//!     Policies in its ideological section (A=Socialist for WC,
//!     B=Centrist for MC, C=Neoliberal for CC). State gets none.
//!   - Storage: 1 VP per 2 Food / 3 of any other resource. (WC has no
//!     storage VP; State counts Food/2, others including Media/3.)
//!   - Cash: WC 1 VP/10¥ (cap 15), MC 1 VP/15¥ (no cap), CC none,
//!     State 1 VP/30¥ in Treasury.
//!
//! All values are summed into a `GameEndBreakdown` and applied
//! atomically via `apply_game_end_scoring`.

use serde::{Deserialize, Serialize};

use crate::types::{GameState, PolicySection, Policies};

const LOAN_PAYOFF_COST: i32 = 55;
const CAPITALIST_LOAN_PENALTY_VP: i32 = 5;

// ---------------------------------------------------------------------------
// Policy section tables (rulebook p.17, 21, 25)
// ---------------------------------------------------------------------------

/// Working Class Socialist (Section A) end-game score table:
/// 1→1, 2→4, 3→8, 4→12, 5→18 VP.
fn working_section_table(count: u8) -> i32 {
    match count {
        0 => 0,
        1 => 1,
        2 => 4,
        3 => 8,
        4 => 12,
        _ => 18,
    }
}

/// Middle Class Section B end-game score table:
/// 1→1, 2→3, 3→6, 4→10, 5→15 VP.
fn middle_section_table(count: u8) -> i32 {
    match count {
        0 => 0,
        1 => 1,
        2 => 3,
        3 => 6,
        4 => 10,
        _ => 15,
    }
}

/// Capitalist Class Neoliberal (Section C) end-game score table:
/// 1→1, 2→4, 3→8, 4→12, 5→18 VP.
fn capitalist_section_table(count: u8) -> i32 {
    match count {
        0 => 0,
        1 => 1,
        2 => 4,
        3 => 8,
        4 => 12,
        _ => 18,
    }
}

/// Count Policies 1-5 currently in the given section.
fn count_policies_in_section(policies: &Policies, section: PolicySection) -> u8 {
    let policy_sections = [
        &policies.fiscal_policy.position,
        &policies.labor_market.position,
        &policies.taxation.position,
        &policies.health_benefits.position,
        &policies.education_welfare.position,
    ];
    policy_sections.iter().filter(|p| ***p == section).count() as u8
}

// ---------------------------------------------------------------------------
// Loan payoff (other classes)
// ---------------------------------------------------------------------------

/// For non-Capitalist classes: pay 55¥ per Loan from `money`. Per rulebook
/// p.13: "If they can't afford to pay the full amount, they spend as much
/// as they can in increments of 5¥ and then they lose 1 VP for every 5¥
/// they didn't pay."
///
/// Returns `(money_remaining, vp_loss)`.
fn loan_payoff_other(money: i32, loans: i32) -> (i32, i32) {
    if loans <= 0 {
        return (money, 0);
    }
    let owed = loans * LOAN_PAYOFF_COST;
    let max_payable = (money / 5) * 5;
    let paid = max_payable.min(owed);
    let unpaid = owed - paid;
    let vp_loss = unpaid / 5;
    (money - paid, vp_loss)
}

// ---------------------------------------------------------------------------
// Storage and cash bonuses
// ---------------------------------------------------------------------------

/// Standard storage VP: Food/2 + each other resource/3 (floor).
fn storage_vp_standard(food: i32, others: &[i32]) -> i32 {
    let from_food = food.max(0) / 2;
    let from_others: i32 = others.iter().map(|&x| x.max(0) / 3).sum();
    from_food + from_others
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

#[derive(Clone, Debug, Default, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ClassEndScore {
    pub policy_table: i32,
    pub storage: i32,
    pub cash: i32,
    pub loan_penalty: i32,
    pub total_delta: i32,
}

#[derive(Clone, Debug, Default, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct GameEndBreakdown {
    pub working: ClassEndScore,
    pub middle: ClassEndScore,
    pub capitalist: ClassEndScore,
    pub state: ClassEndScore,
}

// ---------------------------------------------------------------------------
// Per-class computation
// ---------------------------------------------------------------------------

fn compute_working(state: &GameState) -> ClassEndScore {
    let w = &state.classes.working;
    let policy_table = working_section_table(count_policies_in_section(
        &state.policies,
        PolicySection::A,
    ));
    // WC has no storage VP per rulebook p.17.
    let storage = 0;
    // Pay Loans first (rulebook flow: "Check Loans" → "Calculate Game End
    // Score"), then count cash. 1 VP per 10¥, capped at 15 VP (p.17).
    let (money_after, vp_loss) = loan_payoff_other(w.money, w.loans);
    let cash = (money_after / 10).min(15);
    let loan_penalty = -vp_loss;
    let total_delta = policy_table + storage + cash + loan_penalty;
    ClassEndScore { policy_table, storage, cash, loan_penalty, total_delta }
}

fn compute_middle(state: &GameState) -> ClassEndScore {
    let m = &state.classes.middle;
    let s = &m.storage;
    let policy_table = middle_section_table(count_policies_in_section(
        &state.policies,
        PolicySection::B,
    ));
    let storage = storage_vp_standard(s.food, &[s.luxury, s.health, s.education, s.influence]);
    let (money_after, vp_loss) = loan_payoff_other(m.money, m.loans);
    let cash = money_after / 15;
    let loan_penalty = -vp_loss;
    let total_delta = policy_table + storage + cash + loan_penalty;
    ClassEndScore { policy_table, storage, cash, loan_penalty, total_delta }
}

fn compute_capitalist(state: &GameState) -> ClassEndScore {
    let c = &state.classes.capitalist;
    let s = &c.storage;
    let policy_table = capitalist_section_table(count_policies_in_section(
        &state.policies,
        PolicySection::C,
    ));
    // Storage includes Free Trade Zone food/luxury (rulebook p.21).
    let storage = storage_vp_standard(
        s.food + s.free_trade_zone.food,
        &[s.luxury + s.free_trade_zone.luxury, s.health, s.education],
    );
    // CC pays no Loan payoff: just -5 VP per outstanding Loan.
    let loan_penalty = -CAPITALIST_LOAN_PENALTY_VP * c.loans;
    let cash = 0; // CC has no game-end cash VP source.
    let total_delta = policy_table + storage + cash + loan_penalty;
    ClassEndScore { policy_table, storage, cash, loan_penalty, total_delta }
}

fn compute_state(state: &GameState) -> ClassEndScore {
    let s = &state.classes.state;
    // State has no policy-section game-end table.
    let policy_table = 0;
    // Storage: food/2, luxury/3, influence/3 + media/3 (Public Services).
    let storage = storage_vp_standard(
        s.storage.food,
        &[
            s.storage.luxury,
            s.storage.influence,
            state.public_services.media_influence,
        ],
    );
    let (treasury_after, vp_loss) = loan_payoff_other(s.treasury, s.loans);
    let cash = treasury_after / 30;
    let loan_penalty = -vp_loss;
    let total_delta = policy_table + storage + cash + loan_penalty;
    ClassEndScore { policy_table, storage, cash, loan_penalty, total_delta }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/// Compute the full Game End breakdown without mutating state.
pub fn compute_game_end(state: &GameState) -> GameEndBreakdown {
    GameEndBreakdown {
        working: compute_working(state),
        middle: compute_middle(state),
        capitalist: compute_capitalist(state),
        state: compute_state(state),
    }
}

/// Apply Game End scoring atomically. Mutates VP for each class, deducts
/// loan-payoff money/treasury, and zeroes loan counts (game is over —
/// loans no longer accrue). Capitalist loans are NOT cleared since the
/// rulebook's −5 VP penalty leaves them on the board as a record.
pub fn apply_game_end_scoring(state: &GameState) -> (GameState, GameEndBreakdown) {
    let breakdown = compute_game_end(state);
    let mut next = state.clone();

    {
        let w = &mut next.classes.working;
        let (money_after, _) = loan_payoff_other(w.money, w.loans);
        w.money = money_after;
        w.loans = 0;
        w.vp = w.vp.saturating_add(breakdown.working.total_delta).max(0);
    }
    {
        let m = &mut next.classes.middle;
        let (money_after, _) = loan_payoff_other(m.money, m.loans);
        m.money = money_after;
        m.loans = 0;
        m.vp = m.vp.saturating_add(breakdown.middle.total_delta).max(0);
    }
    {
        // Capitalist: no payoff path, only -5 VP/Loan penalty.
        let c = &mut next.classes.capitalist;
        c.vp = c.vp.saturating_add(breakdown.capitalist.total_delta).max(0);
    }
    {
        let s = &mut next.classes.state;
        let (treasury_after, _) = loan_payoff_other(s.treasury, s.loans);
        s.treasury = treasury_after;
        s.loans = 0;
        s.vp = s.vp.saturating_add(breakdown.state.total_delta).max(0);
    }

    (next, breakdown)
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
    fn working_section_table_values() {
        assert_eq!(working_section_table(0), 0);
        assert_eq!(working_section_table(1), 1);
        assert_eq!(working_section_table(2), 4);
        assert_eq!(working_section_table(3), 8);
        assert_eq!(working_section_table(4), 12);
        assert_eq!(working_section_table(5), 18);
    }

    #[test]
    fn middle_section_table_values() {
        assert_eq!(middle_section_table(0), 0);
        assert_eq!(middle_section_table(1), 1);
        assert_eq!(middle_section_table(2), 3);
        assert_eq!(middle_section_table(3), 6);
        assert_eq!(middle_section_table(4), 10);
        assert_eq!(middle_section_table(5), 15);
    }

    #[test]
    fn capitalist_section_table_values() {
        assert_eq!(capitalist_section_table(0), 0);
        assert_eq!(capitalist_section_table(1), 1);
        assert_eq!(capitalist_section_table(2), 4);
        assert_eq!(capitalist_section_table(3), 8);
        assert_eq!(capitalist_section_table(4), 12);
        assert_eq!(capitalist_section_table(5), 18);
    }

    #[test]
    fn loan_payoff_pays_full() {
        // 1 loan, 60¥ → pays 55, leaves 5, no VP loss.
        assert_eq!(loan_payoff_other(60, 1), (5, 0));
    }

    #[test]
    fn loan_payoff_partial_no_money() {
        // 1 loan, 20¥ → pays 20 (max in 5¥ increments), unpaid=35 → 7 VP loss.
        assert_eq!(loan_payoff_other(20, 1), (0, 7));
    }

    #[test]
    fn loan_payoff_rulebook_claire_example() {
        // Rulebook p.13: Claire has 1 Loan and 38¥, pays 35¥ (max 5¥
        // increment ≤ 38), 20¥ unpaid → loses 4 VP, keeps 3¥.
        assert_eq!(loan_payoff_other(38, 1), (3, 4));
    }

    #[test]
    fn loan_payoff_two_loans_partial_total() {
        // 2 loans owe 110¥. Money=80 → pays 80, unpaid 30 → 6 VP loss.
        assert_eq!(loan_payoff_other(80, 2), (0, 6));
    }

    #[test]
    fn count_policies_section_starting() {
        let state = create_starting_state(default_input());
        // Starting policies: 1C, 2B, 3A, 4B, 5C. Section A count = 1.
        assert_eq!(count_policies_in_section(&state.policies, PolicySection::A), 1);
        assert_eq!(count_policies_in_section(&state.policies, PolicySection::B), 2);
        assert_eq!(count_policies_in_section(&state.policies, PolicySection::C), 2);
    }

    #[test]
    fn working_full_socialist_scores_18_vp_table() {
        let mut state = create_starting_state(default_input());
        state.policies.fiscal_policy.position = PolicySection::A;
        state.policies.labor_market.position = PolicySection::A;
        state.policies.taxation.position = PolicySection::A;
        state.policies.health_benefits.position = PolicySection::A;
        state.policies.education_welfare.position = PolicySection::A;
        let s = compute_working(&state);
        assert_eq!(s.policy_table, 18);
    }

    #[test]
    fn capitalist_loan_penalty_is_minus_5_per_loan_no_payoff() {
        let mut state = create_starting_state(default_input());
        state.classes.capitalist.loans = 3;
        state.classes.capitalist.revenue = 100;
        let s = compute_capitalist(&state);
        assert_eq!(s.loan_penalty, -15);
        // CC has no cash/storage cash sink; capital not consumed.
    }

    #[test]
    fn capitalist_storage_includes_free_trade_zone() {
        let mut state = create_starting_state(default_input());
        // 4 food in regular + 2 food in FTZ → 6/2 = 3 VP from food.
        state.classes.capitalist.storage.food = 4;
        state.classes.capitalist.storage.free_trade_zone.food = 2;
        state.classes.capitalist.storage.luxury = 6;
        state.classes.capitalist.storage.free_trade_zone.luxury = 0;
        state.classes.capitalist.storage.health = 0;
        state.classes.capitalist.storage.education = 0;
        let s = compute_capitalist(&state);
        // food (4+2)/2=3 + lux 6/3=2 = 5
        assert_eq!(s.storage, 5);
    }

    #[test]
    fn state_storage_counts_media_influence() {
        let mut state = create_starting_state(default_input());
        state.classes.state.storage.food = 0;
        state.classes.state.storage.luxury = 0;
        state.classes.state.storage.influence = 3;
        state.public_services.media_influence = 9;
        let s = compute_state(&state);
        // influence 3/3=1 + media 9/3=3 = 4
        assert_eq!(s.storage, 4);
    }

    #[test]
    fn working_cash_capped_at_15() {
        let mut state = create_starting_state(default_input());
        state.classes.working.money = 999;
        state.classes.working.loans = 0;
        let s = compute_working(&state);
        assert_eq!(s.cash, 15);
    }

    #[test]
    fn middle_cash_per_15() {
        let mut state = create_starting_state(default_input());
        state.classes.middle.money = 60;
        state.classes.middle.loans = 0;
        let s = compute_middle(&state);
        assert_eq!(s.cash, 4); // 60/15
    }

    #[test]
    fn state_cash_per_30() {
        let mut state = create_starting_state(default_input());
        state.classes.state.treasury = 95;
        state.classes.state.loans = 0;
        let s = compute_state(&state);
        assert_eq!(s.cash, 3); // 95/30
    }

    #[test]
    fn apply_game_end_scoring_grows_vp() {
        let state = create_starting_state(default_input());
        let starting_vp = (
            state.classes.working.vp,
            state.classes.middle.vp,
            state.classes.capitalist.vp,
            state.classes.state.vp,
        );
        let (next, _) = apply_game_end_scoring(&state);
        assert!(next.classes.working.vp >= starting_vp.0);
        assert!(next.classes.middle.vp >= starting_vp.1);
        assert!(next.classes.capitalist.vp >= starting_vp.2);
        assert!(next.classes.state.vp >= starting_vp.3);
    }

    #[test]
    fn apply_game_end_scoring_pays_loans_from_treasury() {
        let mut state = create_starting_state(default_input());
        state.classes.state.treasury = 200;
        state.classes.state.loans = 2;
        let (next, _) = apply_game_end_scoring(&state);
        // 2*55=110 paid, treasury 200-110=90 remaining.
        assert_eq!(next.classes.state.treasury, 90);
        assert_eq!(next.classes.state.loans, 0);
    }

    #[test]
    fn apply_game_end_scoring_capitalist_loan_penalty_no_payoff() {
        let mut state = create_starting_state(default_input());
        state.classes.capitalist.loans = 4;
        state.classes.capitalist.revenue = 1000;
        state.classes.capitalist.vp = 50;
        let (next, _) = apply_game_end_scoring(&state);
        // -5 per loan = -20 VP. Other contributions add some too; revenue
        // is unchanged (CC has no payoff path).
        assert_eq!(next.classes.capitalist.revenue, 1000);
        assert!(next.classes.capitalist.vp <= 50 - 20 + 18); // worst-case bound
    }
}
