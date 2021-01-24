require("dotenv").config()
const Discord = require("discord.js")
const fs = 		require("fs")
const client = new Discord.Client({autoReconnect:true});

const lM = require("./misc/lobbyManagement")
const sM = require("./misc/scheduleManagement")
const dB = require("./misc/database")

// setup discord event handlers
fs.readdir("./events/", (err, files) => { 
	files.forEach(file => {
		const eventHandler = require(`./events/${file}`)
		const eventName = file.split(".")[0]
		client.on(eventName, (...args) => eventHandler(client, ...args))
	})
})

// setup-chain
dB.getDBHandle()// get db-access
.then((connection) => new Promise(function(resolve, reject) { // setup intervalsfunction(connection) { // add / find tables in db
	client.dbHandle = connection;
	console.log("Successfully connected to MySql-db!")
	dB.createScheduleTable(connection)
	.then(()=> resolve());
}))
.then(() => {
	return dB.createLobbyTable(client.dbHandle)
})
.then(() =>  {
	return dB.createOptionsTable(client.dbHandle)
})
.then(() =>  {
	return dB.createCoachTable(client.dbHandle)
})
.then(() => { // login to discord client
	return client.login(process.env.BOT_TOKEN); 
}).then(() => new Promise(async function(resolve, reject) { // setup intervals
	console.log("Successfully logged into Discord client!")
	// update lobby posts
	const timeUpdater = async () => {
		var guild = client.guilds.get(process.env.GUILD);
		if(guild === undefined || guild === null)
			return;
		lM.updateLobbyTimes(guild.channels, client.dbHandle);
	};
	lM.updateLobbyTimes(client.guilds.get(process.env.GUILD).channels, client.dbHandle);
	setInterval(timeUpdater, 60000); // once per minute

	// update lobby schedule 
	const scheduleWriter = async () => {
		
		var guild = client.guilds.get(process.env.GUILD);
		if(guild === undefined || guild === null)
			return;
		sM.updateSchedules(client.dbHandle, guild.channels);
	}
	await scheduleWriter();
	
	setInterval(scheduleWriter, 60*60000); // once per hour

	// post lobbies from schedule
	const lobbyPoster = async () => {
		var guild = client.guilds.get(process.env.GUILD);
		if(guild === undefined || guild === null)
			return;
		await sM.insertScheduledLobbies(guild.channels, client.dbHandle)
	}
	await lobbyPoster();
	setInterval(lobbyPoster, 60*60000); // once per hour

	resolve("Interval tasks set");
})).catch(err => 
	console.log(err)
);