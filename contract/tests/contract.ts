import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Contract } from "../target/types/contract";
import assert from "assert";

describe("contract", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const user = anchor.web3.Keypair.generate();
  const adminSecret = new Uint8Array([45,176,75,158,179,168,216,1,249,139,248,103,223,99,184,249,87,37,166,53,178,217,131,109,98,166,147,95,184,192,52,28,214,5,241,72,29,151,110,62,135,118,56,140,77,91,60,245,29,120,125,201,217,74,54,60,85,155,21,98,224,146,225,143]);
  const admin = anchor.web3.Keypair.fromSecretKey(adminSecret);
  let vaultAccount: anchor.web3.PublicKey;
  const vaultId = "1001";
  const escrowId = "2001";
  const forceTerminateId = "3001";
  const secretKey = "my_secret_key";

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
  });

  it("initalise vault account", async () => {
    const tx = await program.methods.initializeVault(secretKey).accounts({
      admin: admin.publicKey,
    })
    .signers([admin])
    .rpc();
    console.log("Your transaction signature", tx);
  });

  it("funds vault account", async () => {
    const tx = await program.methods.fundVault(new anchor.BN(1000000000), secretKey).accounts({
      admin: admin.publicKey,
    })
      .signers([admin])
      .rpc();
    console.log("Your transaction signature", tx);
    const vaultAccountBalance = await anchor.getProvider().connection.getBalance(vaultAccount);
    assert.ok(vaultAccountBalance > 1, "Vault account should have a balance");
  });

  it("transfer to vault account and starts rental session", async () => {
    const [rentalSessionPda] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("rental_session"), user.publicKey.toBuffer(), Buffer.from(vaultId)],
      program.programId
    );

    const tx = await program.methods.transferToVaultAndRent(
        new anchor.BN(1000000000),
        new anchor.BN(10),
        vaultId,
        secretKey
    )
    .accounts({
        admin: admin.publicKey,
        payer: user.publicKey,
    })
    .signers([user])
    .rpc();

    console.log("Transaction successful:", tx);
    const rental_session = await program.account.rentalSession.fetch(rentalSessionPda)
    assert.ok(rental_session.isActive, "Rental session should be active after transfer");
  });

  it("transfers funds from vault account to user account", async () => {
    const tx = await program.methods.transferFromVault(new anchor.BN(0.5 * anchor.web3.LAMPORTS_PER_SOL), vaultId, secretKey)
      .accounts({
        admin: admin.publicKey,
        payer: user.publicKey,
      })
      .signers([user])
      .rpc();
    console.log("Your transaction signature", tx);
    const vaultAccountBalance = await anchor.getProvider().connection.getBalance(vaultAccount);
    console.log("Vault account balance after transfer:", vaultAccountBalance);
    assert.ok(vaultAccountBalance < 2000000000, "Vault account should have a balance after transfer");
  });

  it("withdraws funds from vault account", async () => {
    const tx = await program.methods.withdrawFunds(new anchor.BN(0.5 * anchor.web3.LAMPORTS_PER_SOL), secretKey)
      .accounts({
        admin: admin.publicKey,
      })
      .signers([admin])
      .rpc();
    console.log("Your transaction signature", tx);
    const vaultAccountBalance = await anchor.getProvider().connection.getBalance(vaultAccount);
    console.log("Vault account balance after withdrawal:", vaultAccountBalance);
    assert.ok(vaultAccountBalance >= 1000000000, "Vault account should have at least the remaining SOL after withdrawal");
  });

  it("starts a new rental session with escrow", async () => {
    const [escrowVault] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow_vault"), user.publicKey.toBuffer(), admin.publicKey.toBuffer(), Buffer.from(escrowId)],
      program.programId
    );
    const tx = await program.methods.startRentalWithEscrow(
      new anchor.BN(1 * anchor.web3.LAMPORTS_PER_SOL),
      escrowId,
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
      [Buffer.from("rental_session"), user.publicKey.toBuffer(), Buffer.from(escrowId)],
      program.programId
    );
    const rentalSession = await program.account.rentalSession.fetch(rentalSessionPda[0]);
    assert.ok(rentalSession.isActive, "Rental session should be active after starting with escrow");
  });

  it("top up escrow session", async () => {
    const escrowSessionPda = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow_session"), user.publicKey.toBuffer(), Buffer.from(escrowId)],
      program.programId
    );

    const tx = await program.methods.topUpEscrow(escrowId, new anchor.BN(0.5 * anchor.web3.LAMPORTS_PER_SOL))
      .accounts({
        user: user.publicKey,
        admin: admin.publicKey,
      })
      .signers([user])
      .rpc();

    const escrowSession = await program.account.escrowSession.fetch(escrowSessionPda[0]);
    assert.ok(escrowSession.amount.toNumber() > 0, "Escrow session should have a positive amount after top-up");
  });

  it("finalizes rental escrow", async () => {
    const escrowSessionPda = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow_session"), user.publicKey.toBuffer(), Buffer.from(escrowId)],
      program.programId
    );

    const escrowVault = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow_vault"), user.publicKey.toBuffer(), admin.publicKey.toBuffer(), Buffer.from(escrowId)],
      program.programId
    );

    const escrow_vault = await anchor.getProvider().connection.getBalance(escrowVault[0]);
    console.log("Escrow account balance before finalization:", escrow_vault / anchor.web3.LAMPORTS_PER_SOL);

    const tx = await program.methods.finaliseRentalWithEscrow(escrowId, new anchor.BN(0.25 * anchor.web3.LAMPORTS_PER_SOL), secretKey)
      .accounts({
        user: user.publicKey,
        admin: admin.publicKey,
      })
      .signers([user])
      .rpc();

    const escrowSession = await program.account.escrowSession.fetch(escrowSessionPda[0]);
    const vaultAccountBalance = await anchor.getProvider().connection.getBalance(vaultAccount);
    console.log("Vault account balance after finalization:", vaultAccountBalance / anchor.web3.LAMPORTS_PER_SOL);
    const escrowVaultBalance = await anchor.getProvider().connection.getBalance(escrowVault[0]);
    console.log("Escrow vault balance after finalization:", escrowVaultBalance / anchor.web3.LAMPORTS_PER_SOL);
    assert.ok(vaultAccountBalance > 2, "Vault account should have a balance after finalization");
    assert.ok(!escrowSession.isActive, "Escrow session should be inactive after finalization");
  });

  it("starts rental session with escrow for force terminate", async () => {
    const [escrowVault] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow_vault"), user.publicKey.toBuffer(), admin.publicKey.toBuffer(), Buffer.from(forceTerminateId)],
      program.programId
    );
    const tx = await program.methods.startRentalWithEscrow(
      new anchor.BN(1 * anchor.web3.LAMPORTS_PER_SOL),
      forceTerminateId,
    )
    .accounts({
      payer: user.publicKey,
      admin: admin.publicKey,
      // @ts-ignore
      escrowVault: escrowVault,
    })
    .signers([user])
    .rpc();
    console.log("Your transaction signature", tx);
  });

  it("force terminates rental session", async () => {
    const [escrowSessionPda] = await anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("escrow_session"), user.publicKey.toBuffer(), Buffer.from(forceTerminateId)],
      program.programId
    );

    const tx = await program.methods.forceTerminateRental(forceTerminateId, secretKey)
      .accounts({
        admin: admin.publicKey,
        user: user.publicKey,
      })
      .signers([admin])
      .rpc();

    console.log("Force terminate transaction signature", tx);

    const escrowSession = await program.account.escrowSession.fetch(escrowSessionPda);
    assert.ok(!escrowSession.isActive, "Escrow session should be inactive after force termination");
  });
});
