'use strict';

require("dotenv").config();

const { Client } = require("discord.js");
// create the discord client using intents from the config file
const client = new Client({ intents: require("./config").clientSettings.intents });
// attach the full config file to the client
client.config = require('./config');
// load the logger
client.logger = require("./handlers/LoggingHandler").createLogger();

// if localisations are enabled, load language files


client.once("ready", () => {
    client.logger.debug("Ready!");
});

client.login(process.env.TOKEN)