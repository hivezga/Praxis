use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::error::MutationError;
use crate::time::now_ms;
use crate::types::*;

// ---------------------------------------------------------------------------
// Snapshot helper
// ---------------------------------------------------------------------------

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct StateSnapshot {
    meta: GameMeta,
    policies: Policies,
    market: MarketState,
    public_services: PublicServices,
    pools: PopulationPools,
    bills: Vec<Bill>,
    business_deals: Vec<BusinessDeal>,
    classes: Classes,
    #[serde(skip_serializing_if = "Option::is_none")]
    crisis: Option<CrisisState>,
}

fn take_snapshot(state: &GameState, label: &str) -> Result<HistoryEntry, MutationError> {
    let snap = StateSnapshot {
        meta: state.meta.clone(),
        policies: state.policies.clone(),
        market: state.market.clone(),
        public_services: state.public_services.clone(),
        pools: state.pools.clone(),
        bills: state.bills.clone(),
        business_deals: state.business_deals.clone(),
        classes: state.classes.clone(),
        crisis: state.crisis.clone(),
    };
    let prev_snapshot = serde_json::to_string(&snap)
        .map_err(|e| MutationError::SerializationFailed { reason: e.to_string() })?;
    Ok(HistoryEntry {
        id: Uuid::new_v4().to_string(),
        ts: now_ms(),
        label: label.to_string(),
        prev_snapshot,
    })
}

// ---------------------------------------------------------------------------
// Phase order
// ---------------------------------------------------------------------------

const PHASE_ORDER: &[Phase] = &[
    Phase::Preparation,
    Phase::Action,
    Phase::Production,
    Phase::Elections,
    Phase::Scoring,
];

fn advance_phase(state: &mut GameState) {
    let idx = PHASE_ORDER.iter().position(|p| p == &state.meta.phase);
    match idx {
        Some(i) if i < PHASE_ORDER.len() - 1 => {
            state.meta.phase = PHASE_ORDER[i + 1].clone();
        }
        _ => {
            state.meta.round = (state.meta.round + 1).min(5);
            state.meta.phase = Phase::Preparation;
        }
    }
}

// ---------------------------------------------------------------------------
// Mutation enum
// ---------------------------------------------------------------------------

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", tag = "type")]
pub enum Mutation {
    SetPolicy { policy_id: PolicyId, position: PolicySection },
    AdvancePhase,
    SetPhase { phase: Phase },
    SetRound { round: u8 },
    ProposeBill(NewBill),
    RemoveBill { id: String },
    AdjustMoney { class_id: ClassId, delta: i64 },
    AdjustRevenue { delta: i64 },
    AdjustTreasury { delta: i64 },
    AdjustCapital { class_id: ClassId, delta: i64 },
    AdjustVp { class_id: ClassId, delta: i32 },
    AdjustProsperity { class_id: ClassId, delta: i32 },
    AdjustPopulation { class_id: ClassId, delta: i32 },
    AdjustStorage { class_id: ClassId, good: Good, delta: i32 },
    AdjustLoans { class_id: ClassId, delta: i32 },
    AdjustLegitimacy { from_class: ClassId, delta: i32 },
    SetNotes { class_id: ClassId, text: String },
    // --- new in Phase 2 ---
    AdjustUnemployedWorkers { class_id: ClassId, delta: i32 },
    AdjustSkilledWorkers { class_id: ClassId, delta: i32 },
    AdjustVotingCubes { class_id: ClassId, delta: i32 },
    AdjustBillMarkers { class_id: ClassId, delta: i32 },
    AdjustHandSize { class_id: ClassId, delta: i32 },
    AdjustSavings { delta: i32 },
    AdjustTradeUnion { index: usize, delta: i32 },
    AdjustFreeTradeZone { good: Good, delta: i32 },
    AdjustMarket { good: Good, delta: i32 },
    AdjustPool { pool: PoolId, delta: i32 },
    AdjustPublicService { service: ServiceId, delta: i32 },
    AdjustLegitimacyTokens { from_class: ClassId, delta: i32 },
    ApplyEndRound(EndRoundPayload),
    /// Resolve a proposed Bill atomically: move the Policy marker, award
    /// +3 VP to the proposer, and remove the Bill from the queue. Replaces
    /// the prior TS-side three-step orchestration to keep all rules in Rust.
    PassBill { bill_id: String },
    /// Fail a proposed Bill: simply remove it from the queue.
    FailBill { bill_id: String },
}

// ---------------------------------------------------------------------------
// apply_mutation
// ---------------------------------------------------------------------------

