//! Hegemony Company card database — derived from the public Hegemony
//! community spreadsheet (Web Monkey & contributors, BGG file 256799,
//! and the linked Google Sheet).
//!
//! Source CSVs are checked in to `docs/data/`:
//!   - cap-public-companies.csv  → Capitalist + Public configs
//!   - middle-companies.csv      → Middle Class configs
//!   - wages-per-company.csv     → wage table by employer + slot pattern
//!
//! Notes on wage semantics (rulebook pages 11, 20, 25):
//!   - Capitalist + Public + Cooperative Farm: wages are FLAT per
//!     Company (printed L1/L2/L3 values).
//!   - Middle Class: wages are PER WORKER. The `wages` array stores the
//!     per-worker rate; the Production-phase code multiplies by the
//!     number of Working Class employees in the Company.
//!
//! Slot pattern legend (column "Workers" in the spreadsheet):
//!   S = skilled Working Class worker (industry-colored)
//!   N = unskilled Working Class worker (gray)
//!   s = MC skilled (Middle Class colored)
//!   n = MC unskilled (Middle Class gray)
//!   () denotes a Working-Class employee slot inside a Middle Co
//!
//! IDs follow the form `<class>-<industry>-<slots>-<production>` for
//! generic deck cards, or use the printed name for the 8 starting Cos
//! and the few visible rulebook examples.

use crate::types::Good;

use super::{
    CardClass, CompanyCard, Industry, ResourceOutput, SkillReq, WorkerClass, WorkerSlot,
};

// ---------------------------------------------------------------------------
// Slot constants
// ---------------------------------------------------------------------------

const SLOT_UNSKILLED_WORKING: WorkerSlot = WorkerSlot {
    class: WorkerClass::Working,
    skill: SkillReq::Unskilled,
};

const SLOT_SKILLED_WORKING: WorkerSlot = WorkerSlot {
    class: WorkerClass::Working,
    skill: SkillReq::Skilled,
};

const SLOT_UNSKILLED_MIDDLE: WorkerSlot = WorkerSlot {
    class: WorkerClass::Middle,
    skill: SkillReq::Unskilled,
};

const SLOT_SKILLED_MIDDLE: WorkerSlot = WorkerSlot {
    class: WorkerClass::Middle,
    skill: SkillReq::Skilled,
};

const SLOT_EMPLOYEE_WORKING: WorkerSlot = WorkerSlot {
    class: WorkerClass::EmployeeWorking,
    skill: SkillReq::Unskilled,
};

// Common slot patterns (referenced by &'static [WorkerSlot]).

const SLOTS_NN: &[WorkerSlot] = &[SLOT_UNSKILLED_WORKING, SLOT_UNSKILLED_WORKING];

const SLOTS_NNN: &[WorkerSlot] = &[
    SLOT_UNSKILLED_WORKING,
    SLOT_UNSKILLED_WORKING,
    SLOT_UNSKILLED_WORKING,
];

const SLOTS_SN: &[WorkerSlot] = &[SLOT_SKILLED_WORKING, SLOT_UNSKILLED_WORKING];

const SLOTS_SNN: &[WorkerSlot] = &[
    SLOT_SKILLED_WORKING,
    SLOT_UNSKILLED_WORKING,
    SLOT_UNSKILLED_WORKING,
];

// Middle-Class slot patterns: S(s) = MC skilled + MC unskilled, S(n) = MC skilled + WC employee.
const SLOTS_MID_SS: &[WorkerSlot] = &[SLOT_SKILLED_MIDDLE, SLOT_UNSKILLED_MIDDLE];

const SLOTS_MID_SN: &[WorkerSlot] = &[SLOT_SKILLED_MIDDLE, SLOT_EMPLOYEE_WORKING];

// Empty slot list (used for fully automated Cap Companies).
const SLOTS_NONE: &[WorkerSlot] = &[];

// ---------------------------------------------------------------------------
// Production-output constants
// ---------------------------------------------------------------------------

