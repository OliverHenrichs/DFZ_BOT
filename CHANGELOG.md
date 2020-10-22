*@Coach The bot received some new features today!*

**DFZ-Bot v0.2 - Changelog**

1. Removed regions from tryout lobbies. 
> New command '*!post tryout <time>*', e.g. '*!post tryout 11:59pm Europe/London*'

2. Changed behaviour of how time works with lobby creation
> Now, if given time is in the past, it will simply create the lobby at the next day. 
> Example: Suppose it is 10:15pm in Berlin at the 22nd of october. You sit in Berlin and type '*!post tryout 10:00pm Europe/Berlin*'.
> Because 10pm already past today, the bot will create a lobby for 10:00pm CET at the **23rd** of october, that is tomorrow.

If you find bugs or have improvement suggestion, please either DM me or mention me in a post in #internal-talk.

==============================================================================================================================================================================================================================

**DFZ-Bot v0.1 - Changelog**

1. Added region to lobby posts
> The !post command now reads e.g. '*!post inhouse* ***EU*** *1,2 10:00pm CET*' (type the region right after lobby-type)
> 3 regions possible: EU, NA, SEA
    
2. Players from region get pushed up in a lobby.
> Region refers to the region-role that player is assigned to (EU, NA, SEA). If he/she has multiple region-roles, the first one counts.
> The idea is that players from the region have priority over other regions because of ping issues and suitable time-slots.
> 
> Example 1: If an EU player is the 2nd player to join a SEA-lobby and a SEA-player joins as third, he will be 2nd instead and the EU player pushed to 3rd.
> Example 2: If there are 12 player waiting in a SEA-lobby, 4 of which are EU and 8 are SEA, and another SEA-player joins, he/she will be placed at 9th position and the EU-players pushed backwards.
    
3. Lobby posts now automatically ping players
> So far the mention only happens in the Embedding (the darker square in which the lobby-message is posted) - which does not trigger pinging the respective beginner-roles.
> Now the bot will also mention them in the text above the embedding - which triggers the ping. So you no longer have to add a "pinging"-message when posting any lobby.

==============================================================================================================================================================================================================================

**DFZ-Bot v0.2 - Changelog**

1. Removed regions from **tryout** lobbies. 
> New command '*!post tryout <time>*', e.g. '*!post tryout 11:59pm Europe/London*'
> The other lobby types are unaffected

2. Changed behaviour of how time works with lobby creation
> Now, if given time is in the past, it will simply create the lobby at the next day. 
> Example: Suppose it is 10:15pm in Berlin at the 22nd of october. You sit in Berlin and type '*!post tryout 10:00pm Europe/Berlin*'.
> Because 10pm already in the past today, the bot will create a lobby for 10:00pm CET at the **23rd** of october, that is tomorrow.

==============================================================================================================================================================================================================================