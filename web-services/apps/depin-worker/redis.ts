import { createQueue } from "@decloud/utilities/redis";

export const initialiseAccount = createQueue("initialise-host-pda");