pub fn apply_mutation(
    state: &GameState,
    mutation: Mutation,
    label: &str,
) -> Result<GameState, MutationError> {
    const HISTORY_LIMIT: usize = 30;

    let entry = take_snapshot(state, label)?;
    let mut next = state.clone();

    match mutation {
        Mutation::SetPolicy { policy_id, position } => {
            match policy_id {
                PolicyId::FiscalPolicy => next.policies.fiscal_policy.position = position,
                PolicyId::LaborMarket => next.policies.labor_market.position = position,
                PolicyId::Taxation => next.policies.taxation.position = position,
                PolicyId::HealthBenefits => next.policies.health_benefits.position = position,
                PolicyId::EducationWelfare => next.policies.education_welfare.position = position,
                PolicyId::ForeignTrade => next.policies.foreign_trade.position = position,
                PolicyId::Immigration => next.policies.immigration.position = position,
            }
        }

        Mutation::AdvancePhase => advance_phase(&mut next),

        Mutation::SetPhase { phase } => {
            next.meta.phase = phase;
        }

        Mutation::SetRound { round } => {
            next.meta.round = round.min(5).max(1);
        }

        Mutation::ProposeBill(new_bill) => {
            next.bills.push(Bill {
                id: Uuid::new_v4().to_string(),
                policy_id: new_bill.policy_id,
                proposed_section: new_bill.proposed_section,
                proposed_by: new_bill.proposed_by,
                immediate_vote: new_bill.immediate_vote,
            });
        }

        Mutation::RemoveBill { id } => {
            next.bills.retain(|b| b.id != id);
        }

        Mutation::AdjustMoney { class_id, delta } => {
            match class_id {
                ClassId::Working => {
                    next.classes.working.money =
                        (next.classes.working.money as i64 + delta).max(0) as i32;
                }
                ClassId::Middle => {
                    next.classes.middle.money =
                        (next.classes.middle.money as i64 + delta).max(0) as i32;
                }
                ClassId::Capitalist => {
                    return Err(MutationError::InvalidClass {
                        class: ClassId::Capitalist,
                        reason: "Use AdjustRevenue for Capitalist".to_string(),
                    });
                }
                ClassId::State => {
                    return Err(MutationError::InvalidClass {
                        class: ClassId::State,
                        reason: "Use AdjustTreasury for State".to_string(),
                    });
                }
            }
        }

        Mutation::AdjustRevenue { delta } => {
            next.classes.capitalist.revenue =
                (next.classes.capitalist.revenue as i64 + delta).max(0) as i32;
        }

        Mutation::AdjustTreasury { delta } => {
            next.classes.state.treasury =
                (next.classes.state.treasury as i64 + delta).max(0) as i32;
        }

        Mutation::AdjustCapital { class_id, delta } => {
            match class_id {
                ClassId::Middle => {
                    next.classes.middle.capital =
                        (next.classes.middle.capital as i64 + delta).max(0) as i32;
                }
                ClassId::Capitalist => {
                    next.classes.capitalist.capital =
                        (next.classes.capitalist.capital as i64 + delta).max(0) as i32;
                }
                other => {
                    return Err(MutationError::InvalidClass {
                        class: other,
                        reason: "AdjustCapital not valid for this class".to_string(),
                    });
                }
            }
        }

        Mutation::AdjustVp { class_id, delta } => {
            match class_id {
                ClassId::Working => {
                    next.classes.working.vp = (next.classes.working.vp + delta).max(0);
                }
                ClassId::Middle => {
                    next.classes.middle.vp = (next.classes.middle.vp + delta).max(0);
                }
                ClassId::Capitalist => {
                    next.classes.capitalist.vp = (next.classes.capitalist.vp + delta).max(0);
                }
                ClassId::State => {
                    next.classes.state.vp = (next.classes.state.vp + delta).max(0);
                }
            }
        }

        Mutation::AdjustProsperity { class_id, delta } => {
            match class_id {
                ClassId::Working => {
                    next.classes.working.prosperity =
                        (next.classes.working.prosperity + delta).max(0);
                }
                ClassId::Middle => {
                    next.classes.middle.prosperity =
                        (next.classes.middle.prosperity + delta).max(0);
                }
                other => {
                    return Err(MutationError::InvalidClass {
                        class: other,
                        reason: "AdjustProsperity not valid for this class".to_string(),
                    });
                }
            }
        }

        Mutation::AdjustPopulation { class_id, delta } => {
            match class_id {
                ClassId::Working => {
                    next.classes.working.population =
                        (next.classes.working.population + delta).max(0);
                }
                ClassId::Middle => {
                    next.classes.middle.population =
                        (next.classes.middle.population + delta).max(0);
                }
                other => {
                    return Err(MutationError::InvalidClass {
                        class: other,
                        reason: "AdjustPopulation not valid for this class".to_string(),
                    });
                }
            }
        }

        Mutation::AdjustStorage { class_id, good, delta } => {
            match class_id {
                ClassId::Working => {
                    let s = &mut next.classes.working.storage;
                    match good {
                        Good::Food => s.food = (s.food + delta).max(0),
                        Good::Luxury => s.luxury = (s.luxury + delta).max(0),
                        Good::Health => s.health = (s.health + delta).max(0),
                        Good::Education => s.education = (s.education + delta).max(0),
                        Good::Influence => s.influence = (s.influence + delta).max(0),
                    }
                }
                ClassId::Middle => {
                    let s = &mut next.classes.middle.storage;
                    match good {
                        Good::Food => s.food = (s.food + delta).max(0),
                        Good::Luxury => s.luxury = (s.luxury + delta).max(0),
                        Good::Health => s.health = (s.health + delta).max(0),
                        Good::Education => s.education = (s.education + delta).max(0),
                        Good::Influence => s.influence = (s.influence + delta).max(0),
                    }
                }
                ClassId::Capitalist => {
                    let s = &mut next.classes.capitalist.storage;
                    match good {
                        Good::Food => s.food = (s.food + delta).max(0),
                        Good::Luxury => s.luxury = (s.luxury + delta).max(0),
                        Good::Health => s.health = (s.health + delta).max(0),
                        Good::Education => s.education = (s.education + delta).max(0),
                        Good::Influence => s.influence = (s.influence + delta).max(0),
                    }
                }
                ClassId::State => {
                    let s = &mut next.classes.state.storage;
                    match good {
                        Good::Food => s.food = (s.food + delta).max(0),
                        Good::Luxury => s.luxury = (s.luxury + delta).max(0),
                        Good::Influence => s.influence = (s.influence + delta).max(0),
                        other => {
                            return Err(MutationError::InvalidArgument {
                                reason: format!("State storage does not have {:?}", other),
                            });
                        }
                    }
                }
            }
        }

        Mutation::AdjustLoans { class_id, delta } => {
            match class_id {
                ClassId::Working => {
                    next.classes.working.loans = (next.classes.working.loans + delta).max(0);
                }
                ClassId::Middle => {
                    next.classes.middle.loans = (next.classes.middle.loans + delta).max(0);
                }
                ClassId::Capitalist => {
                    next.classes.capitalist.loans =
                        (next.classes.capitalist.loans + delta).max(0);
                }
                ClassId::State => {
                    next.classes.state.loans = (next.classes.state.loans + delta).max(0);
                }
            }
        }

        Mutation::AdjustLegitimacy { from_class, delta } => {
            match from_class {
                ClassId::Working => {
                    next.classes.state.legitimacy.working =
                        (next.classes.state.legitimacy.working + delta).max(0);
                }
                ClassId::Middle => {
                    next.classes.state.legitimacy.middle =
                        (next.classes.state.legitimacy.middle + delta).max(0);
                }
                ClassId::Capitalist => {
                    next.classes.state.legitimacy.capitalist =
                        (next.classes.state.legitimacy.capitalist + delta).max(0);
                }
                ClassId::State => {
                    return Err(MutationError::InvalidClass {
                        class: ClassId::State,
                        reason: "AdjustLegitimacy: State does not have its own legitimacy track"
                            .to_string(),
                    });
                }
            }
        }

        Mutation::SetNotes { class_id, text } => match class_id {
            ClassId::Working => next.classes.working.notes = text,
            ClassId::Middle => next.classes.middle.notes = text,
            ClassId::Capitalist => next.classes.capitalist.notes = text,
            ClassId::State => next.classes.state.notes = text,
        },

        // --- new in Phase 2 ---

        Mutation::AdjustUnemployedWorkers { class_id, delta } => {
            match class_id {
                ClassId::Working => {
                    next.classes.working.unemployed_workers =
                        (next.classes.working.unemployed_workers + delta).max(0);
                }
                ClassId::Middle => {
                    next.classes.middle.unemployed_workers =
                        (next.classes.middle.unemployed_workers + delta).max(0);
                }
                other => {
                    return Err(MutationError::InvalidClass {
                        class: other,
                        reason: "AdjustUnemployedWorkers not valid for this class".to_string(),
                    });
                }
            }
        }

        Mutation::AdjustSkilledWorkers { class_id, delta } => {
            match class_id {
                ClassId::Working => {
                    next.classes.working.unemployed_skilled_workers =
                        (next.classes.working.unemployed_skilled_workers + delta).max(0);
                }
                ClassId::Middle => {
                    next.classes.middle.unemployed_skilled_workers =
                        (next.classes.middle.unemployed_skilled_workers + delta).max(0);
                }
                other => {
                    return Err(MutationError::InvalidClass {
                        class: other,
                        reason: "AdjustSkilledWorkers not valid for this class".to_string(),
                    });
                }
            }
        }

        Mutation::AdjustVotingCubes { class_id, delta } => {
            match class_id {
                ClassId::Working => {
                    next.classes.working.voting_cubes_in_bag =
                        (next.classes.working.voting_cubes_in_bag + delta).max(0);
                }
                ClassId::Middle => {
                    next.classes.middle.voting_cubes_in_bag =
                        (next.classes.middle.voting_cubes_in_bag + delta).max(0);
                }
                ClassId::Capitalist => {
                    next.classes.capitalist.voting_cubes_in_bag =
                        (next.classes.capitalist.voting_cubes_in_bag + delta).max(0);
                }
                ClassId::State => {
                    return Err(MutationError::InvalidClass {
                        class: ClassId::State,
                        reason: "AdjustVotingCubes: State does not have voting cubes".to_string(),
                    });
                }
            }
        }

        Mutation::AdjustBillMarkers { class_id, delta } => {
            match class_id {
                ClassId::Working => {
                    next.classes.working.bill_markers_available =
                        (next.classes.working.bill_markers_available as i32 + delta).max(0) as u8;
                }
                ClassId::Middle => {
                    next.classes.middle.bill_markers_available =
                        (next.classes.middle.bill_markers_available as i32 + delta).max(0) as u8;
                }
                ClassId::Capitalist => {
                    next.classes.capitalist.bill_markers_available =
                        (next.classes.capitalist.bill_markers_available as i32 + delta).max(0)
                            as u8;
                }
                ClassId::State => {
                    next.classes.state.bill_markers_available =
                        (next.classes.state.bill_markers_available as i32 + delta).max(0) as u8;
                }
            }
        }

        Mutation::AdjustHandSize { class_id, delta } => {
            match class_id {
                ClassId::Working => {
                    next.classes.working.hand_size =
                        (next.classes.working.hand_size + delta).max(0);
                }
                ClassId::Middle => {
                    next.classes.middle.hand_size =
                        (next.classes.middle.hand_size + delta).max(0);
                }
                ClassId::Capitalist => {
                    next.classes.capitalist.hand_size =
                        (next.classes.capitalist.hand_size + delta).max(0);
                }
                ClassId::State => {
                    next.classes.state.hand_size =
                        (next.classes.state.hand_size + delta).max(0);
                }
            }
        }

        Mutation::AdjustSavings { delta } => {
            next.classes.middle.savings = (next.classes.middle.savings + delta).max(0);
        }

        Mutation::AdjustTradeUnion { index, delta } => {
            if let Some(tu) = next.classes.working.trade_unions.get_mut(index) {
                tu.workers_assigned = (tu.workers_assigned + delta).max(0);
            }
        }

        Mutation::AdjustFreeTradeZone { good, delta } => {
            let ftz = &mut next.classes.capitalist.storage.free_trade_zone;
            match good {
                Good::Food => ftz.food = (ftz.food + delta).max(0),
                Good::Luxury => ftz.luxury = (ftz.luxury + delta).max(0),
                other => {
                    return Err(MutationError::InvalidArgument {
                        reason: format!("FreeTradeZone does not support {:?}", other),
                    });
                }
            }
        }

        Mutation::AdjustMarket { good, delta } => {
            match good {
                Good::Food => next.market.food = (next.market.food + delta).max(0),
                Good::Luxury => next.market.luxury = (next.market.luxury + delta).max(0),
                Good::Health => {
                    next.market.health_goods = (next.market.health_goods + delta).max(0)
                }
                Good::Education => {
                    next.market.education_goods = (next.market.education_goods + delta).max(0)
                }
                Good::Influence => {
                    return Err(MutationError::InvalidArgument {
                        reason: "Market does not have influence goods".to_string(),
                    });
                }
            }
        }

        Mutation::AdjustPool { pool, delta } => {
            match pool {
                PoolId::Workers => next.pools.workers = (next.pools.workers + delta).max(0),
                PoolId::MiddleClass => {
                    next.pools.middle_class = (next.pools.middle_class + delta).max(0)
                }
                PoolId::ForeignCapital => {
                    next.pools.foreign_capital = (next.pools.foreign_capital + delta).max(0)
                }
            }
        }

        Mutation::AdjustPublicService { service, delta } => {
            match service {
                ServiceId::Health => {
                    next.public_services.health = (next.public_services.health + delta).max(0)
                }
                ServiceId::Education => {
                    next.public_services.education =
                        (next.public_services.education + delta).max(0)
                }
                ServiceId::MediaInfluence => {
                    next.public_services.media_influence =
                        (next.public_services.media_influence + delta).max(0)
                }
            }
        }

        Mutation::AdjustLegitimacyTokens { from_class, delta } => {
            match from_class {
                ClassId::Working => {
                    next.classes.state.legitimacy_tokens.working =
                        (next.classes.state.legitimacy_tokens.working + delta).max(0);
                }
                ClassId::Middle => {
                    next.classes.state.legitimacy_tokens.middle =
                        (next.classes.state.legitimacy_tokens.middle + delta).max(0);
                }
                ClassId::Capitalist => {
                    next.classes.state.legitimacy_tokens.capitalist =
                        (next.classes.state.legitimacy_tokens.capitalist + delta).max(0);
                }
                ClassId::State => {
                    return Err(MutationError::InvalidClass {
                        class: ClassId::State,
                        reason: "AdjustLegitimacyTokens: State does not have its own token track"
                            .to_string(),
                    });
                }
            }
        }

        Mutation::PassBill { bill_id } => {
            let bill = match next.bills.iter().find(|b| b.id == bill_id) {
                Some(b) => b.clone(),
                None => {
                    return Err(MutationError::InvalidArgument {
                        reason: format!("PassBill: no bill with id {}", bill_id),
                    });
                }
            };
            // 1. Move the Policy marker.
            match bill.policy_id {
                PolicyId::FiscalPolicy => next.policies.fiscal_policy.position = bill.proposed_section.clone(),
                PolicyId::LaborMarket => next.policies.labor_market.position = bill.proposed_section.clone(),
                PolicyId::Taxation => next.policies.taxation.position = bill.proposed_section.clone(),
                PolicyId::HealthBenefits => next.policies.health_benefits.position = bill.proposed_section.clone(),
                PolicyId::EducationWelfare => next.policies.education_welfare.position = bill.proposed_section.clone(),
                PolicyId::ForeignTrade => next.policies.foreign_trade.position = bill.proposed_section.clone(),
                PolicyId::Immigration => next.policies.immigration.position = bill.proposed_section.clone(),
            }
            // 2. Award +3 VP to the proposing class (rulebook).
            const PASS_BILL_VP: i32 = 3;
            match bill.proposed_by {
                ClassId::Working => {
                    next.classes.working.vp = next.classes.working.vp.saturating_add(PASS_BILL_VP);
                }
                ClassId::Middle => {
                    next.classes.middle.vp = next.classes.middle.vp.saturating_add(PASS_BILL_VP);
                }
                ClassId::Capitalist => {
                    next.classes.capitalist.vp = next.classes.capitalist.vp.saturating_add(PASS_BILL_VP);
                }
                ClassId::State => {
                    next.classes.state.vp = next.classes.state.vp.saturating_add(PASS_BILL_VP);
                }
            }
            // 3. Remove the bill from the queue.
            next.bills.retain(|b| b.id != bill_id);
        }

        Mutation::FailBill { bill_id } => {
            let existed = next.bills.iter().any(|b| b.id == bill_id);
            if !existed {
                return Err(MutationError::InvalidArgument {
                    reason: format!("FailBill: no bill with id {}", bill_id),
                });
            }
            next.bills.retain(|b| b.id != bill_id);
        }

        Mutation::ApplyEndRound(p) => {
            // Wages flow from Capitalist and Middle companies to Working class.
            next.classes.capitalist.revenue =
                (next.classes.capitalist.revenue - p.wages_from_capitalist).max(0);
            next.classes.middle.money =
                (next.classes.middle.money - p.wages_from_middle).max(0);
            next.classes.working.money += p.wages_to_working;

            // Taxes drain from each class to treasury.
            next.classes.working.money =
                (next.classes.working.money - p.working_income_tax).max(0);
            next.classes.middle.money = (next.classes.middle.money
                - p.middle_income_tax
                - p.middle_employment_tax)
                .max(0);
            next.classes.capitalist.revenue = (next.classes.capitalist.revenue
                - p.capitalist_income_tax
                - p.capitalist_employment_tax)
                .max(0);
            next.classes.state.treasury += p.total_to_treasury;

            // State pays welfare costs.
            next.classes.state.treasury =
                (next.classes.state.treasury - p.welfare_cost).max(0);

            // Remaining Capitalist revenue transfers to capital.
            next.classes.capitalist.capital += next.classes.capitalist.revenue;
            next.classes.capitalist.revenue = 0;

            // Prosperity steps: each step grants VP equal to the new level.
            for _ in 0..p.working_prosperity_steps.max(0) {
                next.classes.working.prosperity += 1;
                next.classes.working.vp += next.classes.working.prosperity;
            }
            for _ in 0..p.middle_prosperity_steps.max(0) {
                next.classes.middle.prosperity += 1;
                next.classes.middle.vp += next.classes.middle.prosperity;
            }
        }
    }

    next.history = std::iter::once(entry)
        .chain(state.history.iter().cloned())
        .take(HISTORY_LIMIT)
        .collect();

    Ok(next)
}

