import { type AnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getContract } from "./contract";
import axios from "axios";
import { BACKEND_URL } from "@/config";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const account = await (program.account as any).hostMachineRegistration.fetch(
    pda,
  );
  return Number(account.earned) / 1e9;
}

export async function claimSolana(
  machineId: string,
  pubKey: string,
  token: string,
): Promise<{ success: boolean; message: string }> {
  const res = await axios.post(
    `${BACKEND_URL}/user/depin/claimSOL`,
    { id: machineId, pubKey },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return res.data;
}
