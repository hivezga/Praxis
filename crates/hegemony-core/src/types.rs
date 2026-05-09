use serde::{Deserialize, Serialize};

// ---------------------------------------------------------------------------
// Core enums
// ---------------------------------------------------------------------------

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum ClassId {
    #[serde(rename = "working")]
    Working,
    #[serde(rename = "middle")]
    Middle,
    #[serde(rename = "capitalist")]
    Capitalist,
    #[serde(rename = "state")]
    State,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum GameMode {
    #[serde(rename = "solo")]
    Solo,
    #[serde(rename = "party")]
    Party,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum Phase {
    #[serde(rename = "setup")]
    Setup,
    #[serde(rename = "preparation")]
    Preparation,
    #[serde(rename = "action")]
    Action,
    #[serde(rename = "production")]
    Production,
    #[serde(rename = "elections")]
    Elections,
    #[serde(rename = "scoring")]
    Scoring,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum PolicyId {
    #[serde(rename = "fiscalPolicy")]
    FiscalPolicy,
    #[serde(rename = "laborMarket")]
    LaborMarket,
    #[serde(rename = "taxation")]
    Taxation,
    #[serde(rename = "healthBenefits")]
    HealthBenefits,
    #[serde(rename = "educationWelfare")]
    EducationWelfare,
    #[serde(rename = "foreignTrade")]
    ForeignTrade,
    #[serde(rename = "immigration")]
    Immigration,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum PolicySection {
    A,
    B,
    C,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum Good {
    #[serde(rename = "food")]
    Food,
    #[serde(rename = "luxury")]
    Luxury,
    #[serde(rename = "health")]
    Health,
    #[serde(rename = "education")]
    Education,
    #[serde(rename = "influence")]
    Influence,
}

// ---------------------------------------------------------------------------
// Policy
// ---------------------------------------------------------------------------

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PolicyState {
    pub id: PolicyId,
    pub position: PolicySection,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Policies {
    pub fiscal_policy: PolicyState,
    pub labor_market: PolicyState,
    pub taxation: PolicyState,
    pub health_benefits: PolicyState,
    pub education_welfare: PolicyState,
    pub foreign_trade: PolicyState,
    pub immigration: PolicyState,
}

// ---------------------------------------------------------------------------
// Market / public services / population
// ---------------------------------------------------------------------------

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct MarketState {
    pub food: i32,
    pub luxury: i32,
    pub health_goods: i32,
    pub education_goods: i32,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PublicServices {
    pub health: i32,
    pub education: i32,
    pub media_influence: i32,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PopulationPools {
    pub workers: i32,
    pub middle_class: i32,
    pub foreign_capital: i32,
}

// ---------------------------------------------------------------------------
// Bills and business deals
// ---------------------------------------------------------------------------

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Bill {
    pub id: String,
    pub policy_id: PolicyId,
    pub proposed_section: PolicySection,
    pub proposed_by: ClassId,
    pub immediate_vote: bool,
}

/// Used in mutations — same as Bill but without the generated id.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct NewBill {
    pub policy_id: PolicyId,
    pub proposed_section: PolicySection,
    pub proposed_by: ClassId,
    pub immediate_vote: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct BusinessDeal {
    pub id: String,
    pub label: String,
    pub cost: i32,
    pub reward: String,
}

// ---------------------------------------------------------------------------
// Expansion flags
// ---------------------------------------------------------------------------

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ExpansionModules {
    pub automa: bool,
    pub crisis_cards: bool,
    pub alternative_events: bool,
    pub hidden_agendas: bool,
    pub new_action_cards: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ExpansionFlags {
    pub crisis_and_control: bool,
    pub modules: ExpansionModules,
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct HistoryEntry {
    pub id: String,
    pub ts: u64,
    pub label: String,
    /// JSON snapshot of all GameState fields except history.
    pub prev_snapshot: String,
}

// ---------------------------------------------------------------------------
// Game meta
// ---------------------------------------------------------------------------

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct GameMeta {
    pub id: String,
    pub name: String,
    pub created_at: u64,
    pub updated_at: u64,
    pub mode: GameMode,
    pub expansions: ExpansionFlags,
    pub player_count: u8,
    pub classes_in_play: Vec<ClassId>,
    pub round: u8,
    pub phase: Phase,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub active_class: Option<ClassId>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub local_player_class: Option<ClassId>,
}

// ---------------------------------------------------------------------------
// Working class types
// ---------------------------------------------------------------------------

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct WorkingClassCompany {
    pub id: String,
    pub label: String,
    pub workers_assigned: i32,
    pub wage_level: u8,
    pub on_strike: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct TradeUnionPresence {
    pub industry: u8,
    pub workers_assigned: i32,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct WorkingStorage {
    pub food: i32,
    pub health: i32,
    pub education: i32,
    pub luxury: i32,
    pub influence: i32,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct WorkingClassState {
    pub money: i32,
    pub vp: i32,
    pub prosperity: i32,
    pub population: i32,
    pub unemployed_workers: i32,
    pub unemployed_skilled_workers: i32,
    pub companies: Vec<WorkingClassCompany>,
    pub trade_unions: Vec<TradeUnionPresence>,
    pub cooperating_farms_remaining: i32,
    pub storage: WorkingStorage,
    pub loans: i32,
    pub hand_size: i32,
    pub voting_cubes_in_bag: i32,
    pub bill_markers_available: u8,
    pub notes: String,
}

// ---------------------------------------------------------------------------
// Middle class types
// ---------------------------------------------------------------------------

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct MiddlePrices {
    pub food: i32,
    pub luxury: i32,
    pub health: i32,
    pub education: i32,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct MiddleStorage {
    pub food: i32,
    pub luxury: i32,
    pub health: i32,
    pub education: i32,
    pub influence: i32,
    pub prices: MiddlePrices,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct MiddleCompany {
    pub id: String,
    pub label: String,
    pub workers_assigned: i32,
    pub working_class_employees: i32,
    pub wage_level: u8,
    pub fully_operational: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct MiddleClassState {
    pub money: i32,
    pub capital: i32,
    pub vp: i32,
    pub prosperity: i32,
    pub savings: i32,
    pub population: i32,
    pub unemployed_workers: i32,
    pub unemployed_skilled_workers: i32,
    pub companies: Vec<MiddleCompany>,
    pub market_company_ids: Vec<String>,
    pub storage: MiddleStorage,
    pub loans: i32,
    pub hand_size: i32,
    pub voting_cubes_in_bag: i32,
    pub bill_markers_available: u8,
    pub notes: String,
}

// ---------------------------------------------------------------------------
// Capitalist class types
// ---------------------------------------------------------------------------

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CapitalistPrices {
    pub food: i32,
    pub luxury: i32,
    pub health: i32,
    pub education: i32,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct FreeTradeZone {
    pub food: i32,
    pub luxury: i32,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CapitalistStorage {
    pub food: i32,
    pub luxury: i32,
    pub health: i32,
    pub education: i32,
    pub influence: i32,
    pub free_trade_zone: FreeTradeZone,
    pub prices: CapitalistPrices,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CapitalistCompany {
    pub id: String,
    pub label: String,
    pub workers_assigned: i32,
    pub wage_level: u8,
    pub industry: u8,
    pub on_strike: bool,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CapitalistState {
    pub revenue: i32,
    pub capital: i32,
    pub vp: i32,
    pub companies: Vec<CapitalistCompany>,
    pub market_company_ids: Vec<String>,
    pub storage: CapitalistStorage,
    pub loans: i32,
    pub hand_size: i32,
    pub voting_cubes_in_bag: i32,
    pub bill_markers_available: u8,
    /// Highest Wealth-table space index reached so far (0 = start, 1..15
    /// per board spaces). Marker only advances rightward — rulebook v1.2
    /// page 21. Each space advanced during Scoring grants +3 VP. Default
    /// 0 for backward-compat with pre-marker save files.
    #[serde(default)]
    pub wealth_marker_position: u8,
    pub notes: String,
}

// ---------------------------------------------------------------------------
// State class types
// ---------------------------------------------------------------------------

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct StateStorage {
    pub food: i32,
    pub luxury: i32,
    pub influence: i32,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct WelfareState {
    pub health: PolicySection,
    pub education: PolicySection,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PublicCompany {
    pub id: String,
    pub label: String,
    pub industry: String,
    pub workers_assigned: i32,
    pub wage_level: u8,
    pub operational: bool,
    pub row_index: u8,
}

#[derive(Clone, Debug, Default, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct LegitimacyMap {
    pub working: i32,
    pub middle: i32,
    pub capitalist: i32,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct StateClassState {
    pub treasury: i32,
    pub vp: i32,
    pub legitimacy: LegitimacyMap,
    pub legitimacy_tokens: LegitimacyMap,
    pub public_companies: Vec<PublicCompany>,
    pub storage: StateStorage,
    pub welfare: WelfareState,
    pub event_card_ids: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub political_agenda_card_id: Option<String>,
    pub loans: i32,
    pub hand_size: i32,
    pub bill_markers_available: u8,
    pub notes: String,
}

// ---------------------------------------------------------------------------
// Classes container
// ---------------------------------------------------------------------------

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Classes {
    pub working: WorkingClassState,
    pub middle: MiddleClassState,
    pub capitalist: CapitalistState,
    pub state: StateClassState,
}

// ---------------------------------------------------------------------------
// Crisis & Control expansion
// ---------------------------------------------------------------------------

/// Crisis Response card (C&C expansion p.14). 10 such cards exist in
/// the physical box; each describes 5 effect sections that override the
/// base-game IMF intervention. Effect fields default to empty/zero so
/// older serialised states (with only id/label/locks_policy) still
/// deserialise cleanly.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CrisisCard {
    pub id: String,
    pub label: String,
    /// Policies whose proposed Bills are discarded (rather than ALL
    /// Bills, per fixed IMF). Other Bills remain on the table.
    #[serde(default)]
    pub discard_bills_for_policies: Vec<PolicyId>,
    /// Policy moves to apply directly (each Policy + new section).
    #[serde(default)]
    pub change_policies: Vec<PolicyChange>,
    /// Treasury delta applied to State (positive = State gains).
    #[serde(default)]
    pub state_money_delta: i32,
    /// True iff State pays off Loans at 55¥/each as part of this card.
    #[serde(default)]
    pub state_pays_off_loans: bool,
    /// Legitimacy lost per class.
    #[serde(default)]
    pub legitimacy_loss: LegitimacyMap,
    /// Policies that gain a Lock token until the next IMF check
    /// (rulebook p.14 — bills cannot be proposed for these).
    #[serde(default)]
    pub locked_policies: Vec<PolicyId>,
    /// Single-policy lock retained for backward compat with prior
    /// serialised states. Prefer `locked_policies` for new data.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub locks_policy: Option<PolicyId>,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct PolicyChange {
    pub policy_id: PolicyId,
    pub new_position: PolicySection,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct Bond {
    pub holder: ClassId,
    pub amount: i32,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AutomaOpponent {
    pub enabled: bool,
    pub vp: i32,
    pub money: i32,
    pub influence: i32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub legitimacy: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub capital: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prosperity: Option<i32>,
    pub notes: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AutomaOpponents {
    pub middle: AutomaOpponent,
    pub capitalist: AutomaOpponent,
    pub state: AutomaOpponent,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AutomaState {
    pub difficulty: String,
    pub opponents: AutomaOpponents,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct CrisisState {
    pub crisis_cards: Vec<CrisisCard>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub active_crisis_card_id: Option<String>,
    pub bonds: Vec<Bond>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub automa: Option<AutomaState>,
}

// ---------------------------------------------------------------------------
// Top-level GameState
// ---------------------------------------------------------------------------

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct GameState {
    pub meta: GameMeta,
    pub policies: Policies,
    pub market: MarketState,
    pub public_services: PublicServices,
    pub pools: PopulationPools,
    pub bills: Vec<Bill>,
    pub business_deals: Vec<BusinessDeal>,
    pub classes: Classes,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub crisis: Option<CrisisState>,
    pub history: Vec<HistoryEntry>,
}

// ---------------------------------------------------------------------------
// New game input
// ---------------------------------------------------------------------------

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct NewGameInput {
    pub name: Option<String>,
    pub mode: GameMode,
    pub player_count: u8,
    pub classes_in_play: Vec<ClassId>,
    pub expansions: ExpansionFlags,
    pub local_player_class: Option<ClassId>,
}

// ---------------------------------------------------------------------------
// Mutation helper types
// ---------------------------------------------------------------------------

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum PoolId {
    #[serde(rename = "workers")]
    Workers,
    #[serde(rename = "middleClass")]
    MiddleClass,
    #[serde(rename = "foreignCapital")]
    ForeignCapital,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum ServiceId {
    #[serde(rename = "health")]
    Health,
    #[serde(rename = "education")]
    Education,
    #[serde(rename = "mediaInfluence")]
    MediaInfluence,
}

/// All values needed to apply end-of-round changes atomically.
#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct EndRoundPayload {
    pub wages_from_capitalist: i32,
    pub wages_from_middle: i32,
    pub wages_to_working: i32,
    pub working_income_tax: i32,
    pub middle_income_tax: i32,
    pub middle_employment_tax: i32,
    pub capitalist_income_tax: i32,
    pub capitalist_employment_tax: i32,
    pub total_to_treasury: i32,
    pub welfare_cost: i32,
    pub working_prosperity_steps: i32,
    pub middle_prosperity_steps: i32,
}

// ---------------------------------------------------------------------------
// Output / suggestion types
// ---------------------------------------------------------------------------

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct TaxSuggestion {
    pub multiplier: i32,
    pub working_income_tax: i32,
    pub middle_income_tax: i32,
    pub middle_employment_tax: i32,
    pub capitalist_income_tax: i32,
    pub capitalist_employment_tax: i32,
    pub total_to_treasury: i32,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct VpBreakdown {
    pub base: i32,
    pub total: i32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub prosperity: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub trade_unions: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub storage: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub legitimacy: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cash: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub capital: Option<i32>,
    /// Capitalist Wealth-marker movement bonus that WOULD apply this
    /// Scoring Phase: 3 VP per space the marker would advance. Once
    /// the marker is advanced, this drops to 0 until Capital grows
    /// past the next space.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub capital_marker_bonus: Option<i32>,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct WagesSuggestion {
    pub from_capitalist: i32,
    pub from_middle: i32,
    pub to_working: i32,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct WelfareCostsSuggestion {
    pub from_state: i32,
    pub notes: String,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ProsperityDelta {
    pub working: i32,
    pub middle: i32,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct VpAtScoring {
    pub working: i32,
    pub middle: i32,
    pub capitalist: i32,
    pub state: i32,
}

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct RoundSuggestion {
    pub taxes: TaxSuggestion,
    pub vp_at_scoring: VpAtScoring,
    pub wages: WagesSuggestion,
    pub welfare_costs: WelfareCostsSuggestion,
    pub prosperity_delta: ProsperityDelta,
    pub notes: Vec<String>,
}
