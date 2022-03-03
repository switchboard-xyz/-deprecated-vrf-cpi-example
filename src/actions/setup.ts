import * as anchor from "@project-serum/anchor";
import {
  OracleAccount,
  OracleQueueAccount,
  PermissionAccount,
  ProgramStateAccount,
  SwitchboardPermission,
} from "@switchboard-xyz/switchboard-v2";
import chalk from "chalk";
import fs from "fs";
import path from "path";
import {
  loadKeypair,
  loadSwitchboardProgram,
  toAccountString,
  toPermissionString,
} from "../utils";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export async function setupOracleQueue(argv: any): Promise<void> {
  const { payer, cluster, rpcUrl } = argv;
  const payerKeypair = loadKeypair(payer);
  const program: anchor.Program = await loadSwitchboardProgram(
    payerKeypair,
    cluster,
    rpcUrl
  );

  console.log(chalk.yellow("######## Switchboard Setup ########"));

  // Program State Account and token mint for payout rewards
  const [programStateAccount] = ProgramStateAccount.fromSeed(program);
  const switchTokenMint = await programStateAccount.getTokenMint();
  const tokenAccount = await switchTokenMint.createAccount(
    payerKeypair.publicKey
  );

  // Oracle Queue
  const queueAccount = await OracleQueueAccount.create(program, {
    name: Buffer.from("Queue-1"),
    slashingEnabled: false,
    reward: new anchor.BN(0), // no token account needed
    minStake: new anchor.BN(0),
    authority: payerKeypair.publicKey,
    // Change to true to skip oraclePermission.set step
    unpermissionedVrf: false,
    queueSize: 50,
  });
  console.log(toAccountString("Oracle Queue", queueAccount.publicKey));

  // Oracle
  const oracleAccount = await OracleAccount.create(program, {
    name: Buffer.from("Oracle"),
    queueAccount,
  });
  console.log(toAccountString("Oracle", oracleAccount.publicKey));
  const oraclePermission = await PermissionAccount.create(program, {
    authority: payerKeypair.publicKey,
    granter: queueAccount.publicKey,
    grantee: oracleAccount.publicKey,
  });
  await oraclePermission.set({
    authority: payerKeypair,
    permission: SwitchboardPermission.PERMIT_ORACLE_HEARTBEAT,
    enable: true,
  });
  console.log(toAccountString(`  Permission`, oraclePermission.publicKey));
  await oracleAccount.heartbeat();

  console.log(chalk.green("\u2714 Switchboard setup complete"));

  // Run the oracle
  console.log(
    `${chalk.blue(
      "Run the following command to start the oracle:"
    )}\n\tORACLE_KEY="${
      oracleAccount.publicKey
    }" PAYER_KEYPAIR="${payer}" RPC_URL=${rpcUrl} CLUSTER=${cluster} docker-compose up`
  );

  const permission = await oraclePermission.loadData();

  const outFile = path.join(
    process.cwd(),
    `queue_${queueAccount.publicKey}.json`
  );
  fs.writeFileSync(
    outFile,
    JSON.stringify(
      {
        queue: queueAccount.publicKey.toString(),
        queueAuthority: payerKeypair.publicKey.toString(),
        oracle: {
          publicKey: oracleAccount.publicKey.toString(),
          oracleAuthority: payerKeypair.publicKey.toString(),
          permissionPubkey: oraclePermission.publicKey.toString(),
          permissions: toPermissionString(permission.permissions),
        },
      },
      undefined,
      2
    )
  );

  console.log(
    `${chalk.blue(
      "Run the following command to create a new VRF Account:"
    )}\n\t${chalk.white(
      "ts-node src create",
      queueAccount.publicKey.toString(),
      "--payer",
      payer,
      "--rpcUrl",
      rpcUrl,
      "--cluster",
      cluster
    )}`
  );
}
