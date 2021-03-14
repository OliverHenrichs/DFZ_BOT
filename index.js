require("dotenv").config()
const Discord = require("discord.js")
const Website = require("./website/website");
const fs = 		require("fs")
var ws = {}
const client = new Discord.Client({autoReconnect:true});

const dB = require("./misc/database")
// get db-access
client.dbHandle = dB.createPool();
// client.dbHandle.dfz_debugMode = true;

// setup discord event handlers
fs.readdir("./events/", (err, files) => { 
	files.forEach(file => {
		const eventHandler = require(`./events/${file}`)
		const eventName = file.split(".")[0]
		client.on(eventName, (...args) => eventHandler(client, ...args))
	})
})


// setup-chain
dB.createScheduleTable(client.dbHandle)
.then(() => {
	return dB.createLobbyTable(client.dbHandle);
})
.then(() =>  {
	return dB.createOptionsTable(client.dbHandle);
})
.then(() =>  {
	return dB.createCoachTable(client.dbHandle);
})
.then(() =>  {
	return dB.createPlayerTable(client.dbHandle);
})
.then(() =>  {
	return dB.createReferrerTable(client.dbHandle);
})
.then(() => { // login to discord client
	return client.login(process.env.BOT_TOKEN);
})
.then(() => { // login to discord client
	ws = new Website(process.env.WEBSITE_PASSWD, client);
}).catch(err => 
	console.log(err)
);