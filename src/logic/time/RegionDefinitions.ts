import { EnvironmentVariableManager as EVM } from "../misc/EnvironmentVariableManager";

export class RegionDefinitions {
  static regions: IRegion[] = [
    {
      name: "EU",
      fancyVersion: "🇪🇺 EU",
      timeZoneName: "Europe/Brussels",
      userNamePrefix: "[EU] ",
      lobbyChannelId: EVM.ensureString(process.env.BOT_LOBBY_CHANNEL_EU),
      role: EVM.ensureString(process.env.REGION_EU_ROLE),
    },
    {
      name: "NA",
      fancyVersion: "🇺🇸 NA",
      timeZoneName: "America/New_York",
      userNamePrefix: "[NA] ",
      lobbyChannelId: EVM.ensureString(process.env.BOT_LOBBY_CHANNEL_NA),
      role: EVM.ensureString(process.env.REGION_NA_ROLE),
    },
    {
      name: "SEA",
      fancyVersion: "🌏 SEA",
      timeZoneName: "Asia/Singapore",
      userNamePrefix: "[SEA] ",
      lobbyChannelId: EVM.ensureString(process.env.BOT_LOBBY_CHANNEL_SEA),
      role: EVM.ensureString(process.env.REGION_SEA_ROLE),
    },
  ];

  static regionRoles = this.regions.map((region) => region.role);

  static allTimeZoneNames = [
    "Europe/Brussels",
    "Europe/London",
    "Europe/Kiev",
    "Europe/Moscow",
    "America/Sao_Paulo",
    "America/Caracas",
    "America/New_York",
    "America/Chicago",
    "America/Phoenix",
    "America/Los_Angeles",
    "Asia/Tehran",
    "Asia/Yekaterinburg",
    "Asia/Kolkata",
    "Asia/Bangkok",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Australia/Sydney",
  ];
}

interface IRegion {
  name: string;
  fancyVersion: string;
  userNamePrefix: string;
  timeZoneName: string;
  lobbyChannelId: string;
  role: string;
}
