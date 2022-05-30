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
    }
}

module.exports = config;