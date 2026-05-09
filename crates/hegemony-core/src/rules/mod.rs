pub mod end_of_round;
pub mod foreign_trade;
pub mod game_end;
pub mod imf;
pub mod phases;
pub mod taxes;
pub mod vp;

pub use end_of_round::*;
pub use foreign_trade::*;
pub use game_end::*;
pub use imf::*;
pub use phases::*;
pub use taxes::*;
pub use vp::*;

// Helper used by imf::apply_imf_intervention.
pub(crate) fn ps(id: crate::types::PolicyId, position: crate::types::PolicySection) -> crate::types::PolicyState {
    crate::types::PolicyState { id, position }
}
