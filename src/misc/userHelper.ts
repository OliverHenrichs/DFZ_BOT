import { Role } from "discord.js";
import { getNumberFromBeginnerRole } from "../logic/discord/roleManagement";
import { LobbyPlayer } from "../logic/lobby/interfaces/LobbyPlayer";
import { PositionPlayers } from "../logic/lobby/interfaces/PositionPlayers";
import { Lobby } from "../logic/serializables/lobby";
import { lobbyTypes } from "./constants";
import { coinFlip, shuffle } from "./generics";

/**
 * Swap two array elements in place
 * thx @ https://stackoverflow.com/questions/872310/javascript-swap-array-elements
 * @param {Array<any>} arr the array
 * @param {any} x first item index
 * @param {any} y second item index
 * @return ref to array
 */
function swap(arr: Array<any>, x: any, y: any) {
  var b = arr[x];
  arr[x] = arr[y];
  arr[y] = b;
  return arr;
}

/**
 * compares two users by tier
 * @param {User} a user a
 * @param {User} b user b
 */
function tier_sorter(a: LobbyPlayer, b: LobbyPlayer) {
  return b.tier.number - a.tier.number;
}

/**
 * compares two users by tier the other way round
 * @param {JSON} a user a
 * @param {*} b user b
 */
function reverse_tier_sorter(a: LobbyPlayer, b: LobbyPlayer) {
  return a.tier.number - b.tier.number;
}

/**
 * Filters users by position and sorts the filtered users by tier
 * @param {Discord.User} users
 * @param {*} position
 * @return filtered array of users
 */
function filterAndSortByPositionAndTier_int(
  users: LobbyPlayer[],
  position: number
) {
  var filteredUsers = filterByPosition(users, position);

  return filteredUsers.sort(tier_sorter);
}

/**
 * Filters users by position
 * @param {Discord.User} users
 * @param {int} position
 * @return filtered array of users
 */
function filterByPosition(users: LobbyPlayer[], position: number) {
  function _filter(value: LobbyPlayer): value is LobbyPlayer {
    return value.positions.includes(position);
  }

  return users.filter(_filter);
}

/**
 * Returns an array of positions with all players having that position in each of the arrays
 * @param {*} _users given users
 * @return array of positions; each entry has position and the respective users that want to play it
 */
function getPlayersPerPosition(_users: LobbyPlayer[]) {
  // get players per position
  var playersPerPosition: PositionPlayers[] = [];
  for (let position = 1; position < 6; position++) {
    playersPerPosition.push({
      pos: position,
      users: filterByPosition(_users, position),
    });

    // randomly reverse order
    if (coinFlip() === true) playersPerPosition[position - 1].users.reverse();
  }

  // sort to get 'tightest' positions (least amount of players) come first
  playersPerPosition.sort((a, b) => {
    return a.users.length - b.users.length;
  });

  return playersPerPosition;
}

/**
 * Matchmaking system for beginner tiers
 * @param {map} playerPositionMap maps players to position
 * @param {list} openUsers users in the lobby
 */
function createInhouseTeams(
  playerPositionMap: LobbyPlayer[][],
  openUsers: LobbyPlayer[]
) {
  // now sort by tier
  openUsers.sort(coinFlip() === true ? tier_sorter : reverse_tier_sorter);

  var playersPerPosition = getPlayersPerPosition(openUsers);
  var skillPoints = { radiant: 0, dire: 0 };
  while (true) {
    // we're finished cause there are no more positions to fill
    if (playersPerPosition.length === 0) break;

    // take position with fewest available players
    var pos = playersPerPosition[0].pos - 1;
    var players = playersPerPosition[0].users;

    // not enough players want to play this position, but we gotta make do
    if (players.length < 2) {
      if (openUsers.length < 2) {
        // that should not happen, number of players < 10 or something
        console.log("Did not have enough players to fill lobby, aborting");
        break;
      }

      if (players.length == 0) {
        // we have no players for any of the remaining positions => just fill from remaining player pool
        playerPositionMap[pos] = [openUsers[0], openUsers[1]];
      } else {
        // we have one player for this position => fill from remaining player pool, try to take same tier
        var other: LobbyPlayer | undefined = openUsers.find(
          (user) =>
            user.id != players[0].id && user.tier.id == players[0].tier.id
        );

        // if we didnt find one from same tier, we take first player that is not this player
        if (other === undefined)
          other = openUsers.find((user) => user.id != players[0].id);

        if (other === undefined) {
          console.log("Something went horribly wrong in createInhouseTeams");
          break;
        }
        // assign and move on
        playerPositionMap[pos] = [players[0], other];
      }
    } else {
      // enough players want to play this position
      var found = false;
      var last = players[0];

      // add players to this position
      for (let i = 1; i < players.length; i++) {
        if (players[i].tier.id == last.tier.id) {
          // second player of tier => assign position
          playerPositionMap[pos] = [players[i], last];
          found = true;
          break;
        }

        last = players[i];
      }

      // we didnt find two same-tier-players, but we have enough players for the position, then just take the first two
      if (!found) {
        playerPositionMap[pos] = [players[0], players[1]];
      }
    }

    // take care of balancing in case of unequal teams

    // current skill diff in teams
    var skillDiffTeams = skillPoints.radiant - skillPoints.dire;

    // skill diff for new players
    var skillRadiantPlayer = playerPositionMap[pos][0].tier.number;
    var skillDirePlayer = playerPositionMap[pos][1].tier.number;
    var skillDiffNewUsers = skillRadiantPlayer - skillDirePlayer;

    if (skillDiffTeams > 0) {
      // radiant advantage => put stronger player on dire
      if (skillDiffNewUsers > 0)
        // radiant player is stronger => swap
        swap(playerPositionMap[pos], 0, 1);
    } else {
      // dire advantage or equal => put stronger player on radiant
      if (skillDiffNewUsers < 0)
        // dire player is stronger => swap
        swap(playerPositionMap[pos], 0, 1);
    }

    skillPoints.radiant += playerPositionMap[pos][0].tier.number;
    skillPoints.dire += playerPositionMap[pos][1].tier.number;

    // cleanup for next iteration
    // position is finished, so get rid of it
    playersPerPosition.shift();

    // get ids
    var id1 = playerPositionMap[pos][0].id;
    var id2 = playerPositionMap[pos][1].id;

    // remove newly assigned players for the remaining positions
    playersPerPosition.forEach((players) => {
      players.users = players.users.filter((usr) => {
        if (usr.id == id1 || usr.id == id2) return false;
        return true;
      });
    });

    // re-sort the positional player arrays
    playersPerPosition.sort((a, b) => {
      return a.users.length - b.users.length;
    });

    // remove newly assigned players from openUsers
    openUsers = openUsers.filter((usr) => {
      if (
        usr.id == playerPositionMap[pos][0].id ||
        usr.id == playerPositionMap[pos][1].id
      )
        return false;
      return true;
    });
  }
}

