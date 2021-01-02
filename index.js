require("dotenv").config()
const Discord = require("discord.js")
const fs = 		require("fs")
const client = new Discord.Client({autoReconnect:true});

const lM = require("./misc/lobbyManagement")
const sM = require("./misc/scheduleManagement")
const dB = require("./misc/dataBase")

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
.then(function(connection) { // add / find tables in db
	client.dbHandle = connection;
	return dB.createScheduleTable(connection);
}).then(() => {
	return dB.createLobbyTable(client.dbHandle);
}).then(() => {
	return dB.createOptionsTable(client.dbHandle);
}).then(() => { // login to discord client
	return client.login(process.env.BOT_TOKEN);
}).then(() => new Promise(function(resolve, reject) { // setup intervals
	// update lobby posts
	const timeUpdater = async () => {
		var guild = client.guilds.get(process.env.GUILD);
		if(guild === undefined || guild === null)
			return;
		lM.updateLobbyTimes(guild.channels, client.dbHandle);
	};
	setInterval(timeUpdater, 60000); // once per minute

	// update lobby schedule 
	const scheduleWriter = async () => {
		
		var guild = client.guilds.get(process.env.GUILD);
		if(guild === undefined || guild === null)
			return;
		sM.updateSchedules(client.dbHandle, guild.channels);
	}
	scheduleWriter();
	setInterval(scheduleWriter, 60000);//60*60000); // once per hour

	resolve("Interval tasks set");
})).catch(err => 
	console.log(err)
);