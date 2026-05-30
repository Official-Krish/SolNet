use anchor_lang::prelude::*;
use crate::{errors::{DepinErrors, Errors}, state::{HostMachineRegistration, VaultAccount}};

pub fn claim_rewards(
    ctx: Context<ClaimRewards>,
    id: String,
) -> Result<()> {
    let host_machine = &mut ctx.accounts.host_machine;
    let vault_account = &mut ctx.accounts.vault_account;
    let host = &ctx.accounts.host;

    require!(
        host_machine.penalized == false,
        DepinErrors::HostMachinePenalized
    );
    require!(
        host_machine.is_active == false,
        DepinErrors::HostMachineShouldNotBeActiveForClaiming
    );
    require!(
        host_machine.id == id,
        DepinErrors::InvalidHostMachineRegistrationId
    );
    require!(
        host_machine.host_key == host.key(),
        DepinErrors::HostKeyMismatch
    );

    require!(
        vault_account.owner == ctx.accounts.admin.key(),
        Errors::Unauthorized
    );

    require!(
        vault_account.to_account_info().lamports() >= host_machine.earned,
        Errors::InsufficientFunds
    );
    let earned = host_machine.earned;
    **vault_account.to_account_info().try_borrow_mut_lamports()? = vault_account.to_account_info().lamports().checked_sub(earned)
        .ok_or(Errors::ArithmeticOverflow)?;
    **host.to_account_info().try_borrow_mut_lamports()? = host.to_account_info().lamports().checked_add(earned)
        .ok_or(Errors::ArithmeticOverflow)?;
    host_machine.earned = 0;

    msg!("Claimed {} rewards for host {}", earned, host.key());
    Ok(())
}

#[derive(Accounts)]
#[instruction(id: String)]
pub struct ClaimRewards<'info> {
    #[account(mut)]
    pub host: Signer<'info>,
    #[account(
        mut,
        seeds = [b"host_machine", host.key().as_ref(), id.as_bytes()],
        bump
    )]
    pub host_machine: Account<'info, HostMachineRegistration>,

    /// CHECK: Admin must be the owner of the vault account
    pub admin: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"vault_account", admin.key().as_ref(), b"axion_vault"],
        bump = vault_account.bump,
        constraint = vault_account.owner == admin.key() @ Errors::Unauthorized,
    )]
    pub vault_account: Account<'info, VaultAccount>,
    pub system_program: Program<'info, System>,
}