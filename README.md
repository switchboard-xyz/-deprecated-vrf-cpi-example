# Switchboard V2 VRF Example

An example repo demonstrating the usage of the Switchboard V2 VRF invoking an example program when a new randomness request is fulfilled.

See [docs.switchboard.xyz/randomness](https://docs.switchboard.xyz/randomness) for a full explanation of the Switchboard VRF.

## Dependencies

You will need the following installed

- [Node and NPM](https://github.com/nvm-sh/nvm#installing-and-updating)
- [Docker Compose](https://docs.docker.com/compose/install)
- [Rust](https://www.rust-lang.org/tools/install)
- [Solana](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor](https://project-serum.github.io/anchor/getting-started/installation.html#install-anchor)

## Install

```bash
git clone https://github.com/switchboard-xyz/vrf-cpi-example.git
cd vrf-cpi-example
npm install
anchor build
```

Then run `solana-keygen pubkey target/deploy/anchor_vrf_example-keypair.json` to get your program ID (PID). Be sure to update the declare_id macro in `programs/anchor-example/src/lib.rs`.

Then deploy anchor-example to devnet:

```bash
anchor deploy
```

## Commands

- [Setup Oracle Network](#Setup-Oracle-Network)
- [Create Accounts](#Create-Accounts)
- [Request Randomness](#Request-Randomness)
- [Manually Update State](#Manually-Update-State)
- [Read State](#Read-State)
- [Watch Account](#Watch-Account)

**NOTE:** Each randomness request costs 0.1 wSOL. The following commands assume you use the same keypair, containing an active devnet Solana balance to pay for new accounts,

```bash
solana-keygen new --no-bip39-passphrase --outfile secrets/payer-keypair.json
solana airdrop 1 secrets/payer-keypair.json
solana airdrop 1 secrets/payer-keypair.json
solana airdrop 1 secrets/payer-keypair.json
solana airdrop 1 secrets/payer-keypair.json
```

and an associated token wallet with wrapped SOL.

```bash
spl-token wrap 1 secrets/payer-keypair.json
```

### Setup Oracle Network

Create an oracle queue and oracle with sufficient permissions, to run a node locally.

```
USAGE
  $ ts-node src setup --payer [PAYERKEYPAIR]

ARGUMENTS

OPTIONS
  --payer       filesystem path of keypair file that will pay for, and be authority for, any new accounts

EXAMPLE
  $ ts-node src setup --payer secrets/payer-keypair.json
```

[src/actions/setup.ts](./src/actions/setup.ts)

This will output a docker-compose command to start an oracle and listen for VRF randomness requests.

### Create Accounts

Initialize an example program, which will be invoked each time the newly created Switchboard VRF Account receives a new value

```
USAGE
  $ ts-node src create [QUEUEKEY] --payer [PAYERKEYPAIR]

ARGUMENTS
  QUEUEKEY      public key of the Switchboard Oracle Queue fulfilling a randomness request

OPTIONS
  --payer       filesystem path of keypair file that will pay for, and be authority for, any new accounts

  --maxResult   the maximum result stored by the example program state (max: u64::max = 18446744073709551615)

EXAMPLE
  $ ts-node src request EY5zeq17vsMo8Zg1odbEqG6x4j4nrQo5jQ5b7twB2YoH --payer secrets/payer-keypair.json
```

[src/actions/create.ts](./src/actions/create.ts)

### Request Randomness

Request randomness for a given VRF Account. Assumes payer keypair has 0.1 wSOL to reward oracles.

```
USAGE
  $ ts-node src request [VRFPUBKEY] --payer [PAYERKEYPAIR]

ARGUMENTS
  VRFPUBKEY     publicKey of the Switchboard VRF Account to request a new randomness value for

OPTIONS
  --payer       filesystem path of keypair file that will pay for, and be authority for, any new accounts

EXAMPLE
  $ ts-node src request EY5zeq17vsMo8Zg1odbEqG6x4j4nrQo5jQ5b7twB2YoH --payer secrets/payer-keypair.json
```

[src/actions/request.ts](./src/actions/request.ts)

### Manually Update State

Manually update the example program state by reading its assigned vrfAccount.

```
USAGE
  $ ts-node src update [STATEKEY] --payer [PAYERKEYPAIR]

ARGUMENTS
  STATEKEY      publicKey of the program state holding the vrf account

OPTIONS
  --payer       filesystem path of keypair file that will pay for, and be authority for, any new accounts

EXAMPLE
  $ ts-node src update 7bbCPkxQScvnrw31xh4nASjvAsw6WdVc1LpNrRnpmFZW --payer secrets/payer-keypair.json
```

[src/actions/update.ts](./src/actions/update.ts)

### Read State

Immutably read the example program state and check the expected result

```
USAGE
  $ ts-node src read [STATEKEY] --payer [PAYERKEYPAIR]

ARGUMENTS
  STATEKEY      publicKey of the program state holding the vrf account

OPTIONS
  --payer       filesystem path of keypair file that will pay for, and be authority for, any new accounts

EXAMPLE
  $ ts-node src read 7bbCPkxQScvnrw31xh4nASjvAsw6WdVc1LpNrRnpmFZW --payer secrets/payer-keypair.json
```

[src/actions/read.ts](./src/actions/read.ts)

### Watch Account

Watch a Switchboard VRF Account or the example program's state for any changes

```
USAGE
  $ ts-node src watch [PUBKEY]

ARGUMENTS
  STATEKEY      publicKey of a Switchboard VRF Account or the example program's state

OPTIONS


EXAMPLE
  $ ts-node src watch 7bbCPkxQScvnrw31xh4nASjvAsw6WdVc1LpNrRnpmFZW
```

[src/actions/watch.ts](./src/actions/watch.ts)

## Getting Help

- [Documentation](https://docs.switchboard.xyz/randomness)
- [Discord](https://discord.gg/HCzKP4cHDT)
- [Telegram](https://t.me/switchboardxyz)
- [Twitter](https://twitter.com/switchboardxyz)
