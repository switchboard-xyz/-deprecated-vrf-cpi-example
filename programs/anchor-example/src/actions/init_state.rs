use crate::*;
use anchor_lang::prelude::*;
pub use switchboard_v2::VrfAccountData;
use std::mem;

#[derive(Accounts)]
#[instruction(params: InitStateParams)]
pub struct InitState<'info> {
    #[account(
        init,
        seeds = [
            STATE_SEED, 
            vrf.key().as_ref(),
            authority.key().as_ref(),
        ],
        payer = payer,
        space = 8 + mem::size_of::<VrfClient>(),
        bump,
    )]
    pub state: AccountLoader<'info, VrfClient>,
    /// CHECK:
    pub authority: AccountInfo<'info>,
    /// CHECK:
    #[account(mut, signer)]
    pub payer: AccountInfo<'info>,
    /// CHECK:
    pub vrf: AccountInfo<'info>,
    #[account(address = solana_program::system_program::ID)]
    pub system_program: Program<'info, System>,
}

#[derive(Clone, AnchorSerialize, AnchorDeserialize)]
pub struct InitStateParams {
    pub max_result: u64,
}

impl InitState<'_> {
    pub fn validate(&self, ctx: &Context<Self>, params: &InitStateParams) -> Result<()> {
        msg!("Validate init");
        if params.max_result > MAX_RESULT {
            return Err(error!(VrfErrorCode::MaxResultExceedsMaximum));
        }

        msg!("Checking VRF Account");
        let vrf_account_info = &ctx.accounts.vrf;
        let _vrf = VrfAccountData::new(vrf_account_info)
            .map_err(|_| VrfErrorCode::InvalidSwitchboardVrfAccount)?;

        Ok(())
    }

    pub fn actuate(ctx: &Context<Self>, params: &InitStateParams) -> Result<()> {
        msg!("Actuate init");
        let mut state = ctx.accounts.state.load_init()?;
        // *state = VrfClient::default();
        
        msg!("Setting VrfClient state");
        if params.max_result == 0 {
            *state = VrfClient {
                bump: ctx.bumps.get("state").unwrap().clone(),
                last_timestamp: 0,
                result: 0,
                result_buffer: [0u8; 32],
                max_result: MAX_RESULT,
                authority: ctx.accounts.authority.key.clone(),
                vrf: ctx.accounts.vrf.key.clone()
                
            };
        } else {
            *state = VrfClient {
                bump: ctx.bumps.get("state").unwrap().clone(),
                last_timestamp: 0,
                result: 0,
                result_buffer: [0u8; 32],
                max_result: params.max_result,
                authority: ctx.accounts.authority.key.clone(),
                vrf: ctx.accounts.vrf.key.clone()
            };
        }

        Ok(())
    }
}
