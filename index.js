require("dotenv").config()
const Discord = require("discord.js")
const fs = require("fs")
const client = new Discord.Client({autoReconnect:true});


const serializer = require("./misc/serializeHelper")
const cM = require("./misc/channelManagement")
const lM = require("./misc/lobbyManagement")

// setup bot state
client._state = {};
client._state.lobbies = {};

// load bot state
if(!serializer.loadState(client, process.env.SAVEFILE))
{
	cM.botChannels.forEach(channel => {
		client._state.lobbies[channel] = {};
	});
} else {
	// in case a channel is missing, add it here
	cM.botChannels.forEach(channel => {
		if(client._state.lobbies[channel] === undefined)
			client._state.lobbies[channel] = {};
	});
}

// setup reading messages
fs.readdir("./events/", (err, files) => {
	files.forEach(file => {
		const eventHandler = require(`./events/${file}`)
		const eventName = file.split(".")[0]
		client.on(eventName, (...args) => eventHandler(client, ...args))
	})
})

// login
client.login(process.env.BOT_TOKEN).then(() => {
	// update lobby timers
	const timeUpdater = async () => {
		var guild = client.guilds.get(process.env.GUILD);
		if(guild === undefined || guild === null)
			return;
		lM.updateLobbyTimes(guild.channels, client._state.lobbies);
	};
	setInterval(timeUpdater, 60000);

	// update lobby post timer...
	const writer = () => {
		serializer.writeState(client._state, process.env.SAVEFILE)
	};
	setInterval(writer, 15000);
}).catch(error => {
	console.log (error);
});
