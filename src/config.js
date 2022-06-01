'use strict';

const { Intents } = require("discord.js");

const config = {
    clientSettings: {
        intents: [ Intents.FLAGS.GUILDS ]
    },
    handlerSettings: {
        logging: {
            language: "en"
        }
    },
    presence: {
        activities: [
            {
                name: "at being a functional bot"
            }
        ],
        status: "online"
    },
    errorChannel: "123456789098765432",
    ownerIDs: [
        
    ]
}

module.exports = config;