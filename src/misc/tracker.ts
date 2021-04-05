import { Pool } from "mysql2/promise";
import { lobbyTypes } from "./constants";
import { getCoach, insertCoach, updateCoach, getSortedPlayers, getPlayerByID, insertPlayer, updatePlayer } from "./database";
import { LobbyPlayer } from "./interfaces/LobbyInterfaces";
import { Coach } from "./types/coach";
import { DFZDiscordClient } from "./types/DFZDiscordClient";
import { Player } from "./types/player";

/**
 *
 * @param {Pool} dbHandle bot database handle
 * @param {Array<string>} coaches coach ids
 * @param {number} lobbyType lobby type
 */
export async function saveCoachParticipation(
  dbHandle: Pool,
  coaches: Array<string>,
  lobbyType: number
) {
  var isTryout = lobbyType === lobbyTypes.tryout;
  var isReplayAnalysis = lobbyType === lobbyTypes.replayAnalysis;
  var isNormal = !isTryout && !isReplayAnalysis;
  
  for (let i = 0; i < coaches.length; i++) {
    var coachId = coaches[i];
    var dBCoach = await getCoach(dbHandle, coachId);
    if (dBCoach === undefined || dBCoach.userId !== coachId) {
      await insertCoach(
        dbHandle,
        new Coach(
          coachId,
          1,
          isTryout ? 1 : 0,
          isNormal ? 1 : 0,
          isReplayAnalysis ? 1 : 0
        )
      );
    } else {
      dBCoach.lobbyCount += 1;

      if (isTryout) dBCoach.lobbyCountTryout += 1;
      else if (isReplayAnalysis) dBCoach.lobbyCountReplayAnalysis += 1;
      else dBCoach.lobbyCountNormal += 1;

      await updateCoach(dbHandle, dBCoach);
    }
  }
}

export async function savePlayerParticipation(
  client: DFZDiscordClient,
  users: Array<LobbyPlayer>,
  lobbyType: number,
  playersPerLobby: number
) {
  var isReplayAnalysis = lobbyType === lobbyTypes.replayAnalysis;
  var isUnranked = lobbyType === lobbyTypes.unranked;
  var is5v5 = lobbyType === lobbyTypes.inhouse;
  var isBotbash = lobbyType === lobbyTypes.botbash;

  var referredBy = "",
    referralLock = 0,
    lobbyCount = 1;

  for (let i = 0; i < Math.min(users.length, playersPerLobby); i++) {
    var player = await getPlayerByID(client.dbHandle, users[i].id);

    if (player === undefined) {
      var user = await client.users.fetch(users[i].id);
      await insertPlayer(
        client.dbHandle,
        new Player(
          users[i].id,
          user.tag,
          referredBy,
          referralLock,
          lobbyCount,
          isUnranked ? 1 : 0,
          isBotbash ? 1 : 0,
          is5v5 ? 1 : 0,
          isReplayAnalysis ? 1 : 0,
          0
        )
      );
    } else {
      player.lobbyCount += 1;

      if (isReplayAnalysis) player.lobbyCountReplayAnalysis += 1;
      else if (isUnranked) player.lobbyCountUnranked += 1;
      else if (is5v5) player.lobbyCount5v5 += 1;
      else if (isBotbash) player.lobbyCountBotBash += 1;

      await updatePlayer(client.dbHandle, player);
    }
  }
}