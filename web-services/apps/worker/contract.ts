import {
  clusterApiUrl,
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { AnchorProvider, Program, type Idl } from "@coral-xyz/anchor";
import idl from "./idl/contract.json";
import bs58 from "bs58";
import BN from "bn.js";

const connection = new Connection(clusterApiUrl("devnet"));

const VAULT_SEED = "axion_vault";

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  throw new Error("PRIVATE_KEY environment variable is not set.");
}
const payerKeypair = Keypair.fromSecretKey(bs58.decode(privateKey));

const wallet = {
  publicKey: payerKeypair.publicKey,
  signTransaction: async (transaction: Transaction) => {
    transaction.partialSign(payerKeypair);
    return transaction;
  },
  signAllTransactions: async (transactions: Transaction[]) => {
    return transactions.map((tx) => {
      tx.partialSign(payerKeypair);
      return tx;
    });
  },
};

const provider = new AnchorProvider(
  connection,
  wallet as any,
  AnchorProvider.defaultOptions(),
);
const program = new Program(idl as Idl, provider);

export async function endRentalSession(
  id: string,
  userPubKey: string,
  isEscrow: boolean,
): Promise<string | null> {
  const userPublicKey = new PublicKey(userPubKey);

  try {
    if (!isEscrow) {
      const [rentalSessionPDA] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("rental_session"),
          userPublicKey.toBuffer(),
          Buffer.from(id),
        ],
        program.programId,
      );
      const tx = await program.methods
        .endRentalSession(id, userPublicKey)
        .accounts({
          payer: wallet.publicKey,
          rentalSession: rentalSessionPDA,
        })
        .signers([payerKeypair])
        .rpc();
      await connection.confirmTransaction(tx);
      return tx;
    } else {
      const tx = await program.methods
        .forceTerminateRental(id, VAULT_SEED)
        .accounts({
          admin: wallet.publicKey,
          user: userPublicKey,
        })
        .signers([payerKeypair])
        .rpc();
      await connection.confirmTransaction(tx);
      return tx;
    }
  } catch (error) {
    console.error("Error ending rental session:", error);
    throw error;
  }
}

export async function InitialiseHostPDA(
  id: string,
  hostName: string,
  machineType: string,
  os: string,
  diskSize: number,
  pricePerHour: number,
  userPubKey: string,
): Promise<{ hostMachinePda: PublicKey } | null> {
  try {
    const userPublicKey = new PublicKey(userPubKey);
    const [hostMachinePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("host_machine"), userPublicKey.toBuffer(), Buffer.from(id)],
      program.programId,
    );
    const tx = await program.methods
      .initialiseHostRegistration(
        id,
        hostName,
        machineType,
        os,
        new BN(diskSize),
        new BN(pricePerHour),
      )
      .accounts({
        admin: payerKeypair.publicKey,
        userKey: userPublicKey,
      })
      .signers([payerKeypair])
      .rpc();
    await connection.confirmTransaction(tx);
    return { hostMachinePda };
  } catch (error) {
    console.error("Error initializing host PDA:", error);
    throw error;
  }
}

export async function deActivateHost(
  id: string,
  userPubKey: string,
): Promise<string | null> {
  const userPublicKey = new PublicKey(userPubKey);
  try {
    const tx = await program.methods
      .deactivateHost(id)
      .accounts({
        user: payerKeypair.publicKey,
        host: userPublicKey,
      })
      .signers([payerKeypair])
      .rpc();
    await connection.confirmTransaction(tx);
    return tx;
  } catch (error) {
    console.error("Error deactivating host:", error);
    throw error;
  }
}

export async function activateHost(
  id: string,
  userPubKey: string,
): Promise<string | null> {
  const userPublicKey = new PublicKey(userPubKey);
  try {
    const tx = await program.methods
      .activateHost(id)
      .accounts({
        user: payerKeypair.publicKey,
        host: userPublicKey,
      })
      .signers([payerKeypair])
      .rpc();
    await connection.confirmTransaction(tx);
    return tx;
  } catch (error) {
    console.error("Error activating host:", error);
    throw error;
  }
}

export async function claimRewards(
  id: string,
  userPubKey: string,
): Promise<string | null> {
  const userPublicKey = new PublicKey(userPubKey);
  try {
    // claim_rewards requires the host to sign — we use admin to relay
    // The host PDA is derived from the host's pubkey
    const tx = await program.methods
      .claimRewards(id)
      .accounts({
        host: userPublicKey,
        admin: payerKeypair.publicKey,
      })
      .signers([payerKeypair])
      .rpc();
    await connection.confirmTransaction(tx);
    return tx;
  } catch (error) {
    console.error("Error claiming rewards:", error);
    throw error;
  }
}

export async function settleDepinJob(
  id: string,
  renterPubKey: string,
  hostPubKey: string,
  hostEarned: number,
  platformFeeBps: number,
  platformVaultPubKey: string,
): Promise<string | null> {
  const renter = new PublicKey(renterPubKey);
  const host = new PublicKey(hostPubKey);
  const platformVault = new PublicKey(platformVaultPubKey);
  const [hostMachine] = PublicKey.findProgramAddressSync(
    [Buffer.from("host_machine"), host.toBuffer(), Buffer.from(id)],
    program.programId,
  );
  try {
    const tx = await program.methods
      .settleDepinJob(id, new BN(hostEarned), platformFeeBps)
      .accounts({
        admin: payerKeypair.publicKey,
        renter,
        host,
        platformVault,
        hostMachine,
      })
      .signers([payerKeypair])
      .rpc();
    await connection.confirmTransaction(tx);
    return tx;
  } catch (error) {
    console.error("Error settling DePIN job:", error);
    throw error;
  }
}

export async function penalizeHost(
  id: string,
  userPubKey: string,
): Promise<string | null> {
  const userPublicKey = new PublicKey(userPubKey);
  try {
    const tx = await program.methods
      .penalizeHost(id)
      .accounts({
        admin: payerKeypair.publicKey,
        user: userPublicKey,
      })
      .signers([payerKeypair])
      .rpc();
    await connection.confirmTransaction(tx);
    return tx;
  } catch (error) {
    console.error("Error penalizing host:", error);
    throw error;
  }
}
