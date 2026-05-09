//! Static card database for Hegemony Companies.
//!
//! Source of truth for L1/L2/L3 wages, worker slots, production output,
//! cost, machinery/automated flags. Used by the Production Phase
//! orchestrator to compute wages and produced resources without the
//! UI having to carry that data per Company instance.
//!
//! Most stub entries (`verified: false`) have placeholder values until
//! all 59 base-game cards are photographed and transcribed from a
//! physical copy of the game.

use crate::types::Good;

mod data;

pub use data::ALL_COMPANY_CARDS;

// Card data is static (compile-time const) so it does not need
// Serialize/Deserialize. Runtime Company state (in `types.rs`) carries
// what gets serialized; card lookups happen on the Rust side.

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum CardClass {
    Capitalist,
    Middle,
    Public,
    Farm,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Industry {
    Agriculture,
    Luxury,
    Healthcare,
    Education,
    Media,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum WorkerClass {
    Working,
    Middle,
    /// Working-class slot inside a Middle Class Company (employee).
    EmployeeWorking,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum SkillReq {
    Unskilled,
    Skilled,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct WorkerSlot {
    pub class: WorkerClass,
    pub skill: SkillReq,
}

#[derive(Clone, Debug, PartialEq)]
pub struct ResourceOutput {
    pub good: Good,
    pub qty: i32,
}

#[derive(Clone, Debug, PartialEq)]
pub struct CompanyCard {
    pub id: &'static str,
    pub name: &'static str,
    pub class: CardClass,
    pub industry: Industry,
    pub cost: i32,
    /// Wages indexed by level - 1: `wages[0]` = L1, `wages[1]` = L2, `wages[2]` = L3.
    pub wages: [i32; 3],
    pub slots: &'static [WorkerSlot],
    pub production: &'static [ResourceOutput],
    pub machinery_slot: bool,
    pub automated: bool,
    /// Middle-class only: extra production per Working Class employee.
    pub employee_bonus: Option<i32>,
    /// `false` = stub data, real values pending physical card photos.
    pub verified: bool,
}

/// Default placeholder wages used by stub cards until their real values
/// are transcribed: L1 = 15¥, L2 = 20¥, L3 = 25¥. Matches the most-common
/// pattern seen in the rulebook examples (Supermarket, Shopping Mall).
pub const STUB_WAGES: [i32; 3] = [15, 20, 25];

/// Lookup a card by its stable id. Returns None for unknown ids.
pub fn lookup(card_id: &str) -> Option<&'static CompanyCard> {
    ALL_COMPANY_CARDS.iter().find(|c| c.id == card_id)
}

/// Lookup a card by display name (case-insensitive). Used during
/// migration from the old name-only Company structs. Returns None
/// if no card with that name exists.
pub fn lookup_by_name(name: &str) -> Option<&'static CompanyCard> {
    let needle = name.trim().to_lowercase();
    ALL_COMPANY_CARDS
        .iter()
        .find(|c| c.name.to_lowercase() == needle)
}

/// Return the printed wage value for a Company at the given wage marker
/// level (1, 2, or 3). Levels outside that range clamp to L1.
pub fn wage_at(card: &CompanyCard, level: u8) -> i32 {
    let idx = (level.saturating_sub(1).min(2)) as usize;
    card.wages[idx]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn supermarket_is_verified() {
        let card = lookup_by_name("Supermarket").expect("Supermarket card");
        assert!(card.verified);
        assert_eq!(card.wages, [15, 20, 25]);
        assert_eq!(card.class, CardClass::Capitalist);
    }

    #[test]
    fn wage_at_levels() {
        let card = lookup_by_name("Supermarket").unwrap();
        assert_eq!(wage_at(card, 1), 15);
        assert_eq!(wage_at(card, 2), 20);
        assert_eq!(wage_at(card, 3), 25);
        assert_eq!(wage_at(card, 0), 15); // clamps to L1
        assert_eq!(wage_at(card, 9), 25); // clamps to L3
    }

    #[test]
    fn lookup_returns_none_for_unknown() {
        assert!(lookup("nonexistent-card-id").is_none());
        assert!(lookup_by_name("Nonexistent Company").is_none());
    }

    #[test]
    fn all_card_ids_unique() {
        let mut ids: Vec<&str> = ALL_COMPANY_CARDS.iter().map(|c| c.id).collect();
        ids.sort();
        let len = ids.len();
        ids.dedup();
        assert_eq!(ids.len(), len, "duplicate card ids in ALL_COMPANY_CARDS");
    }
}
