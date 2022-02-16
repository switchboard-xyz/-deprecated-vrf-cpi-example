use crate::*;
use anchor_lang::prelude::*;
use solana_program::instruction::{AccountMeta, Instruction};
use solana_program::program::invoke;
pub use switchboard_v2::VrfAccountData;

#[derive(Accounts)]
#[instruction(params: RequestResultParams)] // rpc parameters hint
pub struct RequestResult<'info> {
    pub switchboard_program: AccountInfo<'info>,
    #[account(signer)]
    pub authority: AccountInfo<'info>,
    #[account(mut)]
    pub vrf: AccountInfo<'info>,
    #[account(mut)]
    pub oracle_queue: AccountInfo<'info>,
    pub queue_authority: AccountInfo<'info>,
    pub data_buffer: AccountInfo<'info>,
    #[account(mut)]
    pub permission: AccountInfo<'info>,
    #[account(mut)]
    pub escrow: AccountInfo<'info>,
    #[account(mut)]
    pub payer_wallet: AccountInfo<'info>,
    #[account(signer)]
    pub payer_authority: AccountInfo<'info>,
    #[account(address = solana_program::sysvar::recent_blockhashes::ID)]
    pub recent_blockhashes: AccountInfo<'info>,
    pub program_state: AccountInfo<'info>,
    #[account(address = anchor_spl::token::ID)]
    pub token_program: AccountInfo<'info>,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct RequestResultParams {
    pub permission_bump: u8,
    pub state_bump: u8,
}

impl RequestResult<'_> {
    pub fn validate(&self, _ctx: &Context<Self>, _params: &RequestResultParams) -> ProgramResult {
        Ok(())
    }

    pub fn actuate(ctx: &Context<Self>, params: &RequestResultParams) -> ProgramResult {
        let switchboard_program = ctx.accounts.switchboard_program.key.clone();
        msg!("switchboard program {:?}", switchboard_program);

        // let accounts = ctx.remaining_accounts.to_vec();
        let accounts = [
            ctx.accounts.authority.to_account_info().clone(),
            ctx.accounts.vrf.to_account_info().clone(),
            ctx.accounts.oracle_queue.to_account_info().clone(),
            ctx.accounts.queue_authority.to_account_info().clone(),
            ctx.accounts.data_buffer.to_account_info().clone(),
            ctx.accounts.permission.to_account_info().clone(),
            ctx.accounts.escrow.to_account_info().clone(),
            ctx.accounts.payer_wallet.to_account_info().clone(),
            ctx.accounts.payer_authority.to_account_info().clone(),
            ctx.accounts.recent_blockhashes.to_account_info().clone(),
            ctx.accounts.program_state.to_account_info().clone(),
            ctx.accounts.token_program.to_account_info().clone(),
        ];
        // .retain(|&account| account.key != switchboard_program);
        msg!("accounts len {:?}", accounts.len());

        let account_metas: Vec<AccountMeta> = accounts
            .iter()
            .map(|account_info| AccountMeta {
                pubkey: account_info.key.clone(),
                is_signer: account_info.is_signer,
                is_writable: account_info.is_writable,
            })
            .collect();
        msg!("account_metas len {:?}", account_metas.len());

        let discriminator: [u8; 8] = [230, 121, 14, 164, 28, 222, 117, 118];
        let mut data = discriminator.try_to_vec()?;
        msg!("discriminator {:?}", discriminator);

        let mut param_vec: Vec<u8> = params.try_to_vec()?;
        data.append(&mut param_vec);
        msg!("ixData {:?}", data);

        let instruction = Instruction::new_with_bytes(switchboard_program, &data, account_metas);
        invoke(&instruction, &accounts[..])?;

        Ok(())
    }
}