const fn prod_food(qty: i32) -> [ResourceOutput; 1] {
    [ResourceOutput { good: Good::Food, qty }]
}
const fn prod_luxury(qty: i32) -> [ResourceOutput; 1] {
    [ResourceOutput { good: Good::Luxury, qty }]
}
const fn prod_health(qty: i32) -> [ResourceOutput; 1] {
    [ResourceOutput { good: Good::Health, qty }]
}
const fn prod_education(qty: i32) -> [ResourceOutput; 1] {
    [ResourceOutput { good: Good::Education, qty }]
}
const fn prod_influence(qty: i32) -> [ResourceOutput; 1] {
    [ResourceOutput { good: Good::Influence, qty }]
}

// Static slices for each production amount used.
static P_FOOD_2: [ResourceOutput; 1] = prod_food(2);
static P_FOOD_3: [ResourceOutput; 1] = prod_food(3);
static P_FOOD_4: [ResourceOutput; 1] = prod_food(4);
static P_FOOD_5: [ResourceOutput; 1] = prod_food(5);
static P_FOOD_6: [ResourceOutput; 1] = prod_food(6);
static P_LUX_2: [ResourceOutput; 1] = prod_luxury(2);
static P_LUX_3: [ResourceOutput; 1] = prod_luxury(3);
static P_LUX_4: [ResourceOutput; 1] = prod_luxury(4);
static P_LUX_5: [ResourceOutput; 1] = prod_luxury(5);
static P_LUX_6: [ResourceOutput; 1] = prod_luxury(6);
static P_LUX_7: [ResourceOutput; 1] = prod_luxury(7);
static P_LUX_8: [ResourceOutput; 1] = prod_luxury(8);
static P_HEALTH_2: [ResourceOutput; 1] = prod_health(2);
static P_HEALTH_4: [ResourceOutput; 1] = prod_health(4);
static P_HEALTH_6: [ResourceOutput; 1] = prod_health(6);
static P_HEALTH_7: [ResourceOutput; 1] = prod_health(7);
static P_HEALTH_8: [ResourceOutput; 1] = prod_health(8);
static P_HEALTH_9: [ResourceOutput; 1] = prod_health(9);
static P_EDU_2: [ResourceOutput; 1] = prod_education(2);
static P_EDU_4: [ResourceOutput; 1] = prod_education(4);
static P_EDU_6: [ResourceOutput; 1] = prod_education(6);
static P_EDU_7: [ResourceOutput; 1] = prod_education(7);
static P_EDU_8: [ResourceOutput; 1] = prod_education(8);
static P_EDU_9: [ResourceOutput; 1] = prod_education(9);
static P_INF_2: [ResourceOutput; 1] = prod_influence(2);
static P_INF_3: [ResourceOutput; 1] = prod_influence(3);
static P_INF_4: [ResourceOutput; 1] = prod_influence(4);

// ---------------------------------------------------------------------------
// Helper macro for Capitalist/Public configs
// ---------------------------------------------------------------------------

const fn cap(
    id: &'static str,
    name: &'static str,
    industry: Industry,
    cost: i32,
    wages: [i32; 3],
    slots: &'static [WorkerSlot],
    production: &'static [ResourceOutput],
    machinery_slot: bool,
    automated: bool,
) -> CompanyCard {
    CompanyCard {
        id,
        name,
        class: CardClass::Capitalist,
        industry,
        cost,
        wages,
        slots,
        production,
        machinery_slot,
        automated,
        employee_bonus: None,
        verified: true,
    }
}

const fn pubc(
    id: &'static str,
    name: &'static str,
    industry: Industry,
    cost: i32,
    wages: [i32; 3],
    slots: &'static [WorkerSlot],
    production: &'static [ResourceOutput],
    machinery_slot: bool,
) -> CompanyCard {
    CompanyCard {
        id,
        name,
        class: CardClass::Public,
        industry,
        cost,
        wages,
        slots,
        production,
        machinery_slot,
        automated: false,
        employee_bonus: None,
        verified: true,
    }
}

