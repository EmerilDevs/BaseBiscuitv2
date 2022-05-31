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
        status: "idle"
    },
    errorChannel: "719633133976420416",
    ownerIDs: [
        "543125133208846366"
    ]
}

module.exports = config;