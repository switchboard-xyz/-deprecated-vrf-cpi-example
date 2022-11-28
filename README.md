:bangbang: | A simplified example can be found in the Switchboard V2 monorepo. [https://github.com/switchboard-xyz/switchboard-v2/tree/main/programs/anchor-vrf-parser](https://github.com/switchboard-xyz/switchboard-v2/tree/main/programs/anchor-vrf-parser)
:---: | :---




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
```

## Usage

### Deploy Example Program

```bash
anchor build
solana-keygen pubkey target/deploy/anchor_vrf_example-keypair.json
```

This is the program ID (PID) of the example program. Navigate to `programs/anchor-example/src/lib.rs` and update the declare_id macro with your example program ID.

Next, rebuild the program with the updated ID and deploy the example program to devnet. This will be used as the callback function when a new randomness value is requested.

```bash
anchor build
anchor deploy
anchor idl init -f target/idl/anchor_vrf_example.json [PUBKEY]
```

### Setup Local Switchboard Queue

First we'll create an oracle queue with a single oracle to fulfill randomness requests.

```bash
ts-node src setup --payer secrets/payer-keypair.json
```

This will output a docker command to run in a separate shell in order to start the oracle locally. It is **highly** reccomended to use a non rate limited rpcUrl to process the proof verification.

Next we'll create our VRF Account to hold the randomness result that has a callback to the clientProgram's `UpdateResult` instruction, which will parse the result buffer and set the state to a value of [0 to `maxResult`). Make sure to subsitute [QUEUEKEY] for your newly created queue from the previous command.

```bash
ts-node src create [QUEUEKEY] --payer secrets/payer-keypair.json --maxResult 123456789
```

**NOTE:** This will output 3 commands to watch the VRF Account and request a new randomness value. Run each in a separate shell to monitor the on-chain changes of your account in real time.

### Use Switchboard Devnet Queue

You may wish to use Switchboard's permissionless devnet queue to avoid needing to install docker. Substitute `F8ce7MsckeZAbAGmxjJNetxYXQa9mKr9nnrC3qKubyYy` for [QUEUEKEY].

```bash
ts-node src create [QUEUEKEY] --payer secrets/payer-keypair.json --maxResult 123456789
```

**NOTE:** This will output 3 commands to watch the VRF Account and request a new randomness value. Run each in a separate shell to monitor the on-chain changes of your account in real time.

### Request Randomness

You must have 0.1 wrapped SOL in the keypair used in the previous steps. Run the following command to airdrop 1 SOL and wrap it:

```bash
solana airdrop 1 secrets/payer-keypair.json
spl-token wrap 1 secrets/payer-keypair.json
```

Then request a new randomness value from the assigned oracle queue, transferring 0.1 wSOL to an escrow wallet that will reward the oracle fulfilling the update request.

```bash
ts-node src request [VRFPUBKEY] --payer secrets/payer-keypair.json
```

## Commands

- [Setup Oracle Network](#Setup-Oracle-Network)
- [Create Accounts](#Create-Accounts)
- [Request Randomness](#Request-Randomness)
- [Manually Verify](#Manually-Verify)
- [Manually Update State](#Manually-Update-State)
- [Watch Account](#Watch-Account)
- [Benchmark](#Benchmark)

**NOTE:** Each randomness request costs 0.002 wSOL. The following commands assume you use the same keypair, containing an active devnet Solana balance to pay for new accounts,

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
  --cluster     Solana cluster to interact with. Defaults to devnet
  --rpcUrl      custom RPC endpoint for faster response times. Defaults to clusters default endpoint.

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
  --cluster     Solana cluster to interact with. Defaults to devnet
  --rpcUrl      custom RPC endpoint for faster response times. Defaults to clusters default endpoint.
  --maxResult   the maximum result stored by the example program state (max: u64::max = 18446744073709551615)

EXAMPLE
  $ ts-node src create EY5zeq17vsMo8Zg1odbEqG6x4j4nrQo5jQ5b7twB2YoH --payer secrets/payer-keypair.json
  $ ts-node src create EY5zeq17vsMo8Zg1odbEqG6x4j4nrQo5jQ5b7twB2YoH --maxResult 123456789
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
  --cluster     Solana cluster to interact with. Defaults to devnet
  --rpcUrl      custom RPC endpoint for faster response times. Defaults to clusters default endpoint.

EXAMPLE
  $ ts-node src request EY5zeq17vsMo8Zg1odbEqG6x4j4nrQo5jQ5b7twB2YoH --payer secrets/payer-keypair.json

USAGE NOTE
  If the network is under high load, the oracle crank turning transactions may fail to submit, in which case you can manually turn the crank by calling verify yourself with the following verify command. Also see the documentation:
https://switchboard-xyz.github.io/switchboardv2-api/classes/vrfaccount.html#verify
```

[src/actions/request.ts](./src/actions/request.ts)

### Manually Verify

Submit remianing on-chain verify transactions if txRemaing is greater than 1.

```
USAGE
  $ ts-node src verify [VRFKEY] --payer [PAYERKEYPAIR]

ARGUMENTS
  VRFKEY      publicKey of the program state holding the vrf account

OPTIONS
  --payer       filesystem path of keypair file that will pay for, and be authority for, any new accounts
  --cluster     Solana cluster to interact with. Defaults to devnet
  --rpcUrl      custom RPC endpoint for faster response times. Defaults to clusters default endpoint.

EXAMPLE
  $ ts-node src verify EY5zeq17vsMo8Zg1odbEqG6x4j4nrQo5jQ5b7twB2YoH --payer secrets/payer-keypair.json


```

[src/actions/update.ts](./src/actions/update.ts)

### Manually Update State

Manually update the example program state by reading its assigned vrfAccount.

```
USAGE
  $ ts-node src update [STATEKEY] --payer [PAYERKEYPAIR]

ARGUMENTS
  STATEKEY      publicKey of the vrf client program's state

OPTIONS
  --payer       filesystem path of keypair file that will pay for, and be authority for, any new accounts
  --cluster     Solana cluster to interact with. Defaults to devnet
  --rpcUrl      custom RPC endpoint for faster response times. Defaults to clusters default endpoint.

EXAMPLE
  $ ts-node src update 7bbCPkxQScvnrw31xh4nASjvAsw6WdVc1LpNrRnpmFZW --payer secrets/payer-keypair.json
```

[src/actions/update.ts](./src/actions/update.ts)

### Watch Account

Watch a Switchboard VRF Account or the example program's state for any changes

```
USAGE
  $ ts-node src watch [PUBKEY]

ARGUMENTS
  STATEKEY      publicKey of a Switchboard VRF Account or the example program's state

OPTIONS
  --cluster     Solana cluster to interact with. Defaults to devnet
  --rpcUrl      custom RPC endpoint for faster response times. Defaults to clusters default endpoint.

EXAMPLE
  $ ts-node src watch 7bbCPkxQScvnrw31xh4nASjvAsw6WdVc1LpNrRnpmFZW
```

[src/actions/watch.ts](./src/actions/watch.ts)

### Benchmark

Measure the latency between a VRF request and the value being accepted on-chain

```
USAGE
  $ ts-node src benchmark [VRFPUBKEY] --payer [PAYERKEYPAIR]

ARGUMENTS
  VRFPUBKEY     publicKey of the Switchboard VRF Account to request a new randomness value for

OPTIONS
  --payer       filesystem path of keypair file that will pay for, and be authority for, any new accounts
  --cluster     Solana cluster to interact with. Defaults to devnet
  --rpcUrl      custom RPC endpoint for faster response times. Defaults to clusters default endpoint.

EXAMPLE
  $ ts-node src benchmark EY5zeq17vsMo8Zg1odbEqG6x4j4nrQo5jQ5b7twB2YoH  --payer secrets/payer-keypair.json
```

[src/actions/benchmark.ts](./src/actions/benchmark.ts)

## Getting Help

- [Documentation](https://docs.switchboard.xyz/randomness)
- [Discord](https://discord.gg/HCzKP4cHDT)
- [Telegram](https://t.me/switchboardxyz)
- [Twitter](https://twitter.com/switchboardxyz)
