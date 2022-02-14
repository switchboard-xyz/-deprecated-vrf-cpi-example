use solana_program::pubkey::Pubkey;
pub use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
};
pub use switchboard_v2::VrfAccountData;

entrypoint!(process_instruction);

fn process_instruction<'a>(
    _program_id: &'a Pubkey,
    accounts: &'a [AccountInfo],
    _instruction_data: &'a [u8],
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let vrf_account_info = next_account_info(accounts_iter)?;

    let vrf = VrfAccountData::new(vrf_account_info)?;
    let result_buffer = vrf.get_result()?;
    if result_buffer == [0u8; 32] {
        msg!("vrf buffer empty");
        return Ok(());
    }

    let value: &[u128] = bytemuck::cast_slice(&result_buffer[..]);
    let result = value[0] % 256000 as u128;

    msg!("Current vrf result is {}!", result);
    Ok(())
}
