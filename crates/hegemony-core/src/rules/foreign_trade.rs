//! Foreign Trade tariff lookups (rulebook page 32).
//!
//! Tariffs apply when the Capitalist or Middle Class buys Food or
//! Luxury from the Foreign Market. Tariff revenue flows to the State
//! Treasury. If goods go directly to the Free Trade Zone, NO tariff
//! is paid (FAQ clarification).
//!
//! Number of Business Deal cards drawn each Preparation Phase also
//! depends on this Policy.

use crate::types::PolicySection;

/// Tariff on each unit of Food imported from the Foreign Market.
pub fn food_tariff(foreign_trade: &PolicySection) -> i32 {
    match foreign_trade {
        PolicySection::A => 10,
        PolicySection::B => 5,
        PolicySection::C => 0,
    }
}

/// Tariff on each unit of Luxury imported from the Foreign Market.
pub fn luxury_tariff(foreign_trade: &PolicySection) -> i32 {
    match foreign_trade {
        PolicySection::A => 6,
        PolicySection::B => 3,
        PolicySection::C => 0,
    }
}

/// Number of Business Deal cards drawn during Preparation Phase
/// (rulebook page 32).
pub fn business_deals_per_round(foreign_trade: &PolicySection) -> u8 {
    match foreign_trade {
        PolicySection::A => 0,
        PolicySection::B => 1,
        PolicySection::C => 2,
    }
}

/// Total tariff for an import transaction. `food_units` and
/// `luxury_units` are quantities going into REGULAR storage (not Free
/// Trade Zone). Free Trade Zone bypasses tariffs entirely.
pub fn import_tariff(
    foreign_trade: &PolicySection,
    food_units: i32,
    luxury_units: i32,
) -> i32 {
    food_tariff(foreign_trade) * food_units.max(0)
        + luxury_tariff(foreign_trade) * luxury_units.max(0)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn food_tariff_table() {
        assert_eq!(food_tariff(&PolicySection::A), 10);
        assert_eq!(food_tariff(&PolicySection::B), 5);
        assert_eq!(food_tariff(&PolicySection::C), 0);
    }

    #[test]
    fn luxury_tariff_table() {
        assert_eq!(luxury_tariff(&PolicySection::A), 6);
        assert_eq!(luxury_tariff(&PolicySection::B), 3);
        assert_eq!(luxury_tariff(&PolicySection::C), 0);
    }

    #[test]
    fn business_deals_table() {
        assert_eq!(business_deals_per_round(&PolicySection::A), 0);
        assert_eq!(business_deals_per_round(&PolicySection::B), 1);
        assert_eq!(business_deals_per_round(&PolicySection::C), 2);
    }

    #[test]
    fn import_tariff_a_food_and_luxury() {
        // FT=A: 4 Food + 6 Luxury = 4*10 + 6*6 = 40 + 36 = 76
        assert_eq!(import_tariff(&PolicySection::A, 4, 6), 76);
    }

    #[test]
    fn import_tariff_c_zero() {
        assert_eq!(import_tariff(&PolicySection::C, 100, 100), 0);
    }

    #[test]
    fn import_tariff_clamps_negative() {
        assert_eq!(import_tariff(&PolicySection::A, -5, 3), 18);
        assert_eq!(import_tariff(&PolicySection::A, 5, -3), 50);
    }
}