// ---------------------------------------------------------------------------
// undo
// ---------------------------------------------------------------------------

pub fn undo(state: &GameState) -> Result<Option<GameState>, MutationError> {
    if state.history.is_empty() {
        return Ok(None);
    }
    let (entry, rest) = match state.history.split_first() {
        Some(parts) => parts,
        None => return Ok(None),
    };

    let snap: StateSnapshot = serde_json::from_str(&entry.prev_snapshot).map_err(|e| {
        MutationError::HistoryCorrupt { reason: e.to_string() }
    })?;

    Ok(Some(GameState {
        meta: snap.meta,
        policies: snap.policies,
        market: snap.market,
        public_services: snap.public_services,
        pools: snap.pools,
        bills: snap.bills,
        business_deals: snap.business_deals,
        classes: snap.classes,
        crisis: snap.crisis,
        history: rest.to_vec(),
    }))
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use crate::starting_state::create_starting_state;

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

    fn base_state() -> GameState {
        create_starting_state(default_input())
    }

    fn apply_mutation_unwrap(state: &GameState, mutation: Mutation, label: &str) -> GameState {
        apply_mutation(state, mutation, label).expect("mutation should succeed in test")
    }

    #[test]
    fn set_policy_changes_position() {
        let state = base_state();
        let next = apply_mutation_unwrap(
            &state,
            Mutation::SetPolicy {
                policy_id: PolicyId::Taxation,
                position: PolicySection::B,
            },
            "test",
        );
        assert_eq!(next.policies.taxation.position, PolicySection::B);
        assert_eq!(next.history.len(), 1);
    }

    #[test]
    fn advance_phase_preparation_to_action() {
        let state = base_state();
        assert_eq!(state.meta.phase, Phase::Preparation);
        let next = apply_mutation_unwrap(&state, Mutation::AdvancePhase, "advance");
        assert_eq!(next.meta.phase, Phase::Action);
    }

    #[test]
    fn advance_phase_scoring_wraps_to_next_round() {
        let mut state = base_state();
        state.meta.phase = Phase::Scoring;
        state.meta.round = 1;
        let next = apply_mutation_unwrap(&state, Mutation::AdvancePhase, "wrap");
        assert_eq!(next.meta.phase, Phase::Preparation);
        assert_eq!(next.meta.round, 2);
    }

    #[test]
    fn advance_phase_at_round_5_stays_at_5() {
        let mut state = base_state();
        state.meta.phase = Phase::Scoring;
        state.meta.round = 5;
        let next = apply_mutation_unwrap(&state, Mutation::AdvancePhase, "wrap");
        assert_eq!(next.meta.round, 5);
        assert_eq!(next.meta.phase, Phase::Preparation);
    }

    #[test]
    fn set_round_changes_round() {
        let state = base_state();
        let next = apply_mutation_unwrap(&state, Mutation::SetRound { round: 3 }, "round");
        assert_eq!(next.meta.round, 3);
    }

    #[test]
    fn propose_bill_adds_bill() {
        let state = base_state();
        let bill = NewBill {
            policy_id: PolicyId::Taxation,
            proposed_section: PolicySection::B,
            proposed_by: ClassId::Working,
            immediate_vote: false,
        };
        let next = apply_mutation_unwrap(&state, Mutation::ProposeBill(bill), "propose");
        assert_eq!(next.bills.len(), 1);
        assert_eq!(next.bills[0].policy_id, PolicyId::Taxation);
    }

    #[test]
    fn remove_bill_removes_it() {
        let state = base_state();
        let bill = NewBill {
            policy_id: PolicyId::Immigration,
            proposed_section: PolicySection::C,
            proposed_by: ClassId::Middle,
            immediate_vote: true,
        };
        let with_bill = apply_mutation_unwrap(&state, Mutation::ProposeBill(bill), "propose");
        let bill_id = with_bill.bills[0].id.clone();
        let without_bill =
            apply_mutation_unwrap(&with_bill, Mutation::RemoveBill { id: bill_id }, "remove");
        assert_eq!(without_bill.bills.len(), 0);
    }

    #[test]
    fn adjust_money_working() {
        let state = base_state();
        assert_eq!(state.classes.working.money, 30);
        let next = apply_mutation_unwrap(
            &state,
            Mutation::AdjustMoney { class_id: ClassId::Working, delta: 10 },
            "money",
        );
        assert_eq!(next.classes.working.money, 40);
    }

    #[test]
    fn adjust_money_clamps_to_zero() {
        let state = base_state();
        let next = apply_mutation_unwrap(
            &state,
            Mutation::AdjustMoney { class_id: ClassId::Working, delta: -1000 },
            "money",
        );
        assert_eq!(next.classes.working.money, 0);
    }

    #[test]
    fn adjust_revenue_capitalist() {
        let state = base_state();
        assert_eq!(state.classes.capitalist.revenue, 120);
        let next = apply_mutation_unwrap(&state, Mutation::AdjustRevenue { delta: -20 }, "revenue");
        assert_eq!(next.classes.capitalist.revenue, 100);
    }

    #[test]
    fn adjust_vp_working() {
        let state = base_state();
        let next = apply_mutation_unwrap(
            &state,
            Mutation::AdjustVp { class_id: ClassId::Working, delta: 5 },
            "vp",
        );
        assert_eq!(next.classes.working.vp, 5);
    }

    #[test]
    fn adjust_storage_working_food() {
        let state = base_state();
        let next = apply_mutation_unwrap(
            &state,
            Mutation::AdjustStorage {
                class_id: ClassId::Working,
                good: Good::Food,
                delta: 3,
            },
            "storage",
        );
        assert_eq!(next.classes.working.storage.food, 3);
    }

    #[test]
    fn adjust_loans_middle() {
        let state = base_state();
        let next = apply_mutation_unwrap(
            &state,
            Mutation::AdjustLoans { class_id: ClassId::Middle, delta: 2 },
            "loans",
        );
        assert_eq!(next.classes.middle.loans, 2);
    }

    #[test]
    fn undo_restores_previous_state() {
        let state = base_state();
        let mutated = apply_mutation_unwrap(
            &state,
            Mutation::AdjustMoney { class_id: ClassId::Working, delta: 50 },
            "test",
        );
        assert_eq!(mutated.classes.working.money, 80);
        let restored = undo(&mutated).unwrap().unwrap();
        assert_eq!(restored.classes.working.money, 30);
    }

    #[test]
    fn undo_on_empty_history_returns_none() {
        let state = base_state();
        assert!(undo(&state).unwrap().is_none());
    }

    #[test]
    fn history_is_capped_at_30() {
        let mut state = base_state();
        for i in 0..35 {
            state = apply_mutation_unwrap(
                &state,
                Mutation::AdjustMoney { class_id: ClassId::Working, delta: 1 },
                &format!("step {}", i),
            );
        }
        assert_eq!(state.history.len(), 30);
    }

    #[test]
    fn set_notes_working() {
        let state = base_state();
        let next = apply_mutation_unwrap(
            &state,
            Mutation::SetNotes { class_id: ClassId::Working, text: "hello world".to_string() },
            "notes",
        );
        assert_eq!(next.classes.working.notes, "hello world");
    }

    #[test]
    fn adjust_legitimacy_working() {
        let state = base_state();
        let next = apply_mutation_unwrap(
            &state,
            Mutation::AdjustLegitimacy { from_class: ClassId::Working, delta: 3 },
            "legit",
        );
        assert_eq!(next.classes.state.legitimacy.working, 5);
    }

    #[test]
    fn set_phase_direct() {
        let state = base_state();
        let next = apply_mutation_unwrap(&state, Mutation::SetPhase { phase: Phase::Elections }, "phase");
        assert_eq!(next.meta.phase, Phase::Elections);
    }

    #[test]
    fn adjust_treasury() {
        let state = base_state();
        let next = apply_mutation_unwrap(&state, Mutation::AdjustTreasury { delta: 30 }, "treasury");
        assert_eq!(next.classes.state.treasury, 150);
    }

    #[test]
    fn adjust_capital_capitalist() {
        let state = base_state();
        let next = apply_mutation_unwrap(
            &state,
            Mutation::AdjustCapital { class_id: ClassId::Capitalist, delta: 50 },
            "capital",
        );
        assert_eq!(next.classes.capitalist.capital, 50);
    }

    #[test]
    fn adjust_trade_union() {
        let state = base_state();
        let next = apply_mutation_unwrap(
            &state,
            Mutation::AdjustTradeUnion { index: 0, delta: 3 },
            "tu",
        );
        assert_eq!(next.classes.working.trade_unions[0].workers_assigned, 3);
    }

    #[test]
    fn adjust_market_food() {
        let state = base_state();
        let next = apply_mutation_unwrap(
            &state,
            Mutation::AdjustMarket { good: Good::Food, delta: 5 },
            "market",
        );
        assert_eq!(next.market.food, 5);
    }

    #[test]
    fn adjust_pool_workers() {
        let state = base_state();
        let next = apply_mutation_unwrap(
            &state,
            Mutation::AdjustPool { pool: PoolId::Workers, delta: 2 },
            "pool",
        );
        assert_eq!(next.pools.workers, next.pools.workers.max(0));
    }

    #[test]
    fn adjust_legitimacy_tokens() {
        let state = base_state();
        let next = apply_mutation_unwrap(
            &state,
            Mutation::AdjustLegitimacyTokens { from_class: ClassId::Working, delta: 1 },
            "tokens",
        );
        assert_eq!(next.classes.state.legitimacy_tokens.working, 1);
    }

    #[test]
    fn apply_end_round_basic() {
        let state = base_state();
        let next = apply_mutation_unwrap(
            &state,
            Mutation::ApplyEndRound(EndRoundPayload {
                wages_from_capitalist: 20,
                wages_from_middle: 10,
                wages_to_working: 30,
                working_income_tax: 5,
                middle_income_tax: 5,
                middle_employment_tax: 10,
                capitalist_income_tax: 10,
                capitalist_employment_tax: 20,
                total_to_treasury: 50,
                welfare_cost: 10,
                working_prosperity_steps: 1,
                middle_prosperity_steps: 0,
            }),
            "end round",
        );
        // Working gets wages (30) then pays tax (5): 30 + 30 - 5 = 55
        assert_eq!(next.classes.working.money, 55);
        // Working prosperity stepped up by 1
        assert_eq!(next.classes.working.prosperity, 1);
        // VP gained = new prosperity level = 1
        assert_eq!(next.classes.working.vp, 1);
        // Capitalist revenue: 120 - 20 (wages) - 10 (income) - 20 (employment) = 70 → transferred to capital
        assert_eq!(next.classes.capitalist.revenue, 0);
        assert_eq!(next.classes.capitalist.capital, 70);
        // State treasury: 120 + 50 (taxes) - 10 (welfare) = 160
        assert_eq!(next.classes.state.treasury, 160);
    }

    #[test]
    fn adjust_money_capitalist_returns_invalid_class_error() {
        let state = base_state();
        let result = apply_mutation(
            &state,
            Mutation::AdjustMoney { class_id: ClassId::Capitalist, delta: 10 },
            "bad",
        );
        match result {
            Err(MutationError::InvalidClass { class, .. }) => {
                assert_eq!(class, ClassId::Capitalist);
            }
            other => panic!("expected InvalidClass error, got {:?}", other),
        }
    }

    #[test]
    fn adjust_legitimacy_state_returns_invalid_class_error() {
        let state = base_state();
        let result = apply_mutation(
            &state,
            Mutation::AdjustLegitimacy { from_class: ClassId::State, delta: 1 },
            "bad",
        );
        assert!(matches!(result, Err(MutationError::InvalidClass { class: ClassId::State, .. })));
    }

    #[test]
    fn adjust_capital_state_returns_invalid_class_error() {
        let state = base_state();
        let result = apply_mutation(
            &state,
            Mutation::AdjustCapital { class_id: ClassId::State, delta: 1 },
            "bad",
        );
        assert!(matches!(result, Err(MutationError::InvalidClass { class: ClassId::State, .. })));
    }

    #[test]
    fn pass_bill_moves_policy_awards_vp_removes_bill() {
        let state = base_state();
        let bill = NewBill {
            policy_id: PolicyId::Taxation,
            proposed_section: PolicySection::C,
            proposed_by: ClassId::Working,
            immediate_vote: false,
        };
        let proposed = apply_mutation_unwrap(&state, Mutation::ProposeBill(bill), "p");
        let bill_id = proposed.bills[0].id.clone();
        let starting_working_vp = proposed.classes.working.vp;
        let next = apply_mutation_unwrap(
            &proposed,
            Mutation::PassBill { bill_id },
            "pass",
        );
        assert_eq!(next.policies.taxation.position, PolicySection::C);
        assert_eq!(next.classes.working.vp, starting_working_vp + 3);
        assert_eq!(next.bills.len(), 0);
    }

    #[test]
    fn pass_bill_unknown_id_returns_error() {
        let state = base_state();
        let result = apply_mutation(
            &state,
            Mutation::PassBill { bill_id: "nope".to_string() },
            "pass",
        );
        assert!(matches!(result, Err(MutationError::InvalidArgument { .. })));
    }

    #[test]
    fn fail_bill_removes_without_vp() {
        let state = base_state();
        let bill = NewBill {
            policy_id: PolicyId::Immigration,
            proposed_section: PolicySection::B,
            proposed_by: ClassId::Middle,
            immediate_vote: false,
        };
        let proposed = apply_mutation_unwrap(&state, Mutation::ProposeBill(bill), "p");
        let bill_id = proposed.bills[0].id.clone();
        let starting_vp = proposed.classes.middle.vp;
        let next = apply_mutation_unwrap(
            &proposed,
            Mutation::FailBill { bill_id },
            "fail",
        );
        assert_eq!(next.classes.middle.vp, starting_vp);
        assert_eq!(next.bills.len(), 0);
    }

    #[test]
    fn market_influence_returns_invalid_argument_error() {
        let state = base_state();
        let result = apply_mutation(
            &state,
            Mutation::AdjustMarket { good: Good::Influence, delta: 1 },
            "bad",
        );
        assert!(matches!(result, Err(MutationError::InvalidArgument { .. })));
    }
}
