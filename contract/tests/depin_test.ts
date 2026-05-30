import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Contract } from "../target/types/contract";
import assert from "assert";

describe("contract", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());
  const user = anchor.web3.Keypair.generate();
  const adminSecret = new Uint8Array([45,176,75,158,179,168,216,1,249,139,248,103,223,99,184,249,87,37,166,53,178,217,131,109,98,166,147,95,184,192,52,28,214,5,241,72,29,151,110,62,135,118,56,140,77,91,60,245,29,120,125,201,217,74,54,60,85,155,21,98,224,146,225,143]);
  const admin = anchor.web3.Keypair.fromSecretKey(adminSecret);
  let vaultAccount: anchor.web3.PublicKey;
  let hostMachine: anchor.web3.PublicKey;
  const id = "1001";
  const secretKey = "axion_vault"; 

  const program = anchor.workspace.contract as Program<Contract>;

  before(async () => {
    const airdropSignature = await anchor.getProvider().connection.requestAirdrop(
      user.publicKey,
      3 * anchor.web3.LAMPORTS_PER_SOL
    );
    const airdropSignatureAdmin = await anchor.getProvider().connection.requestAirdrop(
      admin.publicKey,
      3 * anchor.web3.LAMPORTS_PER_SOL
    );
    await anchor.getProvider().connection.confirmTransaction(airdropSignatureAdmin);
    console.log("Airdropped 3 SOL to admin account:", admin.publicKey.toBase58());
    await anchor.getProvider().connection.confirmTransaction(airdropSignature);
    console.log("Airdropped 3 SOL to user account:", user.publicKey.toBase58());

    [vaultAccount] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault_account"), admin.publicKey.toBuffer(), Buffer.from(secretKey)],
      program.programId
    );
    console.log("Vault account address:", vaultAccount.toBase58());

    [hostMachine] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("host_machine"), user.publicKey.toBuffer(), Buffer.from(id)],
      program.programId
    );
    console.log("Host machine address:", hostMachine.toBase58());
  });

  it("initalise vault account", async () => {
    // Add your test here.
    const tx = await program.methods.initializeVault(secretKey).accounts({
      admin: admin.publicKey,
    })
    .signers([admin])
    .rpc();
    console.log("Your transaction signature", tx);
  });

  it("funds vault account", async () => {
    // Add your test here.
    const tx = await program.methods.fundVault(new anchor.BN(1000000000), secretKey).accounts({
      admin: admin.publicKey,
    })
      .signers([admin])
      .rpc();
    console.log("Your transaction signature", tx);
    const vaultAccountBalance = await anchor.getProvider().connection.getBalance(vaultAccount);
    assert.ok(vaultAccountBalance > 1, "Vault account should have a balance");
  });

  it("starts a new rental session with escrow", async () => {
    const [escrowVault, escrowBump] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow_vault"), user.publicKey.toBuffer(), admin.publicKey.toBuffer() ,Buffer.from(id)],
      program.programId
    );
    const tx = await program.methods.startRentalWithEscrow(
      new anchor.BN(1 * anchor.web3.LAMPORTS_PER_SOL),
      id,
    )
    .accounts({
      payer: user.publicKey,
      admin: admin.publicKey,
      // @ts-ignore
      escrowVault: escrowVault,
    })
    .signers([user])
    .rpc();
    const rentalSessionPda = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("rental_session"), user.publicKey.toBuffer(), Buffer.from(id)],
      program.programId
    );
    const rentalSession = await program.account.rentalSession.fetch(rentalSessionPda[0]);
    assert.ok(rentalSession.isActive, "Rental session should be active after starting with escrow");
  });

  it("top up escrow session", async () => {
    const escrowSessionPda = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow_session"), user.publicKey.toBuffer(), Buffer.from(id)],
      program.programId
    );

    const tx = await program.methods.topUpEscrow(id, new anchor.BN(0.5 * anchor.web3.LAMPORTS_PER_SOL))
      .accounts({
        user: user.publicKey,
        admin: admin.publicKey,
      })
      .signers([user])
      .rpc();

    const escrowSession = await program.account.escrowSession.fetch(escrowSessionPda[0]);
    assert.ok(escrowSession.amount.toNumber() > 0, "Escrow session should have a positive amount after top-up");
  });

  it ("initialise host machine", async () => {
    const tx = await program.methods.initialiseHostRegistration(id, "host_name", "e2-medium", "linux", new anchor.BN(100), new anchor.BN(1))
    .accounts({
        admin: admin.publicKey,
        userKey: user.publicKey,
    })
    .signers([admin])
    .rpc();
    const hostMachineAccount = await program.account.hostMachineRegistration.fetch(hostMachine);
    assert.ok(hostMachineAccount.isActive === false, "Host machine should be inactive after initialization");
    console.log("Your transaction signature", tx);
  });

  it("activate host machine", async () => {
    const tx = await program.methods.activateHost(id)
    .accounts({
        host: user.publicKey,
        user: admin.publicKey,
    })
    .signers([admin])
    .rpc();
    console.log("Your transaction signature", tx);
    const hostMachineAccount = await program.account.hostMachineRegistration.fetch(hostMachine);
    assert.ok(hostMachineAccount.isActive === true, "Host machine should be active after activation");
    assert.ok(hostMachineAccount.hostKey.equals(user.publicKey), "Host key should match user public key");
    assert.ok(hostMachineAccount.id === id, "Host machine ID should match the provided ID");
  });

  it("deactivate host machine", async () => {
    const tx = await program.methods.deactivateHost(id)
      .accounts({
        host: user.publicKey,
        user: admin.publicKey,
      })
      .signers([admin])
      .rpc();
    console.log("Your transaction signature", tx);
    const hostMachineAccount = await program.account.hostMachineRegistration.fetch(hostMachine);
    assert.ok(hostMachineAccount.isActive === false, "Host machine should be inactive after deactivation");
  });

  it("claims rewarded SOL", async () => {
    const tx = await program.methods.claimRewards(id)
      .accounts({
        host: user.publicKey,
        admin: admin.publicKey,
      })
      .signers([user])
      .rpc();
    console.log("Your transaction signature", tx);
    const hostMachineAccount = await program.account.hostMachineRegistration.fetch(hostMachine);
    assert.ok(hostMachineAccount.earned.toNumber() === 0, "Host machine should have earned rewards");
  });

  it("punish host machine", async () => {
    const tx = await program.methods.penalizeHost(id)
      .accounts({
        admin: admin.publicKey,
        user: user.publicKey,
      })
      .signers([admin])
      .rpc();
    console.log("Your transaction signature", tx);
    const hostMachineAccount = await program.account.hostMachineRegistration.fetch(hostMachine);
    assert.ok(hostMachineAccount.penalized === true, "Host machine should be penalized");
    assert.ok(hostMachineAccount.isActive === false, "Host machine should be inactive after penalization");
  });
});
