import * as anchor from "@project-serum/anchor";
import { Keypair } from "@solana/web3.js";
import {
  AggregatorAccount,
  SwitchboardTestContext,
} from "@switchboard-xyz/switchboard-v2";
import chai from "chai";
import "mocha";
import { AnchorVrfExample } from "../target/types/anchor_vrf_example";

const expect = chai.expect;

describe("lottery init-round test", async () => {
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace
    .SwitchboardVrfLottery as anchor.Program<AnchorVrfExample>;

  const payer = Keypair.fromSecretKey(
    (program.provider.wallet as anchor.Wallet).payer.secretKey
  );

  let switchboard: SwitchboardTestContext;
  let oracle: AggregatorAccount;

  before(async () => {
    switchboard = await SwitchboardTestContext.loadFromEnv(
      program.provider,
      "./switchboard.env"
    );
  });

  it("Creates a lottery", async () => {});
});
