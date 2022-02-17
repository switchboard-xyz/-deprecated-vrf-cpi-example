import * as anchor from "@project-serum/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import {
  Callback,
  OracleQueueAccount,
  PermissionAccount,
  SwitchboardPermission,
  VrfAccount,
} from "@switchboard-xyz/switchboard-v2";
import chalk from "chalk";
import fs from "node:fs";
import path from "node:path";
import { VrfState } from "../types";
import {
  buffer2string,
  loadKeypair,
  loadSwitchboardProgram,
  loadVrfExampleProgram,
  toAccountString,
  toPermissionString,
} from "../utils";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function createVrfAccount(argv: any): Promise<void> {
  const { payer, cluster, rpcUrl, queueKey, keypair, maxResult } = argv;
  const max = new anchor.BN(maxResult);
  const payerKeypair = loadKeypair(payer);
  const program = await loadSwitchboardProgram(payerKeypair, cluster, rpcUrl);

  const vrfSecret = keypair
    ? loadKeypair(keypair)
    : anchor.web3.Keypair.generate();

  // create state account but dont send instruction
  // need public key for VRF CPI
  const vrfExampleProgram = await loadVrfExampleProgram(
    payerKeypair,
    cluster,
    rpcUrl
  );
  const [stateAccount, stateBump] = VrfState.fromSeed(
    vrfExampleProgram,
    vrfSecret.publicKey,
    payerKeypair.publicKey
  );
  try {
    await stateAccount.loadData();
  } catch {}

  console.log(chalk.yellow("######## CREATE VRF ACCOUNT ########"));

  const queue = new OracleQueueAccount({
    program,
    publicKey: new PublicKey(queueKey),
  });

  const ixCoder = new anchor.InstructionCoder(vrfExampleProgram.idl);

  const callback: Callback = {
    programId: vrfExampleProgram.programId,
    accounts: [
      { pubkey: stateAccount.publicKey, isSigner: false, isWritable: true },
      { pubkey: vrfSecret.publicKey, isSigner: false, isWritable: false },
    ],
    ixData: ixCoder.encode("updateResult", ""),
  };

  console.log(
    toAccountString(
      "Callback",
      JSON.stringify(
        callback,
        (key, value) => {
          if (value instanceof PublicKey) {
            return value.toString();
          }
          if (key === "ixData" || value instanceof Buffer) {
            return buffer2string(value);
          }
          return value;
        },
        2
      )
    )
  );

  const vrfAccount = await VrfAccount.create(program, {
    queue,
    callback,
    authority: payerKeypair.publicKey,
    keypair: vrfSecret,
  });
  console.log(toAccountString(`VRF Account`, vrfAccount.publicKey));

  const permissionAccount = await PermissionAccount.create(program, {
    authority: (await queue.loadData()).authority,
    granter: queue.publicKey,
    grantee: vrfAccount.publicKey,
  });
  console.log(toAccountString(`VRF Permission`, permissionAccount.publicKey));

  await permissionAccount.set({
    authority: payerKeypair,
    permission: SwitchboardPermission.PERMIT_VRF_REQUESTS,
    enable: true,
  });
  console.log(toAccountString(`     Permissions`, "PERMIT_VRF_REQUESTS"));

  console.log(chalk.yellow("######## INIT PROGRAM STATE ########"));

  await vrfExampleProgram.rpc.initState(
    {
      stateBump,
      maxResult: max,
    },
    {
      accounts: {
        state: stateAccount.publicKey,
        vrfAccount: vrfAccount.publicKey,
        payer: payerKeypair.publicKey,
        authority: payerKeypair.publicKey,
        systemProgram: SystemProgram.programId,
      },
      signers: [payerKeypair],
    }
  );
  console.log(toAccountString("Program State", stateAccount.publicKey));
  const state = await stateAccount.loadData();
  const permission = await permissionAccount.loadData();

  console.log(
    `${chalk.blue(
      "Run the following command to watch the Switchboard VrfAccount:"
    )}\n\t${chalk.white(
      "ts-node src watch",
      vrfAccount.publicKey.toString(),
      "--rpcUrl",
      rpcUrl,
      "--cluster",
      cluster
    )}`
  );
  console.log(
    `${chalk.blue(
      "Run the following command to watch the example program:"
    )}\n\t${chalk.white(
      "ts-node src watch",
      stateAccount.publicKey.toString(),
      "--rpcUrl",
      rpcUrl,
      "--cluster",
      cluster
    )}`
  );
  console.log(
    `${chalk.blue(
      "Run the following command to request a new ranomness value:"
    )}\n\t${chalk.white(
      "ts-node src request",
      vrfAccount.publicKey.toString(),
      "--payer",
      payer,
      "--rpcUrl",
      rpcUrl,
      "--cluster",
      cluster
    )}`
  );

  if (!keypair) {
    fs.writeFileSync(
      path.join(
        process.cwd(),
        `./secrets/vrf_account_${vrfSecret.publicKey}-keypair.json`
      ),
      `[${vrfSecret.secretKey}]`
    );
  }

  const outFile = path.join(
    process.cwd(),
    `state_${stateAccount.publicKey}.json`
  );
  fs.writeFileSync(
    outFile,
    JSON.stringify(
      {
        programState: stateAccount.publicKey.toString(),
        maxResult: state.maxResult.toString(),
        vrfAccount: {
          publicKey: vrfAccount.publicKey.toString(),
          authority: state.authority.toString(),
          permissionPubkey: permissionAccount.publicKey.toString(),
          permissions: toPermissionString(permission.permissions),
        },
      },
      undefined,
      2
    )
  );
}
