import * as anchor from "@project-serum/anchor";
import { AccountInfo, Context, Keypair, PublicKey } from "@solana/web3.js";
import { VrfAccount } from "@switchboard-xyz/switchboard-v2";
import { VrfState } from "../types";
import {
  anchorBNtoDateTimeString,
  loadSwitchboardProgram,
  loadVrfExampleProgram,
  waitForever,
} from "../utils";

type AccountType = "VrfAccountData" | "VrfState";

const DEFAULT_KEYPAIR = Keypair.fromSeed(new Uint8Array(32).fill(1));

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function watchAccount(argv: any): Promise<void> {
  const { pubkey } = argv;
  const publicKey = new PublicKey(pubkey);
  let program: anchor.Program;
  let accountType: AccountType;
  try {
    program = await loadSwitchboardProgram(DEFAULT_KEYPAIR);
    const vrfAccount = new VrfAccount({ program, publicKey });
    await vrfAccount.loadData();
    accountType = "VrfAccountData";
  } catch {
    try {
      program = loadVrfExampleProgram(DEFAULT_KEYPAIR);
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
          counter: vrfAccount.counter.toString(),
          producer: vrfAccount.builders[0].producer.toString() ?? "",
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
