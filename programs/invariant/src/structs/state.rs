use anchor_lang::prelude::*;

#[account(zero_copy(unsafe))]
#[repr(packed)]
#[derive(PartialEq, Default, Debug)]
pub struct State {
    pub admin: Pubkey,
    pub nonce: u8,
    pub authority: Pubkey,
    pub bump: u8,
}

impl State {
    pub const LEN: usize = 8 + core::mem::size_of::<Self>();
}
