import { PublicKey } from "@solana/web3.js";
import { OracleAccount, VrfAccount } from "@switchboard-xyz/switchboard-v2";
import { loadKeypair, loadSwitchboardProgram } from "../utils";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function testCallback(argv: any): Promise<void> {
  const { payer, cluster, rpcUrl, vrfKey, oracleKey } = argv;
  const payerKeypair = loadKeypair(payer);
  const program = await loadSwitchboardProgram(payerKeypair, cluster, rpcUrl);

  const oracleAccount = new OracleAccount({
    program,
    publicKey: new PublicKey(oracleKey),
  });

  const vrfAccount = new VrfAccount({
    program,
    publicKey: new PublicKey(vrfKey),
  });
  const vrf = await vrfAccount.loadData();
  // console.log(JSON.stringify(vrf.callback.accounts, undefined, 2));

  // const sig = await vrfAccount.verify(oracleAccount, false, 1);

  // // console.log(`https://explorer.solana.com/tx/${signature}?cluster=devnet`);
  // // const confirmedTxn = await program.provider.connection.getTransaction(
  // //   signature
  // // );
  // console.log(JSON.stringify(sig, undefined, 2));
}
