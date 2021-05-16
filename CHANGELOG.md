_@Coach The bot received some new features today!_

**DFZ-Bot v0.12 - Changelog**

1. Delayed Lobby cancel when pressing ❌ on a lobby

   > When a coach cancels a lobby there now is a 2 min grace period
   > in which they can undo the harm by pressing ❌ again.

2. Meetings can now invite coaches and can have a topic
   > _!post meeting 10:00pm CET coaches_ invites coaches
   > _!post meeting 10:00pm CET players_ invites beginner tiers
   > _!post meeting 10:00pm CET_ invites both
   > Also you can add arbitrary text after _coaches/players_ to add Topic text

---

**DFZ-Bot v0.11 - Changelog**

1. Delayed lobby deletion after lobby lock

   > When coaches start a lobby, there now is a 15 minute grace period, in which players can join / leave
   > and the coach can re-lock to repost the player lineups. Thus, when new players show up
   > a couple of minutes after the lobby start (e.g. coaches invite T3/T4 to fill up ranks)
   > they can join and the matchmaking-algorithm of DFZ-bot can re-run to decide teams

2. Kicking players from lobbies: !kick <msgId> <playerId>
   > Coaches can kick players from lobbies.
   > msgId is the Message ID of the lobby post, player ID is - well - the ID of the kickee.
   > Both can be referred by rightclicking the respective entity.
   > **This command is strictly for weeding out AFK players after supposed lobby start.**

---

**DFZ-Bot v0.10 - Changelog**

1. T3/T4 scheduling system
   > Introduced T3/T4 lobby schedule strictly for Beginner Tier 3 and 4.

---

**DFZ-Bot v0.9 - Changelog**

