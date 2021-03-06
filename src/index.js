'use strict';

require("dotenv").config();

// console interface
const readline = require('readline');
var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});
rl.on('line', async line => { 
    try {
        let eresult = eval(line);
        console.log(eresult);
    } catch(err) {
        console.error(err)
    }
});

const { Client } = require("discord.js");
const { join } = require("path");

const client = new Client({ intents: require("./config").clientSettings.intents });
// attach the full config file to the client
client.config = require('./config');
// attach the package to the client
client.pkg = require("../package.json");

client.languageHandler = require("./handlers/LanguageHandler");     // load language handler
client.languageHandler.addLanguageFolder(join(__dirname, "lang"));  // set language location
client.languageHandler.loadAllLanguages();                          // load all languages
client.languageHandler.defaultLanguage = "en";                      // use english if the correct language cannot be determined

// shorthand stuff
client.consoleLang = client.config.handlerSettings.logging.language;
client.getText = client.languageHandler.getLocalisation;

client.logger = require("./handlers/LoggingHandler").createLogger(client);  // load the logger

// load the command handler
client.commandHandler = require("./handlers/CommandHandler");
client.commandHandler.attachClient(client);                              // attach the client
client.commandHandler.addCommandDirectory(join(__dirname, "commands"));  // set the command file location
client.commandHandler.loadCommands();  // load commands

// load the event handler
client.eventHandler = require("./handlers/EventHandler");
client.eventHandler.attachClient(client);                          // attach the client
client.eventHandler.addEventDirectory(join(__dirname, "events"));  // set the event file location
client.eventHandler.loadEvents();  // load events

// load the database handler
client.databaseHandler = require("./handlers/DatabaseHandler");
client.databaseHandler.init(client, join(__dirname, "basebiscuitv2.sqlite"));  // attach client + setup

process.on("uncaughtException", e => {
    try {
        client.logger.error(e);
    } catch {
        console.error(e);
    }
});

client.login(process.env.TOKEN);