use core::convert::TryFrom;
use core::convert::TryInto;
pub use decimal::*;

use anchor_lang::prelude::*;

macro_rules! impl_packed_anchor_serde {
    ($name:ident, $inner:ty) => {
        impl AnchorSerialize for $name {
            fn serialize<W: std::io::Write>(&self, writer: &mut W) -> std::io::Result<()> {
                let value = unsafe { core::ptr::addr_of!(self.v).read_unaligned() };
                AnchorSerialize::serialize(&value, writer)
            }
        }

        impl AnchorDeserialize for $name {
            fn deserialize(buf: &mut &[u8]) -> std::io::Result<Self> {
                Ok(Self {
                    v: <$inner as AnchorDeserialize>::deserialize(buf)?,
                })
            }

            fn deserialize_reader<R: std::io::Read>(reader: &mut R) -> std::io::Result<Self> {
                Ok(Self {
                    v: <$inner as AnchorDeserialize>::deserialize_reader(reader)?,
                })
            }
        }
    };
}

#[decimal(6)]
#[zero_copy(unsafe)]
#[derive(
    Default, std::fmt::Debug, PartialEq, Eq, PartialOrd, Ord,
)]
pub struct Liquidity {
    pub v: u128,
}

// Why SecondsPerLiquidity has 12 decimal?
#[decimal(12)]
#[zero_copy(unsafe)]
#[derive(
    Default, std::fmt::Debug, PartialEq, Eq, PartialOrd, Ord,
)]
pub struct SecondsPerLiquidity {
    pub v: u128,
}

impl SecondsPerLiquidity {
    pub fn unchecked_sub(self, other: SecondsPerLiquidity) -> SecondsPerLiquidity {
        SecondsPerLiquidity::new(self.get() - other.get())
    }
}

// legacy not serializable may implement later
#[decimal(0)]
#[zero_copy(unsafe)]
#[derive(
    Default, std::fmt::Debug, PartialEq, Eq, PartialOrd, Ord,
)]
pub struct TokenAmount {
    pub v: u64,
}

#[decimal(0)]
#[zero_copy(unsafe)]
#[derive(
    Default, std::fmt::Debug, PartialEq, Eq, PartialOrd, Ord,
)]
pub struct Seconds {
    pub v: u64,
}

impl Seconds {
    pub fn now() -> Self {
        Seconds::new(Clock::get().unwrap().unix_timestamp.try_into().unwrap())
    }
}

impl_packed_anchor_serde!(Liquidity, u128);
impl_packed_anchor_serde!(SecondsPerLiquidity, u128);
impl_packed_anchor_serde!(TokenAmount, u64);
impl_packed_anchor_serde!(Seconds, u64);
