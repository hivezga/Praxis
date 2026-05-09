use serde::{Deserialize, Serialize};
use std::fmt;

use crate::types::ClassId;

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", tag = "kind", content = "details")]
pub enum MutationError {
    InvalidClass { class: ClassId, reason: String },
    InvalidArgument { reason: String },
    SerializationFailed { reason: String },
    HistoryCorrupt { reason: String },
}

impl fmt::Display for MutationError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            MutationError::InvalidClass { class, reason } => {
                write!(f, "Invalid class {:?}: {}", class, reason)
            }
            MutationError::InvalidArgument { reason } => {
                write!(f, "Invalid argument: {}", reason)
            }
            MutationError::SerializationFailed { reason } => {
                write!(f, "Serialization failed: {}", reason)
            }
            MutationError::HistoryCorrupt { reason } => {
                write!(f, "History snapshot corrupt: {}", reason)
            }
        }
    }
}

impl std::error::Error for MutationError {}
