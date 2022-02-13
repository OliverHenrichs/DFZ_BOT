import { DFZDataBaseClient } from "../logic/database/DFZDataBaseClient";
import { SQLUtils } from "../logic/database/SQLUtils";
import { DFZDiscordClient } from "../logic/discord/DFZDiscordClient";
import { LobbyPlayer } from "../logic/lobby/interfaces/LobbyPlayer";
import { Coach } from "../logic/serializables/coach";
import { Player } from "../logic/serializables/player";
import { CoachSerializer } from "../logic/serializers/CoachSerializer";
import { PlayerSerializer } from "../logic/serializers/PlayerSerializer";
import { IGuildDataBaseClient } from "../logic/serializers/types/IGuildDataBaseClient";
import { lobbyTypes } from "./constants";

export async function saveCoachParticipation(
  dbClient: DFZDataBaseClient,
  guildId: string,
  coaches: Array<string>,
  lobbyType: number
) {
  let isTryout = lobbyType === lobbyTypes.tryout;
  const isReplayAnalysis = lobbyType === lobbyTypes.replayAnalysis;
  const isNormal = !isTryout && !isReplayAnalysis;
  const gdbc: IGuildDataBaseClient = {
    guildId,
    dbClient,
  };

  for (let i = 0; i < coaches.length; i++) {
    const coachId = coaches[i];
    const serializer = new CoachSerializer(gdbc, coachId);
    const dBCoachList = await serializer.get();

    if (dBCoachList.length === 0 || dBCoachList[0].userId !== coachId) {
      await serializer.insert(
        new Coach(
          coachId,
          guildId,
          1,
          isTryout ? 1 : 0,
          isNormal ? 1 : 0,
          isReplayAnalysis ? 1 : 0
        )
      );
    } else {
      const dBCoach = dBCoachList[0];
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
  guildId: string,
  users: Array<LobbyPlayer>,
  lobbyType: number,
  playersPerLobby: number
) {
  const isReplayAnalysis = lobbyType === lobbyTypes.replayAnalysis;
  const isUnranked = lobbyType === lobbyTypes.unranked;
  const is5v5 = lobbyType === lobbyTypes.inhouse;
  const isBotbash = lobbyType === lobbyTypes.botbash;

  const referredBy = "",
    referralLock = 0,
    lobbyCount = 1;

  const gdbc: IGuildDataBaseClient = {
    dbClient: client.dbClient,
    guildId,
  };

  for (let i = 0; i < Math.min(users.length, playersPerLobby); i++) {
    const uid = users[i].id;
    const serializer = new PlayerSerializer(gdbc, uid);
    const players = await serializer.get();

    if (players.length === 0) {
      const user = await client.users.fetch(uid);
      await serializer.insert(
        new Player(
          user.id,
          guildId,
          SQLUtils.escape(user.tag),
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
