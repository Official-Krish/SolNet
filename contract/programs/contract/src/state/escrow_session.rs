use anchor_lang::prelude::*;

#[account]
pub struct EscrowSession {
    pub start_time: i64,
    pub is_active: bool,
    pub amount: u64,
    pub bump: u8,
    pub user: Pubkey,
    pub host: Pubkey,
    pub id: String,
}

impl EscrowSession {
    pub const SIZE: usize = 8 + 1 + 8 + 1 + 32 + 32 + 40;
}