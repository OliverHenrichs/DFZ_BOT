import { channelMention } from "@discordjs/builders";
import {
  ButtonInteraction,
  CommandInteraction,
  Interaction,
  InteractionUpdateOptions,
  MessageComponentInteraction,
  MessageEmbed,
  SelectMenuInteraction,
} from "discord.js";
import { AbstractExecutor } from "../logic/discord/CommandExecutors/AbstractExecutor";
import { ChannelManager } from "../logic/discord/DFZChannelManager";
import { DFZDiscordClient } from "../logic/discord/DFZDiscordClient";
import { InteractionUtils } from "../logic/discord/InteractionUtils";
import { ButtonCustomIds } from "../logic/discord/interfaces/ButtonCustomIds";
import { SelectorCustomIds } from "../logic/discord/interfaces/SelectorCustomIds";
import { LobbyMenuUtils } from "../logic/discord/LobbyMenuUtils";
import { LobbyPostManipulator } from "../logic/lobby/LobbyPostManipulator";
import { Lobby } from "../logic/serializables/lobby";
import { RegionDefinitions } from "../logic/time/RegionDefinitions";
import { lobbyTypes } from "../misc/constants";

module.exports = async function (
  client: DFZDiscordClient,
  interaction: Interaction
) {
  try {
    await tryToInteract(client, interaction);
  } catch (error) {
    if (interaction instanceof MessageComponentInteraction)
      await replyAndEndInteraction(
        interaction,
        `Failed interaction: ${error}\nPlease try again ;-)`
      );
  }
};

async function tryToInteract(
  client: DFZDiscordClient,
  interaction: Interaction
): Promise<void> {
  if (interaction.isCommand()) {
    return await handleCommand(client, interaction);
  }

  if (interaction.isSelectMenu()) {
    return await handleSelect(client, interaction);
  }

  if (interaction.isButton()) {
    return await handleButton(client, interaction);
  }
}

async function handleCommand(
  client: DFZDiscordClient,
  interaction: CommandInteraction
): Promise<void> {
  const command = client.slashCommandRegistrar.commands.get(
    interaction.commandName
  );
  if (!command) return;

  try {
    await interaction.deferReply({
      ephemeral: true,
    });
    const executor = command.executor as AbstractExecutor;
    await executor.execute(client, interaction);
  } catch (error) {
    return InteractionUtils.quitInteraction(
      interaction,
      "Could not execute command. Reason:\n\n" + error
    );
  }
}

async function handleButton(
  client: DFZDiscordClient,
  interaction: ButtonInteraction
): Promise<void> {
  if (pressedCancelButton(interaction)) {
    await LobbyMenuUtils.removeMenu(client, interaction);
    return await replyAndEndInteraction(interaction, "Cancelled lobby menu.");
  }

  if (pressedPostButton(interaction)) {
    return await tryPostLobby(client, interaction);
  }

  if (pressedUpdateButton(interaction)) {
    return await tryUpdateLobby(client, interaction);
  }

  await replyAndEndInteraction(
    interaction,
    "Pressed button, but I failed to make sense of it."
  );
}

async function handleSelect(
  client: DFZDiscordClient,
  selector: SelectMenuInteraction
): Promise<void> {
  const updatedLobbyMenuOptions = await updateMenuWithSelect(client, selector);
  selector.update(updatedLobbyMenuOptions);
}

async function updateMenuWithSelect(
  client: DFZDiscordClient,
  selector: SelectMenuInteraction
): Promise<InteractionUpdateOptions> {
  switch (selector.customId) {
    case SelectorCustomIds.lobby:
      return await LobbyMenuUtils.createOrUpdateLobbySpecificMenu(
        client,
        selector
      );
    default:
      return await LobbyMenuUtils.updateLobbyMenu(client, selector);
  }
}

async function replyAndEndInteraction(
  interaction: MessageComponentInteraction,
  infoText: string,
  embed?: MessageEmbed
): Promise<void> {
  await interaction.update({
    content: infoText,
    components: [],
    embeds: embed ? [embed] : [],
  });
}

async function tryPostLobby(
  client: DFZDiscordClient,
  interaction: MessageComponentInteraction
): Promise<void> {
  const menu = LobbyMenuUtils.getLobbyMenu(client, interaction);
  const lobby = menu.lobby;
  lobby.channelId = getLobbyChannel(lobby);
  await LobbyPostManipulator.postLobby(client, lobby);

  await replyAndEndInteraction(
    interaction,
    "Posted the lobby in channel " +
      channelMention(lobby.channelId) +
      ". \nPosted lobby reads:",
    LobbyPostManipulator.createLobbyEmbedding(lobby)
  );
  await LobbyMenuUtils.removeMenu(client, interaction);
}

async function tryUpdateLobby(
  client: DFZDiscordClient,
  interaction: MessageComponentInteraction
): Promise<void> {
  const channel = interaction.channel;
  if (!channel) {
    throw new Error("Use update lobby in the channel of the updating lobby");
  }
  const menu = LobbyMenuUtils.getLobbyMenu(client, interaction);

  await menu.lobby.updateLobbyPostAndDBEntry(channel, client.dbClient);

  await replyAndEndInteraction(
    interaction,
    "Updated lobby in channel " +
      channelMention(menu.lobby.channelId) +
      ". \nUpdated lobby reads:",
    LobbyPostManipulator.createLobbyEmbedding(menu.lobby)
  );
  await LobbyMenuUtils.removeMenu(client, interaction);
}

function pressedCancelButton(interaction: ButtonInteraction): boolean {
  return interaction.customId === ButtonCustomIds.cancel;
}

function pressedPostButton(interaction: ButtonInteraction): boolean {
  return interaction.customId === ButtonCustomIds.post;
}

function pressedUpdateButton(interaction: ButtonInteraction): boolean {
  return interaction.customId === ButtonCustomIds.update;
}

function getLobbyChannel(lobby: Lobby): string {
  switch (lobby.type) {
    case lobbyTypes.inhouse:
    case lobbyTypes.botbash:
    case lobbyTypes.unranked:
      return getChannelIdByRegion(lobby);
    case lobbyTypes.replayAnalysis:
      return ChannelManager.replayAnalysisChannel;
    case lobbyTypes.tryout:
      return ChannelManager.tryoutChannel;
    case lobbyTypes.meeting:
      return lobby.channelId;
    default:
      throw new Error("Could not find lobby channel");
  }
}

function getChannelIdByRegion(lobby: Lobby) {
  const region = RegionDefinitions.regions.find(
    (region) => region.role === lobby.regionId
  );
  if (!region) {
    throw new Error(
      "Could not find lobby region when checking for lobby channels"
    );
  }
  return region.lobbyChannelId;
}
