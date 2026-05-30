import { createQueue } from "@axion/utilities/redis";

export const vmQueue = createQueue("vm-termination");
export const terminateDepinVMQueue = createQueue("terminate-depin-vm");
export const activateHostQueue = createQueue("changeVMStatus");
export const initialiseAccount = createQueue("initialise-host-pda");
export const claimRewardsQueue = createQueue("claim-rewards");
