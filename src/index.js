'use strict';

require("dotenv").config();

const { Client } = require("discord.js");
// create the discord client using intents from the config file
const client = new Client({ intents: require("./config").clientSettings.intents });
// attach the full config file to the client
client.config = require('./config');
// load language handler
client.languageHandler = require("./handlers/LanguageHandler");
// shorthand stuff
client.consoleLang = client.config.handlerSettings.logging.language;
client.getText = client.languageHandler.getLocalisation;
// load the logger
client.logger = require("./handlers/LoggingHandler").createLogger(client);


client.once("ready", () => {
    client.logger.debug("Ready!");
});

client.login(process.env.TOKEN)