function createNonCompetitionTeams(
  playerPositionMap: LobbyPlayer[][],
  openUsers: LobbyPlayer[]
) {
  var playersPerPosition = getPlayersPerPosition(openUsers);
  while (true) {
    // we're finished cause there are no more positions to fill
    if (playersPerPosition.length == 0) break;

    if (openUsers.length < 1) {
      console.log("Did not have enough players to fill lobby, aborting");
      break;
    }

    // take position with fewest available players
    const pos = playersPerPosition[0].pos - 1; // positions from 1-5, entries from 0-4, so substract 1
    const players = playersPerPosition[0].users;

    if (players.length >= 1) playerPositionMap[pos] = [players[0]];
    else playerPositionMap[pos] = [openUsers[0]];

    // cleanup for next iteration

    // position is finished, so get rid of it
    playersPerPosition.shift();

    // get ids
    var id = playerPositionMap[pos][0].id;

    // remove newly assigned players for the remaining positions
    playersPerPosition.forEach((players) => {
      players.users = players.users.filter((usr) => {
        if (usr.id == id) return false;
        return true;
      });
    });

    // re-sort the positional player arrays
    playersPerPosition.sort((a, b) => {
      return a.users.length - b.users.length;
    });

    // remove newly assigned players from openUsers
    openUsers = openUsers.filter((usr) => {
      if (usr.id == playerPositionMap[pos][0].id) return false;
      return true;
    });
  }
}

/**
 * @param {Lobby} lobby
 * @param {string} name
 * @param {string} id
 * @param {Array<number>} positions
 * @param {Role} beginnerRole
 * @param {Role | undefined} regionRole
 */
export function addUser(
  lobby: Lobby,
  name: string,
  id: string,
  positions: Array<number>,
  beginnerRole: Role,
  regionRole: Role | undefined
) {
  // create user
  var user: LobbyPlayer = {
    name: name,
    id: id,
    positions: positions,
    tier: {
      id: beginnerRole.id,
      number: getNumberFromBeginnerRole(beginnerRole.id),
      name: beginnerRole.name,
    },
    region: {
      id: regionRole ? regionRole.id : "No region set",
      name: regionRole ? regionRole.name : "",
    },
  };
  user.positions.sort();

  // user is from region => append before other regions
  if (lobby.regionId && user.region.id === lobby.regionId) {
    for (let idx = 0; idx < lobby.users.length; idx++) {
      var curUser = lobby.users[idx];
      if (curUser.region.id !== lobby.regionId) {
        lobby.users.splice(idx, 0, user);
        return;
      }
    }
  }

  // user is not from region or all users are from the lobby region
  lobby.users.push(user);
}

export function userExists(lobby: Lobby, userId: string) {
  return lobby.users.find((element) => element.id == userId) !== undefined;
}

export function getUserIndex(lobby: Lobby, userId: string) {
  return lobby.users.findIndex((user) => user.id == userId);
}

export function getUser(lobby: Lobby, userId: string) {
  return lobby.users.find((element) => element.id == userId);
}

export function filterAndSortByPositionAndTier(lobby: Lobby, position: number) {
  return filterAndSortByPositionAndTier_int(lobby.users, position);
}

/**
 * Creates teams based on users and lobby type
 * @param {list} users
 * @param {int} lobbyType
 */
export function createTeams(users: LobbyPlayer[], lobbyType: number) {
  var playerPositionMap: LobbyPlayer[][] = [[], [], [], [], []]; // all positions empty; for 1 team every pos gets one player, for two teams two players
  var openUsers = users;

  // randomize users to not have e.g. first person to subscribe be pos 1 guaranteed etc.
  shuffle(openUsers);

  if (lobbyType === lobbyTypes.inhouse) {
    createInhouseTeams(playerPositionMap, openUsers);
  } else if (
    lobbyType === lobbyTypes.unranked ||
    lobbyType === lobbyTypes.botbash ||
    lobbyType === lobbyTypes.tryout
  ) {
    createNonCompetitionTeams(playerPositionMap, openUsers);
  }

  return playerPositionMap;
}
