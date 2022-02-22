import * as anchor from "@project-serum/anchor";
import { AccountInfo, Context, PublicKey } from "@solana/web3.js";
import { VrfAccount } from "@switchboard-xyz/switchboard-v2";
import { DEFAULT_KEYPAIR } from "../const";
import { VrfState } from "../types";
import {
  anchorBNtoDateTimeString,
  loadSwitchboardProgram,
  loadVrfExampleProgram,
  toVrfStatus,
  waitForever,
} from "../utils";

type AccountType = "VrfAccountData" | "VrfState";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function watchAccount(argv: any): Promise<void> {
  const { cluster, rpcUrl, pubkey } = argv;
  const publicKey = new PublicKey(pubkey);
  let program: anchor.Program;
  let accountType: AccountType;
  try {
    program = await loadSwitchboardProgram(DEFAULT_KEYPAIR, cluster, rpcUrl);
    const vrfAccount = new VrfAccount({ program, publicKey });
    await vrfAccount.loadData();
    accountType = "VrfAccountData";
  } catch {
    try {
      program = await loadVrfExampleProgram(DEFAULT_KEYPAIR, cluster, rpcUrl);
      const account = new VrfState(program, publicKey);
      await account.loadData();
      accountType = "VrfState";
    } catch {
      throw new Error(
        `pubkey is not a Switchboard or VrfExampleProgram account`
      );
    }
  }
  if (!program) {
    throw new Error(`pubkey is not a Switchboard or VrfExampleProgram account`);
  }
  const coder = new anchor.AccountsCoder(program.idl);

  program.provider.connection.onAccountChange(
    publicKey,
    (accountInfo: AccountInfo<Buffer>, context: Context) => {
      if (accountType === "VrfAccountData") {
        const vrfAccount = coder.decode(accountType, accountInfo.data);
        const data = {
          status: toVrfStatus(vrfAccount.status),
          counter: vrfAccount.counter.toString(),
          producer: vrfAccount.builders[0].producer.toString() ?? "",
          txRemaining: vrfAccount.builders[0].txRemaining,
          result: vrfAccount.currentRound.result
            ? `[${(vrfAccount.currentRound.result as number[]).join(",")}]`
            : "",
        };
        console.log(JSON.stringify(data, undefined, 2));
      } else if (accountType === "VrfState") {
        const state = coder.decode(accountType, accountInfo.data);
        const data = {
          result: state.result.toString(),
          lastTimestamp: anchorBNtoDateTimeString(state.lastTimestamp),
        };
        console.log(JSON.stringify(data, undefined, 2));
      }
    }
  );

  await waitForever();
  console.log("exiting");
}
