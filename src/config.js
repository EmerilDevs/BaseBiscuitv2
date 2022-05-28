'use strict';

const { Intents } = require("discord.js");

const config = {
    "clientSettings": {
        "intents": [ Intents.FLAGS.GUILDS ]
    },
    "handlerSettings": {
        "logging": {
            "language": "en"
        }
    }
}

module.exports = config;