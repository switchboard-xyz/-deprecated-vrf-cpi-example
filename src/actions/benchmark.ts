import * as anchor from "@project-serum/anchor";
import { AccountInfo, Context, PublicKey } from "@solana/web3.js";
import {
  ProgramStateAccount,
  VrfAccount,
} from "@switchboard-xyz/switchboard-v2";
import chalk from "chalk";
import {
  CHECK_ICON,
  loadKeypair,
  loadSwitchboardProgram,
  waitForever,
} from "../utils";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function BenchmarkRpc(argv: any): Promise<void> {
  const { payer, cluster, rpcUrl, vrfKey } = argv;
  const payerKeypair = loadKeypair(payer);
  const program: anchor.Program = await loadSwitchboardProgram(
    payerKeypair,
    cluster,
    rpcUrl
  );

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

  vrfAccount.requestRandomness({
    authority: payerKeypair,
    payer: payerTokenAccount.address,
    payerAuthority: payerKeypair,
  });

  console.log(chalk.green(`${CHECK_ICON}Randomness requested successfully`));

  console.log(chalk.yellow("######## AWAITING RANDOMNESS ########"));

  let start = Date.now();
  const startCounter: anchor.BN = vrf.counter;
  const endCounter: anchor.BN = startCounter.add(new anchor.BN(1));
  const coder = new anchor.BorshAccountsCoder(program.idl);

  program.provider.connection.onAccountChange(
    vrfAccount.publicKey,
    (accountInfo: AccountInfo<Buffer>, context: Context) => {
      const decodedVrf = coder.decode("VrfAccountData", accountInfo.data);
      const result: number[] = decodedVrf.currentRound.result;
      const txRemaining = decodedVrf.builders[0].txRemaining;
      if (txRemaining === 277) {
        start = Date.now();
      }
      if (
        endCounter.eq(decodedVrf.counter) &&
        !result.every((item) => item === 0)
      ) {
        const end = Date.now();
        const elapsed = (end - start) / 1000;
        // const data = {
        //   counter: decodedVrf.counter.toString(),
        //   producer: decodedVrf.builders[0].producer.toString() ?? "",
        //   result: decodedVrf.currentRound.result
        //     ? `[${(decodedVrf.currentRound.result as number[]).join(",")}]`
        //     : "",
        // };
        // console.log(JSON.stringify(data, undefined, 2));
        console.log(`${chalk.green("Duration: ")}${elapsed} seconds`);
        // eslint-disable-next-line unicorn/no-process-exit
        process.exit(0);
      }
    }
  );

  await waitForever();
}
