'use strict';

require("dotenv").config();

const { Client } = require("discord.js");
const { join } = require("path");

const client = new Client({ intents: require("./config").clientSettings.intents });
// attach the full config file to the client
client.config = require('./config');

client.languageHandler = require("./handlers/LanguageHandler");     // load language handler
client.languageHandler.addLanguageFolder(join(__dirname, "lang"));  // set language location
client.languageHandler.loadAllLanguages();                          // load all languages

// shorthand stuff
client.consoleLang = client.config.handlerSettings.logging.language;
client.getText = client.languageHandler.getLocalisation;

client.logger = require("./handlers/LoggingHandler").createLogger(client);  // load the logger

client.once("ready", () => {
    client.logger.debug("Ready!");
});

process.on("uncaughtException", e => {
    try {
        client.logger.error(e);
    } catch {
        console.error(e);
    }
});

client.login(process.env.TOKEN);