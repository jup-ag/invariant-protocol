use anchor_lang::prelude::*;

#[account(zero_copy(unsafe))]
#[repr(packed)]
#[derive(PartialEq, Default, Debug)]
pub struct PositionList {
    pub head: u32,
    pub bump: u8,
}

impl PositionList {
    pub const LEN: usize = 8 + core::mem::size_of::<Self>();
}
