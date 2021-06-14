import { lobbyTypes } from "./constants";
import { LobbyPlayer } from "./interfaces/LobbyInterfaces";
import { Coach } from "../types/serializables/coach";
import { DFZDiscordClient } from "../types/DFZDiscordClient";
import { Player } from "../types/serializables/player";
import { CoachSerializer } from "../types/serializers/coachSerializer";
import { DFZDataBaseClient } from "../types/database/DFZDataBaseClient";
import { PlayerSerializer } from "../types/serializers/playerSerializer";

export async function saveCoachParticipation(
  dbClient: DFZDataBaseClient,
  coaches: Array<string>,
  lobbyType: number
) {
  var isTryout = lobbyType === lobbyTypes.tryout;
  var isReplayAnalysis = lobbyType === lobbyTypes.replayAnalysis;
  var isNormal = !isTryout && !isReplayAnalysis;

  for (let i = 0; i < coaches.length; i++) {
    var coachId = coaches[i];

    const serializer = new CoachSerializer(dbClient, coachId);
    const dBCoachList = await serializer.get();

    if (dBCoachList.length === 0 || dBCoachList[0].userId !== coachId) {
      await serializer.insert(
        new Coach(
          coachId,
          1,
          isTryout ? 1 : 0,
          isNormal ? 1 : 0,
          isReplayAnalysis ? 1 : 0
        )
      );
    } else {
      var dBCoach = dBCoachList[0];
      dBCoach.lobbyCount += 1;

      if (isTryout) dBCoach.lobbyCountTryout += 1;
      else if (isReplayAnalysis) dBCoach.lobbyCountReplayAnalysis += 1;
      else dBCoach.lobbyCountNormal += 1;

      await serializer.update(dBCoach);
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
    const serializer = new PlayerSerializer(client.dbClient, users[i].id);
    const players = await serializer.get();

    if (players.length === 0) {
      var user = await client.users.fetch(users[i].id);
      await serializer.insert(
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
      const player = players[0];
      player.lobbyCount += 1;

      if (isReplayAnalysis) player.lobbyCountReplayAnalysis += 1;
      else if (isUnranked) player.lobbyCountUnranked += 1;
      else if (is5v5) player.lobbyCount5v5 += 1;
      else if (isBotbash) player.lobbyCountBotBash += 1;

      await serializer.update(player);
    }
  }
}
