'use strict';

const { info } = require("../handlers/LoggingHandler");
const { getLocalisation: getText } = require("../handlers/LanguageHandler");

/** @type {import("../types").Event} */
module.exports = {
    name: "readyMessage",
    event: "shardReady",
    settings: {
        debounce: {
            time: 1000,
            risingEdge: true
        }
    },
    execute: client => {
        if (client.shard) {
            info(getText(client.consoleLang, ["events", "readyMessage", "messageShard"], client.pkg.name, client.shard, client.guilds?.cache?.size, client.channels?.cache?.size, client.guilds?.cache?.map(x => x?.memberCount).reduce((a, c) => a += c)));
        } else {
            info(getText(client.consoleLang, ["events", "readyMessage", "message"], client.pkg.name, client.guilds?.cache?.size, client.channels?.cache?.size, client.guilds?.cache?.map(x => x?.memberCount).reduce((a, c) => a += c)));
        }
        client.user.setPresence(client.config.presence);

        
    }
}