1. We now have a **Website**. It's fancy but unfinished.
   > It's not official yet, but @coaches [check it out](http://107.180.238.99/) (https and DNS is coming soon).
   > It describes what we do at DFZ.
   > One can create an !apply-string [using a form](http://107.180.238.99/join).
   > Players can create a referral-link that inputs a player's Discord-Tag in above form (Idea: players bring in new players)
2. Bot tracks players
   > Players will have a track record of all games that have been started with 🔒 by a coach
   > Looking for uses of this apart from making a nice table
3. Enabled Referrals
   > Posting the !apply message generated with a referral-link is picked up by the bot s.t. we can track player's referral-count
   > Referrers get a point, when a new player receives a Beginner-role (after a tryout-match)
4. Updated discord.js to v12.5.1 and fixed all API-changes

**DFZ-Bot v0.8 - Changelog**

1. Botbash lobby schedule
   > Introduced Botbash lobby schedule strictly for Beginner Tier 1.
2. Lobby type ReplayAnalysis
   > Posted like a tryout lobby, i.e. !post replayAnalysis 10:00pm SGT, it will invite all beginner tiers (1-4).

---

**DFZ-Bot v0.7 - Changelog**

1. Coach assignment for lobbies.

   > When a coach creates a lobby, they will be labelled a coach for that lobby
   > If the lobby is being auto-created by the schedule, then the assigned coaches in the schedule will also be assigned to the lobby
   > Coaches can now withdraw and join lobbies like players can. Use the emoji 🧑‍🏫 to join/withdraw;

2. Fixed failure of lobby tier updates due to bot's auto-updates

---

**DFZ-Bot v0.6 - Changelog**

1. Auto-posting of lobbies for scheduled events that have signed up coaches.
   > The bot will now post the lobbies for each scheduled event in the respective channel 8 hours prior to the lobby time (the time at which the lobby was scheduled)
   > If a coach signs up after that point in time, then the lobby is posted immediatly. **The lobby post is public and will only happen once.**
   > '_Off topic: If you find out that for whatever reason you cannot coach that lobby you can still withdraw. It's just that after it's been posted, you have to kindly ask your fellow coaches for a stand-in. If you cannot find someone, then you have to cancel the lobby (❌) and make amends to your fello dfz-lers._'

---

**DFZ-Bot v0.5 - Changelog**

1. Added update-functionality for lobbies
   > Command reads '_!update &lt;msgId&gt; -tiers &lt;tiers&gt;_'<br/>
   > It updates the lobby that is associated with the given message-ID. To get a lobby's message-ID, first activate discord's developer mode in the discord options, then rightclick the lobby post that you want to change and click 'copy ID'.<br/>
   > Available options: -tiers &lt;tiers&gt; Give tiers you want to allow in this lobby (e.g. '1,2')<br/>
   > Example: '_!update 791297808669737001 -tiers 1,2,3_' would've updated DFZ-bot's EU unranked lobby on the 23rd of december at 8pm CET to also allow Tier 3 players, because 791297808669737001 is the associated message ID of the lobby post.<br/>
   > Options to change additional lobby parameters can be implemented if needed.

---

**DFZ-Bot v0.4 - Changelog**

1. Automatic scheduling every sunday.

   > The bot will issue schedule-posts for tryout and 5v5-lobby schedule.

2. Display of coach signup in scheduling posts.

   > Clicking on the Emojis representing the scheduled lobbies will have the coaches name appear in the list of coaches.
   > If more than the designated number of coaches sign up, then they will be queued and - in case a coach resigns, move up and replace them.

3. Automatic creation of Google calendar entries.
   > If enough coaches have signed up for a lobby (for tryouts e.g. 1 coach, for 5v5-lobby 2 coaches) then a google calendar entry is created.
   > The calendar entry will update itself to display the coaches that are currently signed up.
   > Links to the calendars will be posted in the announcement-channel.

If you find bugs or have improvement suggestion, please either DM me or mention me in a post in #internal-talk.

---

**DFZ-Bot v0.3 - Changelog**

1. Multiple lobbies per channel are now allowed.

   > Posting lobbies for later/tomorrow without blocking other coaches is therefore now possible.

2. Reworked bot-lobby interaction for coaches.<br/>
   > Removed all written commands except for '_!helpme_' and '_!post_'; Introduced two new emojis, 🔒 and ❌, in the lobby post.
   > <br/>
   > 🔒 replaces the commands '_!start_' and '_!f_start_'. Clicking it will start the lobby (if you are a coach) and create the teams.
   > If there are not enough players, the bot will post a list containing the available players.
   > You can only use this emoji when the lobby is supposed to start (or at a later time).
   > <br/>
   > ❌ replaces the command '_!undo_'. Clicking it will cancel the lobby.
   > <br/>
   > other commands:<br/>
   > '_!clear_': It could be used to remove all players from a lobby. That's not useful.
   > _!list_': It simply displayed a list of current players for a lobby. This is redundant because the lobby post contains such a list.
   > <br/>
3. Removed the following player commands: _!correct_', _!withdraw_', _!time_', _!status_'
   > _!correct_' and _!withdraw_' have already been replaced by emojis in the lobby post.
   > _!time_' can be inferred from looking at "Time to lobby.
   > _!status_' can be inferred by looking at the respective (pinned) lobby posts.

---

**DFZ-Bot v0.2 - Changelog**

1. Removed regions from **tryout** lobbies. <br/>

   > New command '_!post tryout &lt;time&gt;_', e.g. '_!post tryout 11:59pm Europe/London_'<br/>
   > The other lobby types are unaffected.<br/>

2. Changed behaviour of how time works with lobby creation<br/>
   > Now, if given time is in the past, it will simply create the lobby at the next day. <br/>
   > Example: Suppose it is 10:15pm in Berlin at the 22nd of october. You sit in Berlin and type '_!post tryout 10:00pm Europe/Berlin_'.<br/>
   > Because 10pm already in the past today, the bot will create a lobby for 10:00pm CET at the **23rd** of october, that is tomorrow.

---

**DFZ-Bot v0.1 - Changelog**

1. Added region to lobby posts.

   > The !post command now reads e.g. '_!post inhouse_ **_EU_** _1,2 10:00pm CET_' (type the region right after lobby-type)
   > 3 regions possible: EU, NA, SEA

2. Players from region get pushed up in a lobby.
   > Region refers to the region-role that player is assigned to (EU, NA, SEA). If he/she has multiple region-roles, the first one counts.<br/>
   > The idea is that players from the region have priority over other regions because of ping issues and suitable time-slots.<br/> > <br/>
   > Example 1: If an EU player is the 2nd player to join a SEA-lobby and a SEA-player joins as third, he will be 2nd instead and the EU player pushed to 3rd.<br/>
   > Example 2: If there are 12 player waiting in a SEA-lobby, 4 of which are EU and 8 are SEA, and another SEA-player joins, he/she will be placed at 9th position and the EU-players pushed backwards.<br/>
3. Lobby posts now automatically ping players<br/>
   > So far the mention only happens in the Embedding (the darker square in which the lobby-message is posted) - which does not trigger pinging the respective beginner-roles.<br/>
   > Now the bot will also mention them in the text above the embedding - which triggers the ping. So you no longer have to add a "pinging"-message when posting any lobby.
