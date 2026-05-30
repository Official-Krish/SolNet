use anchor_lang::prelude::*;
use anchor_lang::system_program;

use crate::constants::ADMIN_PUBKEY;
use crate::errors::{DepinErrors, Errors};
use crate::state::{EscrowSession, HostMachineRegistration, RentalSession};

/// Settles a DePIN job by splitting the escrow 3 ways:
/// 1. Host earnings (uptime-based, minus platform fee)
/// 2. Platform fee (percentage of host earnings)
/// 3. Renter refund (unused escrow)
pub fn settle_depin_job(
    ctx: Context<SettleDepinJob>,
    id: String,
    host_earned: u64,
    platform_fee_bps: u16,
) -> Result<()> {
    let admin = &ctx.accounts.admin;
    require!(admin.key() == ADMIN_PUBKEY, DepinErrors::UnauthorizedAdmin);
    require!(platform_fee_bps <= 10000, Errors::InvalidAmount);

    let escrow_session = &mut ctx.accounts.escrow_session;
    let rental_session = &mut ctx.accounts.rental_session;
    let host_machine = &mut ctx.accounts.host_machine;
    let escrow_vault = &ctx.accounts.escrow_vault;

    require!(escrow_session.is_active, Errors::EscrowNotActive);
    require!(rental_session.is_active, Errors::NotActive);
    require!(escrow_session.id == id, Errors::EscrowNotFound);

    let escrow_balance = escrow_vault.lamports();
    let rent_exempt = Rent::get()?.minimum_balance(0);
    let available = escrow_balance.saturating_sub(rent_exempt);

    // Cap host_earned to available funds
    let capped_earned = host_earned.min(available);

    // Calculate platform fee from host earnings
    let platform_fee = capped_earned
        .checked_mul(platform_fee_bps as u64)
        .ok_or(Errors::ArithmeticOverflow)?
        / 10000;
    let host_payout = capped_earned
        .checked_sub(platform_fee)
        .ok_or(Errors::ArithmeticOverflow)?;
    let renter_refund = available
        .checked_sub(capped_earned)
        .ok_or(Errors::ArithmeticOverflow)?;

    // Derive escrow vault signer seeds
    let user_key = ctx.accounts.renter.key();
    let admin_key = admin.key();
    let (_, escrow_vault_bump) = Pubkey::find_program_address(
        &[
            b"escrow_vault",
            user_key.as_ref(),
            admin_key.as_ref(),
            id.as_bytes(),
        ],
        ctx.program_id,
    );
    let signer_seeds: &[&[&[u8]]] = &[&[
        b"escrow_vault",
        user_key.as_ref(),
        admin_key.as_ref(),
        id.as_bytes(),
        &[escrow_vault_bump],
    ]];

    // 1. Pay host
    if host_payout > 0 {
        system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: escrow_vault.to_account_info(),
                    to: ctx.accounts.host.to_account_info(),
                },
                signer_seeds,
            ),
            host_payout,
        )?;
    }

    // 2. Pay platform
    if platform_fee > 0 {
        system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: escrow_vault.to_account_info(),
                    to: ctx.accounts.platform_vault.to_account_info(),
                },
                signer_seeds,
            ),
            platform_fee,
        )?;
    }

    // 3. Refund renter
    if renter_refund > 0 {
        system_program::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: escrow_vault.to_account_info(),
                    to: ctx.accounts.renter.to_account_info(),
                },
                signer_seeds,
            ),
            renter_refund,
        )?;
    }

    // Update host machine earnings
    host_machine.earned = host_machine
        .earned
        .checked_add(host_payout)
        .ok_or(Errors::ArithmeticOverflow)?;

    // Close escrow & rental sessions
    escrow_session.is_active = false;
    escrow_session.amount = 0;
    rental_session.is_active = false;
    rental_session.end_time = Clock::get()?.unix_timestamp;

    msg!(
        "DePIN job settled: host={}, platform={}, refund={}",
        host_payout,
        platform_fee,
        renter_refund
    );
    Ok(())
}

#[derive(Accounts)]
#[instruction(id: String)]
pub struct SettleDepinJob<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    /// CHECK: The renter who deposited the escrow
    #[account(mut)]
    pub renter: UncheckedAccount<'info>,

    /// CHECK: The host who served the job
    #[account(mut)]
    pub host: UncheckedAccount<'info>,

    /// CHECK: Platform vault to receive fees
    #[account(mut)]
    pub platform_vault: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"rental_session", renter.key().as_ref(), id.as_bytes()],
        bump,
    )]
    pub rental_session: Account<'info, RentalSession>,

    #[account(
        mut,
        seeds = [b"escrow_session", renter.key().as_ref(), id.as_bytes()],
        bump,
    )]
    pub escrow_session: Account<'info, EscrowSession>,

    /// CHECK: PDA escrow vault holding the SOL
    #[account(
        mut,
        seeds = [b"escrow_vault", renter.key().as_ref(), admin.key().as_ref(), id.as_bytes()],
        bump,
    )]
    pub escrow_vault: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"host_machine", host.key().as_ref(), id.as_bytes()],
        bump,
    )]
    pub host_machine: Account<'info, HostMachineRegistration>,

    pub system_program: Program<'info, System>,
}
