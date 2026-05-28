import { type AnchorWallet } from "@solana/wallet-adapter-react";
import { BN } from "bn.js";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAdminPublicKey, SECRET_KEY } from "@/config";
import { Contarct } from "./contract";

export const StartRentalSessionWithEscrow = async (
  wallet: AnchorWallet,
  amount: number,
  id: string,
) => {
  const program = Contarct(wallet);
  try {
    const tx = await program.methods
      .startRentalWithEscrow(new BN(amount * LAMPORTS_PER_SOL), id)
      .accounts({ payer: wallet.publicKey, admin: getAdminPublicKey() })
      .rpc();
    const conf = await program.provider.connection.confirmTransaction(tx);
    if (conf.value.err) return null;
    return {
      success: true,
      signature: tx,
      message: "Rental session started successfully with escrow",
    };
  } catch (e) {
    console.error("Error starting rental session with escrow", e);
    return null;
  }
};

export const TopUpEscrowSession = async (
  wallet: AnchorWallet,
  id: string,
  amount: number,
) => {
  const program = Contarct(wallet);
  try {
    const tx = await program.methods
      .topUpEscrow(id, new BN(amount * LAMPORTS_PER_SOL))
      .accounts({ user: wallet.publicKey, admin: getAdminPublicKey() })
      .rpc();
    const conf = await program.provider.connection.confirmTransaction(tx);
    if (conf.value.err) return null;
    return {
      success: true,
      signature: tx,
      message: "Escrow session topped up successfully",
    };
  } catch (e) {
    console.error("Error topping up escrow session", e);
    return null;
  }
};

export const FinalizeRentalWithEscrow = async (
  wallet: AnchorWallet,
  id: string,
  amount: number,
) => {
  const program = Contarct(wallet);
  try {
    const tx = await program.methods
      .finaliseRentalWithEscrow(
        id,
        new BN(amount * LAMPORTS_PER_SOL),
        SECRET_KEY,
      )
      .accounts({ user: wallet.publicKey, admin: getAdminPublicKey() })
      .rpc();
    const conf = await program.provider.connection.confirmTransaction(tx);
    if (conf.value.err) return null;
    return {
      success: true,
      signature: tx,
      message: "Rental finalized successfully with escrow",
    };
  } catch (e) {
    console.error("Error finalizing rental with escrow", e);
    return null;
  }
};
