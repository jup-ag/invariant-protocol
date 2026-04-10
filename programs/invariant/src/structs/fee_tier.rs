use crate::decimals::FixedPoint;
use anchor_lang::prelude::*;

#[account(zero_copy(unsafe))]
#[repr(packed)]
#[derive(PartialEq, Default, Debug)]
pub struct FeeTier {
    pub fee: FixedPoint,
    pub tick_spacing: u16,
    pub bump: u8,
}

impl FeeTier {
    pub const LEN: usize = 8 + core::mem::size_of::<Self>();
}
