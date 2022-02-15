use crate::*;
use anchor_lang::prelude::*;
pub use switchboard_v2::VrfAccountData;

#[derive(Accounts)]
#[instruction(params: InitStateParams)]
pub struct InitState<'info> {
    #[account(
        init,
        seeds = [
            STATE_SEED, 
            vrf_account.key().as_ref(), 
            authority.key().as_ref()
        ],
        payer = payer
    )]
    pub state: AccountLoader<'info, VrfState>,
    pub vrf_account: AccountInfo<'info>,
    #[account(mut, signer)]
    pub payer: AccountInfo<'info>,
    pub authority: AccountInfo<'info>,
    #[account(address = solana_program::system_program::ID)]
    pub system_program: AccountInfo<'info>,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct InitStateParams {
    pub state_bump: u8,
    pub max_result: u64,
}

impl InitState<'_> {
    pub fn validate(&self, ctx: &Context<Self>, params: &InitStateParams) -> ProgramResult {
        msg!("Validate init");
        if params.max_result > MAX_RESULT {
            return Err(ErrorCode::MaxResultExceedsMaximum.into());
        }

        msg!("Checking VRF Account");
        let vrf_account_info = &ctx.accounts.vrf_account;
        let _vrf = VrfAccountData::new(vrf_account_info)
            .map_err(|_| ProgramError::from(ErrorCode::InvalidSwitchboardVrfAccount))?;

        Ok(())
    }

    pub fn actuate(ctx: &Context<Self>, params: &InitStateParams) -> ProgramResult {
        msg!("Actuate init");
        let state = &mut ctx.accounts.state.load_init()?;
        msg!("Setting max result");
        if params.max_result == 0 {
            state.max_result = MAX_RESULT;
        } else {
            state.max_result = params.max_result;
        }

        msg!("Setting VRF Account");
        state.vrf_account = ctx.accounts.vrf_account.key.clone();
        state.authority = ctx.accounts.authority.key.clone();

        Ok(())
    }
}
