import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Contract } from "../target/types/contract";
import assert from "assert";

describe("DePIN Settlement Tests", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const renter = anchor.web3.Keypair.generate();
  const host = anchor.web3.Keypair.generate();
  const platformFeeWallet = anchor.web3.Keypair.generate();

  // Admin keypair matching ADMIN_PUBKEY: FQTWAmb67h8Rc1pPUgHNGqRKGVz5KoFGhb9aULJJn5qg
  const admin = anchor.web3.Keypair.fromSecretKey(new Uint8Array([45,176,75,158,179,168,216,1,249,139,248,103,223,99,184,249,87,37,166,53,178,217,131,109,98,166,147,95,184,192,52,28,214,5,241,72,29,151,110,62,135,118,56,140,77,91,60,245,29,120,125,201,217,74,54,60,85,155,21,98,224,146,225,143]));

  const program = anchor.workspace.contract as Program<Contract>;
  const id = "settle-001";
  const secretKey = "axion_vault";

  let vaultAccount: anchor.web3.PublicKey;
  let hostMachine: anchor.web3.PublicKey;
  let escrowVault: anchor.web3.PublicKey;
  let rentalSession: anchor.web3.PublicKey;
  let escrowSession: anchor.web3.PublicKey;

  before(async () => {
    console.log("Admin pubkey:", admin.publicKey.toBase58());

    // Airdrop to all parties
    for (const kp of [admin, renter, host]) {
      const sig = await anchor.getProvider().connection.requestAirdrop(
        kp.publicKey, 5 * anchor.web3.LAMPORTS_PER_SOL
      );
      await anchor.getProvider().connection.confirmTransaction(sig);
    }

    // Derive PDAs
    [vaultAccount] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault_account"), admin.publicKey.toBuffer(), Buffer.from(secretKey)],
      program.programId
    );
    [hostMachine] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("host_machine"), host.publicKey.toBuffer(), Buffer.from(id)],
      program.programId
    );
    [escrowVault] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow_vault"), renter.publicKey.toBuffer(), admin.publicKey.toBuffer(), Buffer.from(id)],
      program.programId
    );
    [rentalSession] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("rental_session"), renter.publicKey.toBuffer(), Buffer.from(id)],
      program.programId
    );
    [escrowSession] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow_session"), renter.publicKey.toBuffer(), Buffer.from(id)],
      program.programId
    );
  });

  it("initializes vault with axion_vault seed", async () => {
    const tx = await program.methods
      .initializeVault(secretKey)
      .accounts({ admin: admin.publicKey })
      .signers([admin])
      .rpc();
    console.log("Vault initialized:", tx);
  });

  it("funds vault (for claim_rewards test later)", async () => {
    const tx = await program.methods
      .fundVault(new anchor.BN(2 * anchor.web3.LAMPORTS_PER_SOL), secretKey)
      .accounts({ admin: admin.publicKey })
      .signers([admin])
      .rpc();
    console.log("Vault funded:", tx);
  });

  it("initializes host machine PDA", async () => {
    const tx = await program.methods
      .initialiseHostRegistration(
        id, "test-host", "laptop", "linux",
        new anchor.BN(500), new anchor.BN(100000000) // 0.1 SOL/hour
      )
      .accounts({ admin: admin.publicKey, userKey: host.publicKey })
      .signers([admin])
      .rpc();
    console.log("Host machine initialized:", tx);

    const account = await program.account.hostMachineRegistration.fetch(hostMachine);
    assert.ok(account.hostKey.equals(host.publicKey));
    assert.strictEqual(account.isActive, false);
    assert.strictEqual(account.earned.toNumber(), 0);
  });

  it("renter starts rental with escrow (1 SOL)", async () => {
    const tx = await program.methods
      .startRentalWithEscrow(
        new anchor.BN(1 * anchor.web3.LAMPORTS_PER_SOL),
        id
      )
      .accounts({
        payer: renter.publicKey,
        admin: admin.publicKey,
      })
      .signers([renter])
      .rpc();
    console.log("Escrow rental started:", tx);

    const rental = await program.account.rentalSession.fetch(rentalSession);
    assert.ok(rental.isActive);

    const escrow = await program.account.escrowSession.fetch(escrowSession);
    assert.ok(escrow.isActive);
  });

  it("settles DePIN job — 3-way split (host 90%, platform 10%, renter refund)", async () => {
    const hostBalanceBefore = await anchor.getProvider().connection.getBalance(host.publicKey);
    const renterBalanceBefore = await anchor.getProvider().connection.getBalance(renter.publicKey);
    const platformBalanceBefore = await anchor.getProvider().connection.getBalance(platformFeeWallet.publicKey);

    // Host earned 0.6 SOL of uptime, platform takes 10% (1000 bps)
    const hostEarned = new anchor.BN(600_000_000); // 0.6 SOL
    const platformFeeBps = 1000; // 10%

    const tx = await program.methods
      .settleDepinJob(id, hostEarned, platformFeeBps)
      .accounts({
        admin: admin.publicKey,
        renter: renter.publicKey,
        host: host.publicKey,
        platformVault: platformFeeWallet.publicKey,
        hostMachine: hostMachine,
      })
      .signers([admin])
      .rpc();
    console.log("Settlement tx:", tx);

    const hostBalanceAfter = await anchor.getProvider().connection.getBalance(host.publicKey);
    const renterBalanceAfter = await anchor.getProvider().connection.getBalance(renter.publicKey);
    const platformBalanceAfter = await anchor.getProvider().connection.getBalance(platformFeeWallet.publicKey);

    const hostGain = hostBalanceAfter - hostBalanceBefore;
    const platformGain = platformBalanceAfter - platformBalanceBefore;
    const renterGain = renterBalanceAfter - renterBalanceBefore;

    // host gets 600_000_000 * 9000 / 10000 = 540_000_000
    const expectedHostPayout = 540_000_000;
    // platform gets 600_000_000 * 1000 / 10000 = 60_000_000
    const expectedPlatformFee = 60_000_000;

    console.log(`Host payout: ${hostGain} lamports (expected: ${expectedHostPayout})`);
    console.log(`Platform fee: ${platformGain} lamports (expected: ${expectedPlatformFee})`);
    console.log(`Renter refund: ${renterGain} lamports`);

    assert.strictEqual(hostGain, expectedHostPayout);
    assert.strictEqual(platformGain, expectedPlatformFee);
    // Renter gets back ~0.4 SOL (1 SOL - 0.6 SOL used)
    assert.ok(renterGain >= 390_000_000);

    // Sessions closed
    const rental = await program.account.rentalSession.fetch(rentalSession);
    assert.strictEqual(rental.isActive, false);
    const escrow = await program.account.escrowSession.fetch(escrowSession);
    assert.strictEqual(escrow.isActive, false);

    // Host machine earned updated
    const hostMachineAccount = await program.account.hostMachineRegistration.fetch(hostMachine);
    assert.strictEqual(hostMachineAccount.earned.toNumber(), expectedHostPayout);
  });

  it("claim_rewards works without secret_key", async () => {
    const hostMachineBefore = await program.account.hostMachineRegistration.fetch(hostMachine);
    const earnedBefore = hostMachineBefore.earned.toNumber();
    const hostBalanceBefore = await anchor.getProvider().connection.getBalance(host.publicKey);

    const tx = await program.methods
      .claimRewards(id)
      .accounts({ host: host.publicKey, admin: admin.publicKey })
      .signers([host])
      .rpc();
    console.log("Claim rewards tx:", tx);

    const hostMachineAfter = await program.account.hostMachineRegistration.fetch(hostMachine);
    assert.strictEqual(hostMachineAfter.earned.toNumber(), 0);

    const hostBalanceAfter = await anchor.getProvider().connection.getBalance(host.publicKey);
    // Should gain earned amount minus tx fee
    assert.ok(hostBalanceAfter - hostBalanceBefore > earnedBefore - 10000);
    console.log(`Claimed ${earnedBefore} lamports successfully`);
  });
});
