require("dotenv").config()
const Discord = require("discord.js")
const fs = 		require("fs")
const client = new Discord.Client({autoReconnect:true});

const dB = require("./misc/database")

// setup discord event handlers
fs.readdir("./events/", (err, files) => { 
	files.forEach(file => {
		const eventHandler = require(`./events/${file}`)
		const eventName = file.split(".")[0]
		client.on(eventName, (...args) => eventHandler(client, ...args))
	})
})

// get db-access
client.dbHandle = dB.createPool()

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
.then(() => { // login to discord client
	return client.login(process.env.BOT_TOKEN);
}).catch(err => 
	console.log(err)
);