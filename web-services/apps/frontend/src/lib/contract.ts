import {
  clusterApiUrl,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import { AnchorProvider, Program, type Idl } from "@coral-xyz/anchor";
import idl from "../../idl/contract.json";
import { type AnchorWallet } from "@solana/wallet-adapter-react";
import { BN } from "bn.js";
import { getAdminPublicKey, SECRET_KEY } from "@/config";

export function getContract(wallet: AnchorWallet): Program {
  if (!wallet) throw new Error("Wallet not connected");
  const connection = new Connection(clusterApiUrl("devnet"));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const provider = new AnchorProvider(connection, wallet as any, {});
  return new Program(idl as Idl, provider);
}

async function sendAndConfirm(program: Program, tx: Promise<string>) {
  const signature = await tx;
  const conf = await program.provider.connection.confirmTransaction(signature);
  if (conf.value.err) {
    console.error("Transaction failed", conf.value.err);
    return null;
  }
  return { success: true as const, signature, message: "" as string };
}

export const InitiatesVaultAccount = async (
  wallet: AnchorWallet,
  secretKey: string,
) => {
  try {
    const program = getContract(wallet);
    const result = await sendAndConfirm(
      program,
      program.methods
        .initializeVault(secretKey)
        .accounts({ admin: wallet.publicKey })
        .rpc(),
    );
    if (!result) return null;
    return { ...result, message: "Vault account initialized successfully" };
  } catch (error) {
    console.error("Error initializing vault account", error);
    return null;
  }
};

export const FundVaultAccount = async (
  wallet: AnchorWallet,
  amount: number,
  secretKey: string,
) => {
  try {
    const program = getContract(wallet);
    const [vaultAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vault_account"),
        wallet.publicKey.toBuffer(),
        Buffer.from(secretKey),
      ],
      program.programId,
    );
    const result = await sendAndConfirm(
      program,
      program.methods
        .fundVault(new BN(amount * LAMPORTS_PER_SOL), secretKey)
        .accounts({ admin: wallet.publicKey })
        .rpc(),
    );
    if (!result) return null;
    const balance = await program.provider.connection.getBalance(vaultAccount);
    return {
      ...result,
      message: "Vault account funded successfully",
      balance: balance / LAMPORTS_PER_SOL,
    };
  } catch (error) {
    console.error("Error funding vault account", error);
    return null;
  }
};

export const transferFromVault = async (
  amount: number,
  id: string,
  wallet: AnchorWallet,
) => {
  try {
    const program = getContract(wallet);
    const result = await sendAndConfirm(
      program,
      program.methods
        .transferFromVault(new BN(amount * LAMPORTS_PER_SOL), id, SECRET_KEY)
        .accounts({ admin: getAdminPublicKey(), payer: wallet.publicKey })
        .rpc(),
    );
    if (!result) return null;
    return {
      ...result,
      message: "Funds transferred from vault account successfully",
    };
  } catch (error) {
    console.error("Error transferring funds from vault account", error);
    return null;
  }
};

export const EndRentalSession = async (id: string, wallet: AnchorWallet) => {
  try {
    const program = getContract(wallet);
    const [rentalSessionPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("rental_session"),
        wallet.publicKey.toBuffer(),
        Buffer.from(id),
      ],
      program.programId,
    );
    const result = await sendAndConfirm(
      program,
      program.methods
        .endRentalSession(id, wallet.publicKey)
        .accounts({ payer: wallet.publicKey, rentalSession: rentalSessionPDA })
        .rpc(),
    );
    if (!result) return null;
    return { ...result, message: "Rental session ended successfully" };
  } catch (error) {
    console.error("Error ending rental session", error);
    return null;
  }
};

export const TransferToVaultAndStartRental = async (
  amount: number,
  duration: number,
  id: string,
  wallet: AnchorWallet,
) => {
  try {
    const program = getContract(wallet);
    const [rentalSessionPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("rental_session"),
        wallet.publicKey.toBuffer(),
        Buffer.from(id),
      ],
      program.programId,
    );
    const result = await sendAndConfirm(
      program,
      program.methods
        .transferToVaultAndRent(
          new BN(amount * LAMPORTS_PER_SOL),
          new BN(duration * 60),
          id,
          SECRET_KEY,
        )
        .accounts({ admin: getAdminPublicKey(), payer: wallet.publicKey })
        .rpc(),
    );
    if (!result) return null;
    return {
      ...result,
      message:
        "Funds transferred to vault and rental session started successfully",
      rentalSessionPda,
    };
  } catch (error) {
    console.error("Error transferring to vault and starting rental", error);
    return null;
  }
};

export const WithdrawFromVault = async (
  amount: number,
  wallet: AnchorWallet,
  secretKey: string,
) => {
  try {
    const program = getContract(wallet);
    const result = await sendAndConfirm(
      program,
      program.methods
        .withdrawFunds(new BN(amount * LAMPORTS_PER_SOL), secretKey)
        .accounts({ admin: wallet.publicKey })
        .rpc(),
    );
    if (!result) return null;
    return {
      ...result,
      message: "Funds withdrawn from vault account successfully",
    };
  } catch (error) {
    console.error("Error withdrawing from vault account", error);
    return null;
  }
};

export const GetVaultBalance = async (
  wallet: AnchorWallet,
  secretKey: string,
) => {
  try {
    const program = getContract(wallet);
    const [vaultAccount] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("vault_account"),
        wallet.publicKey.toBuffer(),
        Buffer.from(secretKey),
      ],
      program.programId,
    );
    const balance = await program.provider.connection.getBalance(vaultAccount);
    return {
      success: true as const,
      balance: balance / LAMPORTS_PER_SOL,
      message: "Vault balance retrieved successfully",
    };
  } catch (error) {
    console.error("Error fetching vault balance", error);
    return null;
  }
};
