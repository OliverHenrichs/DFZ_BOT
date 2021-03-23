# DFZ_BOT
Discord-bot providing scheduling and planning of lobbies for coached inhouse-games.

# Setup
1. Setup a discord bot on your server. If you do not know how to, then google it.
2. Pull the repo.
3. Install dependencies using 'npm install' in the repo-folder. If you do not have npm, get npm.
4. Setup a mysql-database, create a user that has complete access to an empty db. Make sure your db runs on utf8mb4 because this bot also stores some emojis (see https://mathiasbynens.be/notes/mysql-utf8mb4#character-sets )
5. Provide an .env file containing the fields shown in .env.example (use Discord's developer mode to get all the IDs)
5.1 All 'IDs' represent discord IDs (of e.g. channels, server, roles, which you have to create/use on your server )
6. [Optional] If you want to use google-calendar, you have to provide a service-key to log into google's api (see https://cloud.google.com/iam/docs/understanding-service-accounts for a start). The service-key must be in the file service_key.json in this directory.
6.1 [Optional] The calendars are calendar urls - if you wish you can create google calendars, create a google service account and link that account up with your calendars.
7. Run the bot ('node index.js') (or with nodemon, forever, ...)

# Usage

1. Users: Coach and Player
1.1 Coaches correspond to users with the roles COACH and COACH_TRYOUT specified in the .env file.
	Coaches can join and leave scheduled events and can create/delete/start lobbies; A new schedule is automatically added every sunday for the coming week.
1.2 Players correspond to users with the roles TRYOUT, TIER 0, TIER_1, TIER_2, TIER_3, TIER_4 and TIER_grad specified in the .env file.
	Players can join and leave lobbies.
2. Bot listening behaviour:
	The bot listens to the channels specified by the channel IDs BOT_LOBBY_CHANNEL_1 to BOT_LOBBY_CHANNEL_5 corresponding to lobby channels as well as BOT_SCHEDULE_CHANNEL_TRYOUT and BOT_SCHEDULE_CHANNEL_5V5 which are scheduling channels
3. Scheduling: Every Sunday the bot will issue a new message into each Scheduling channel, outlining the upcoming week's scheduled lobbies. 
Coaches can join these schedules, which will 
3.1 create google calendar events in the respective calendars if they have been linked up
3.2 issue fitting lobbies 5 hours prior to each scheduled event
