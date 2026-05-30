use anchor_lang::prelude::*;
use crate::{constants::ADMIN_PUBKEY, errors::{DepinErrors, Errors}, state::HostMachineRegistration};

pub fn deactivate_host(
    ctx: Context<DeactivateHost>,
    id: String,
) -> Result<()> {
    let host = &ctx.accounts.host;
    let host_machine = &mut ctx.accounts.host_machine;
    let user = &ctx.accounts.user;

    require!(
        user.key() == host.key() || user.key() == ADMIN_PUBKEY,
        DepinErrors::UnauthorizedAdmin
    );

    require!(
        host.key() == host_machine.host_key,
        DepinErrors::HostKeyMismatch
    );
    require!(
        host_machine.is_active == true,
        DepinErrors::HostMachineRegistrationNotActive
    );
    require!(
        host_machine.id == id,
        DepinErrors::InvalidHostMachineRegistrationId
    );
    require!(
        host_machine.started_at > 0,
        DepinErrors::HostMachineRegistrationNotActiveLongEnough
    );
    host_machine.is_active = false;
    let timestamp = Clock::get()?.unix_timestamp;
    require!(
        timestamp - host_machine.started_at >= 0,
        DepinErrors::HostMachineRegistrationNotActiveLongEnough
    );
    let time = (timestamp - host_machine.started_at) as u64;
    let reward = time
        .checked_mul(host_machine.sol_per_hour)
        .ok_or(Errors::ArithmeticOverflow)?
        / 3600;
    host_machine.earned = host_machine.earned.checked_add(reward)
        .ok_or(Errors::ArithmeticOverflow)?;
    host_machine.started_at = 0; 
    msg!("Host machine {} deactivated. Earned: {}", id, host_machine.earned);
    Ok(())
}

#[derive(Accounts)]
#[instruction(id: String)]
pub struct DeactivateHost<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    ///CHECK: This account must be the host's key
    pub host: UncheckedAccount<'info>,
    
    #[account(
        mut,
        seeds = [b"host_machine", host.key().as_ref(), id.as_bytes()],
        bump
    )]
    pub host_machine: Account<'info, HostMachineRegistration>,
    pub system_program: Program<'info, System>
}