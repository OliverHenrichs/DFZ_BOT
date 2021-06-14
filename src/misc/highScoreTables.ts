import { FieldElement } from "./interfaces/FieldElement";
import { Coach } from "../types/serializables/coach";
import { Player } from "../types/serializables/player";
import { Referrer } from "../types/serializables/referrer";

export function addDBCoachRowToTable(
  tableBase: Array<FieldElement>,
  coach: Coach
) {
  tableBase[0].value = tableBase[0].value + "\r\n<@" + coach.userId + ">";
  tableBase[1].value = tableBase[1].value + "\r\n" + coach.lobbyCount;
  tableBase[2].value = tableBase[2].value + "\r\n" + coach.lobbyCountNormal;
  tableBase[3].value = tableBase[3].value + "\r\n" + coach.lobbyCountTryout;
  tableBase[4].value =
    tableBase[4].value + "\r\n" + coach.lobbyCountReplayAnalysis;
}
export function addDBPlayerRowToTable(
  tableBase: Array<FieldElement>,
  player: Player
) {
  tableBase[0].value = tableBase[0].value + "\r\n<@" + player.userId + ">";
  tableBase[1].value = tableBase[1].value + "\r\n" + player.lobbyCount;
  tableBase[2].value = tableBase[2].value + "\r\n" + player.lobbyCountUnranked;
  tableBase[3].value = tableBase[3].value + "\r\n" + player.lobbyCount5v5;
  tableBase[4].value = tableBase[4].value + "\r\n" + player.lobbyCountBotBash;
  tableBase[5].value =
    tableBase[5].value + "\r\n" + player.lobbyCountReplayAnalysis;
}

export function addDBReferrerRowToTable(
  tableBase: Array<FieldElement>,
  referrer: Referrer
) {
  tableBase[0].value = tableBase[0].value + "\r\n" + referrer.tag;
  tableBase[1].value = tableBase[1].value + "\r\n" + referrer.referralCount;
}

export const tableBaseReferrersTemplate: FieldElement[] = [
  {
    name: "Referrer",
    value: "",
    inline: true,
  },
  {
    name: "Referral Count",
    value: "",
    inline: true,
  },
];

export const tableBaseCoachesTemplate: FieldElement[] = [
  {
    name: "Coach",
    value: "",
    inline: true,
  },
  {
    name: "Total Coached Lobbies",
    value: "",
    inline: true,
  },
  {
    name: "Regular Lobbies",
    value: "",
    inline: true,
  },
  {
    name: "Tryouts",
    value: "",
    inline: true,
  },
  {
    name: "Replay Analyses",
    value: "",
    inline: true,
  },
];

export const tableBasePlayersTemplate: FieldElement[] = [
  {
    name: "Player",
    value: "",
    inline: true,
  },
  {
    name: "Total played",
    value: "",
    inline: true,
  },
  {
    name: "Unranked",
    value: "",
    inline: true,
  },
  {
    name: "5v5",
    value: "",
    inline: true,
  },
  {
    name: "Botbash",
    value: "",
    inline: true,
  },
  {
    name: "Replay Analyses",
    value: "",
    inline: true,
  },
];