const fn mid(
    id: &'static str,
    name: &'static str,
    industry: Industry,
    cost: i32,
    wages_per_worker: [i32; 3],
    slots: &'static [WorkerSlot],
    production: &'static [ResourceOutput],
    employee_bonus: Option<i32>,
) -> CompanyCard {
    CompanyCard {
        id,
        name,
        class: CardClass::Middle,
        industry,
        cost,
        wages: wages_per_worker, // semantics for MC: per-worker rate, not flat
        slots,
        production,
        machinery_slot: false,
        automated: false,
        employee_bonus,
        verified: true,
    }
}

// ---------------------------------------------------------------------------
// Master list. Ordered by class, then industry, then production size.
// Configurations come from cap-public-companies.csv + middle-companies.csv.
// Wage values from wages-per-company.csv (cross-validated).
// ---------------------------------------------------------------------------

pub static ALL_COMPANY_CARDS: &[CompanyCard] = &[
    // ---------------------- CAPITALIST CLASS -----------------------------
    // Starting cards (4) — rulebook page 8. They use the "CC/STATE all-5"
    // wage scale (softer than the regular-deck industry-specific scale).
    // Per rulebook page 4: Supermarket pays L3=25/L2=20/L1=15, produces
    // 4 Food when fully operational. Same softer scale applies to the
    // other three starting Cap Cos.
    cap("cap-supermarket",   "Supermarket",  Industry::Agriculture, 15, [15, 20, 25], SLOTS_SN, &P_FOOD_4,   false, false),
    cap("cap-shopping-mall", "Shopping Mall",Industry::Luxury,      15, [15, 20, 25], SLOTS_SN, &P_LUX_6,    false, false),
    cap("cap-college",       "College",      Industry::Education,   15, [15, 20, 25], SLOTS_SN, &P_EDU_4,    false, false),
    cap("cap-clinic",        "Clinic",       Industry::Healthcare,  15, [15, 20, 25], SLOTS_SN, &P_HEALTH_4, false, false),

    // Health / Education (red, orange) — regular-deck Capitalist Cos use
    // the steeper Health/Edu/Influence wage scale: SN = 10/20/30,
    // SNN = 20/30/40 per spreadsheet wages-per-company.csv.
    cap("cap-health-sn-6",  "Cap Clinic (deck)",       Industry::Healthcare, 16, [10, 20, 30], SLOTS_SN,  &P_HEALTH_6, true,  false),
    cap("cap-health-sn-7",  "Health Center",            Industry::Healthcare, 20, [10, 20, 30], SLOTS_SN,  &P_HEALTH_7, false, false),
    cap("cap-health-snn-8", "Hospital",                 Industry::Healthcare, 20, [20, 30, 40], SLOTS_SNN, &P_HEALTH_8, true,  false),
    cap("cap-health-snn-9", "Medical Center",           Industry::Healthcare, 24, [20, 30, 40], SLOTS_SNN, &P_HEALTH_9, true,  false),

    cap("cap-education-sn-6",  "Cap College (deck)",       Industry::Education, 16, [10, 20, 30], SLOTS_SN,  &P_EDU_6, true,  false),
    cap("cap-education-sn-7",  "University",                Industry::Education, 20, [10, 20, 30], SLOTS_SN,  &P_EDU_7, false, false),
    cap("cap-education-snn-8", "Institute of Technology",   Industry::Education, 20, [20, 30, 40], SLOTS_SNN, &P_EDU_8, true,  false),
    cap("cap-education-snn-9", "Academy",                   Industry::Education, 24, [20, 30, 40], SLOTS_SNN, &P_EDU_9, true,  false),

    // Luxury (blue) — Lux/Food/Influence wage scale: NN=10/15/20, NNN=20/25/30, SNN=25/30/35
    cap("cap-luxury-nn-4",  "Boutique",                 Industry::Luxury, 8,  [10, 15, 20], SLOTS_NN,  &P_LUX_4, true,  false),
    cap("cap-luxury-nnn-7", "Cap Shopping Mall (deck)", Industry::Luxury, 15, [20, 25, 30], SLOTS_NNN, &P_LUX_7, false, false),
    cap("cap-luxury-snn-8", "Luxury Hotel",             Industry::Luxury, 20, [25, 30, 35], SLOTS_SNN, &P_LUX_8, true,  false),
    cap("cap-luxury-aut-3-25", "Electronics Manufacturer (small)", Industry::Luxury, 25, [0, 0, 0], SLOTS_NONE, &P_LUX_3, false, true),
    cap("cap-luxury-aut-5",  "Electronics Manufacturer", Industry::Luxury, 45, [0, 0, 0], SLOTS_NONE, &P_LUX_5, false, true),

    // Food / Agriculture (green)
    cap("cap-food-nn-3",  "Vegetable Farm",     Industry::Agriculture, 8,  [10, 15, 20], SLOTS_NN,  &P_FOOD_3, false, false),
    cap("cap-food-nnn-5", "Cap Supermarket (deck)", Industry::Agriculture, 15, [20, 25, 30], SLOTS_NNN, &P_FOOD_5, false, false),
    cap("cap-food-snn-6", "Food Processing",    Industry::Agriculture, 20, [25, 30, 35], SLOTS_SNN, &P_FOOD_6, true,  false),
    cap("cap-food-aut-2", "Automated Dairy Farm (small)", Industry::Agriculture, 25, [0, 0, 0], SLOTS_NONE, &P_FOOD_2, false, true),
    cap("cap-food-aut-3", "Automated Dairy Farm",         Industry::Agriculture, 45, [0, 0, 0], SLOTS_NONE, &P_FOOD_3, false, true),

    // Influence / Media (purple)
    cap("cap-media-nn-2",  "Newsletter",     Industry::Media, 8,  [10, 15, 20], SLOTS_NN,  &P_INF_2, false, false),
    cap("cap-media-nnn-3", "Newspaper",      Industry::Media, 12, [20, 25, 30], SLOTS_NNN, &P_INF_3, false, false),
    cap("cap-media-sn-3",  "Radio Station",  Industry::Media, 16, [10, 20, 30], SLOTS_SN,  &P_INF_3, false, false),
    cap("cap-media-snn-4", "TV Station",     Industry::Media, 24, [20, 30, 40], SLOTS_SNN, &P_INF_4, false, false),

    // ---------------------- PUBLIC COMPANIES -----------------------------
    // Public Cos use the CC/STATE wage scale: SN=15/20/25, SNN=25/30/35
    // (rulebook page 11 — State pays Public Co wages from Treasury).
    pubc("pub-public-hospital",   "Public Hospital",         Industry::Healthcare, 16, [15, 20, 25], SLOTS_SN,  &P_HEALTH_6, false),
    pubc("pub-public-university", "Public University",       Industry::Education,  16, [15, 20, 25], SLOTS_SN,  &P_EDU_6, false),
    pubc("pub-health-snn-9",      "General Hospital",        Industry::Healthcare, 24, [25, 30, 35], SLOTS_SNN, &P_HEALTH_9, false),
    pubc("pub-edu-snn-9",         "Higher Education",        Industry::Education,  24, [25, 30, 35], SLOTS_SNN, &P_EDU_9, false),
    pubc("pub-luxury-sn-6",       "Cultural Center",         Industry::Luxury,     16, [15, 20, 25], SLOTS_SN,  &P_LUX_6, false),
    pubc("pub-food-snn-6",        "Public Farm",             Industry::Agriculture,20, [25, 30, 35], SLOTS_SNN, &P_FOOD_6, false),
    pubc("pub-media-sn-3",        "Public Broadcasting",     Industry::Media,      20, [15, 20, 25], SLOTS_SN,  &P_INF_3, false),
    pubc("pub-media-snn-4",       "State Media Authority",   Industry::Media,      24, [25, 30, 35], SLOTS_SNN, &P_INF_4, false),

    // ---------------------- MIDDLE CLASS ---------------------------------
    // Wages here are PER WORKER. S(s) variants use the 9/12/15 scale,
    // S(n) variants use the 6/8/10 scale (rulebook page 25 + spreadsheet
    // wages-per-company.csv).

    // S(s) — 1 MC skilled + 1 MC unskilled (no Working employee)
    mid("mid-convenience-store", "Convenience Store",   Industry::Agriculture, 20, [9, 12, 15], SLOTS_MID_SS, &P_FOOD_2, None),
    mid("mid-doctors-office",    "Doctor's Office",     Industry::Healthcare,  20, [9, 12, 15], SLOTS_MID_SS, &P_HEALTH_2, None),
    mid("mid-media-ss-2",        "Local Newsletter",    Industry::Media,       20, [9, 12, 15], SLOTS_MID_SS, &P_INF_2, None),
    mid("mid-edu-ss-2",          "Tutoring Center",     Industry::Education,   20, [9, 12, 15], SLOTS_MID_SS, &P_EDU_2, None),
    mid("mid-luxury-ss-2",       "Specialty Store",     Industry::Luxury,      20, [9, 12, 15], SLOTS_MID_SS, &P_LUX_2, None),

    // S(n) — 1 MC skilled + 1 Working Class employee
    mid("mid-food-sn-2",    "Family Diner",        Industry::Agriculture, 14, [6, 8, 10], SLOTS_MID_SN, &P_FOOD_2, Some(2)),
    mid("mid-media-sn-2",   "Local Radio",         Industry::Media,       14, [6, 8, 10], SLOTS_MID_SN, &P_INF_2, Some(2)),
    mid("mid-health-sn-2",  "Private Clinic",      Industry::Healthcare,  12, [6, 8, 10], SLOTS_MID_SN, &P_HEALTH_2, Some(2)),
    mid("mid-edu-sn-2",     "Private School",      Industry::Education,   12, [6, 8, 10], SLOTS_MID_SN, &P_EDU_2, Some(2)),
    mid("mid-luxury-sn-2",  "Luxury Boutique",     Industry::Luxury,      12, [6, 8, 10], SLOTS_MID_SN, &P_LUX_2, Some(2)),

    // Larger Middle Cos (SN + 4 production) — from middle-companies.csv
    // (these have 1 MC skilled + 1 Working employee + larger production).
    mid("mid-health-sn-4",  "Technical Clinic",    Industry::Healthcare,  16, [6, 8, 10], SLOTS_MID_SN, &P_HEALTH_4, None),
    mid("mid-edu-sn-4",     "Technical University",Industry::Education,   16, [6, 8, 10], SLOTS_MID_SN, &P_EDU_4, None),
    mid("mid-luxury-sn-4",  "Concept Store",       Industry::Luxury,      16, [6, 8, 10], SLOTS_MID_SN, &P_LUX_4, None),
    mid("mid-food-sn-3",    "Restaurant",          Industry::Agriculture, 20, [6, 8, 10], SLOTS_MID_SN, &P_FOOD_3, None),
    mid("mid-media-sn-3",   "Marketing Agency",    Industry::Media,       20, [6, 8, 10], SLOTS_MID_SN, &P_INF_3, None),

    // ---------------------- COOPERATIVE FARM -----------------------------
    CompanyCard {
        id: "farm-cooperative",
        name: "Cooperative Farm",
        class: CardClass::Farm,
        industry: Industry::Agriculture,
        cost: 25,
        wages: [0, 0, 0], // no wages: Working Class keeps the produce
        slots: SLOTS_NNN,
        production: &P_FOOD_2,
        machinery_slot: false,
        automated: false,
        employee_bonus: None,
        verified: true,
    },
];
