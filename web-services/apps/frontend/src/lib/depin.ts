import { type AnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getAdminPublicKey, SECRET_KEY } from "@/config";
import { getContract } from "./contract";

export const claimSolana = async (wallet: AnchorWallet, id: string) => {
  try {
    const program = getContract(wallet);
    const txn = await program.methods
      .claimRewards(id, SECRET_KEY)
      .accounts({
        admin: getAdminPublicKey(),
        host: wallet.publicKey,
      })
      .rpc();

    const transaction =
      await program.provider.connection.confirmTransaction(txn);
    if (transaction.value.err) {
      console.error("Transaction failed", transaction.value.err);
      return null;
    }
    return {
      success: true,
      signature: txn,
      message: "Claim successful",
    };
  } catch (error) {
    console.error("Error claiming Solana:", error);
    throw error;
  }
};

export async function getEarnedSOL(
  machineId: string,
  userPublicKey: PublicKey,
  wallet: AnchorWallet,
): Promise<number> {
  const program = getContract(wallet);
  const [pda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("host_machine"),
      userPublicKey.toBuffer(),
      Buffer.from(machineId),
    ],
    program.programId,
  );
  const accountInfo = await program.provider.connection.getAccountInfo(pda);
  if (!accountInfo) {
    throw new Error("Account not found");
  }
  return Number(accountInfo.data.readBigUInt64LE(0) / BigInt(1e9));
}
