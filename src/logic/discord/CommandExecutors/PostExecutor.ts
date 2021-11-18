import { CommandInteraction, Interaction, MessageActionRow } from "discord.js";
import { lobbyTypes } from "../../../misc/constants";
import { LobbyPostManipulator } from "../../lobby/LobbyPostManipulator";
import { Lobby } from "../../serializables/lobby";
import { getDateFromInteraction } from "../../time/timeZone";
import { DFZDiscordClient } from "../DFZDiscordClient";
import { CommandOptionNames } from "../interfaces/CommandOptionNames";
import { LobbyMenuType } from "../interfaces/LobbyMenuType";
import { SlashCommandIds } from "../interfaces/SlashCommandsIds";
import { tryoutRole } from "../roleManagement";
import { SlashCommandHelper } from "../SlashCommandHelper";
import { AbstractExecutor } from "./AbstractExecutor";
import { SelectMenuUtils } from "./SelectMenuUtils";

export class PostExecutor extends AbstractExecutor {
  public async execute(
    client: DFZDiscordClient,
    interaction: CommandInteraction
  ): Promise<void> {
    const lobbyType = interaction.options.getNumber(CommandOptionNames.type);
    if (lobbyType === null) {
      throw new Error("You did not provide a lobby type.");
    }

    const rows = await PostExecutor.addPostRows(client, interaction, lobbyType);
    rows.push(
      await SlashCommandHelper.addGoAndCancelButtons(
        SlashCommandIds.post,
        "Post"
      )
    );

    const date = getDateFromInteraction(interaction);
    if (!date) {
      throw new Error("Received invalid time from command.");
    }

    const freeText = interaction.options.getString(CommandOptionNames.freeText);

    const newLobby = new Lobby(
      lobbyType,
      date.getTime(),
      interaction.member ? [interaction.member.user.id] : [],
      [getDefaultBeginnerRoleByLobbyType(lobbyType)],
      getDefaultRegionRoleByLobbyType(lobbyType),
      "",
      "",
      freeText ? freeText : ""
    );

    interaction
      .editReply({
        content: "Set Further options and press post\n\nCurrent Lobby-setup:",
        embeds: [LobbyPostManipulator.createLobbyEmbedding(newLobby)],
        components: rows,
      })
      .then((message) => {
        client.lobbyMenus.push({
          type: LobbyMenuType.post,
          lobby: newLobby,
          id: message.id,
        });
      });
  }

  public static async addPostRows(
    client: DFZDiscordClient,
    interaction: Interaction,
    lobbyType: number
  ): Promise<MessageActionRow[]> {
    switch (lobbyType) {
      case lobbyTypes.inhouse:
      case lobbyTypes.unranked:
      case lobbyTypes.botbash:
      case lobbyTypes.replayAnalysis:
        return PostExecutor.addInhousePostRows(client, interaction);
      case lobbyTypes.meeting:
        return PostExecutor.addMeetingPostRows(client, interaction);
      case lobbyTypes.tryout:
      default:
        return [];
    }
  }

  private static async addInhousePostRows(
    client: DFZDiscordClient,
    interaction: Interaction
  ): Promise<MessageActionRow[]> {
    return await SelectMenuUtils.addMenuRows({
      client,
      interaction,
      menuFunctions: [
        SelectMenuUtils.createBeginnerRolesSelectMenu,
        SelectMenuUtils.createRegionRolesSelectMenu,
      ],
    });
  }

  private static async addMeetingPostRows(
    client: DFZDiscordClient,
    interaction: Interaction
  ): Promise<MessageActionRow[]> {
    return await SelectMenuUtils.addMenuRows({
      client,
      interaction,
      menuFunctions: [
        SelectMenuUtils.createBeginnerAndAdminRolesSelectMenu,
        SelectMenuUtils.createChannelOptionsSelectMenu,
      ],
    });
  }
}

function getDefaultBeginnerRoleByLobbyType(lobbyType: number): string {
  if (lobbyType === lobbyTypes.tryout) return tryoutRole;
  return SelectMenuUtils.defaultBeginnerRole;
}

function getDefaultRegionRoleByLobbyType(lobbyType: number): string {
  if (lobbyType === lobbyTypes.tryout) return "";
  return SelectMenuUtils.defaultRegion;
}
