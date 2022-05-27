'use strict';

const { Intents } = require("discord.js");

const config = {
    "clientSettings": {
        "intents": [ Intents.FLAGS.GUILDS ]
    },
    "handlerSettings": {
        "language": {
            "useLocalisations": true,
            "fallbackLanguage": "en"
        }
    }
}

module.exports = config;