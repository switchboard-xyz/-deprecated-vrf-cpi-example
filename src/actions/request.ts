import * as anchor from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import {
  ProgramStateAccount,
  VrfAccount,
} from "@switchboard-xyz/switchboard-v2";
import chalk from "chalk";
import { CHECK_ICON, loadKeypair, loadSwitchboardProgram } from "../utils";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function requestRandomness(argv: any): Promise<void> {
  const { payer, vrfKey } = argv;
  const payerKeypair = loadKeypair(payer);
  const program: anchor.Program = await loadSwitchboardProgram(payerKeypair);

  const [programStateAccount] = ProgramStateAccount.fromSeed(program);
  const switchTokenMint = await programStateAccount.getTokenMint();
  const payerTokenAccount =
    await switchTokenMint.getOrCreateAssociatedAccountInfo(
      payerKeypair.publicKey
    );
  const balance = await program.provider.connection.getTokenAccountBalance(
    payerTokenAccount.address
  );
  if (!balance.value.uiAmount || balance.value.uiAmount < 0.1) {
    throw new Error(
      `associated token account must have a balance greater than 0.1\nbalance ${balance.value.uiAmount}\ntokenAccount ${payerTokenAccount.address}\nmint ${switchTokenMint.publicKey}`
    );
  }

  const vrfAccount = new VrfAccount({
    program,
    publicKey: new PublicKey(vrfKey),
  });
  const vrf = await vrfAccount.loadData();

  console.log(chalk.yellow("######## REQUESTING RANDOMNESS ########"));

  await vrfAccount.requestRandomness({
    authority: payerKeypair,
    payer: payerTokenAccount.address,
    payerAuthority: payerKeypair,
  });

  console.log(chalk.green(`${CHECK_ICON}Randomness requested successfully`));
}
