'use strict';

const { writeFileSync, readFileSync, existsSync } = require("fs");
const { generateStructure, commands } = require("../handlers/CommandHandler");
const { info, error} = require("../handlers/LoggingHandler");
const { getLocalisation: getText } = require("../handlers/LanguageHandler");
const { join } = require("path");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v10");

/** @type {import("../types").Event} */
module.exports = {
    name: "registerCommands",
    event: "shardReady",
    settings: {
        debounce: {
            time: 1000,
            risingEdge: true
        }
    },
    execute: async client => {
        // check current command structure against last synced command structure
        // global
        if (!existsSync(join(__dirname, "../cache/globalStructure.json")) || readFileSync(join(__dirname, "../cache/globalStructure.json"), "utf-8") != JSON.stringify(generateStructure())) {
            // commands have been updated, re-register them
            const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
            try {
                info(getText(client.consoleLocale, ["events", "registerCommands", "info", "registeringGlobalCommandStructure"]));
                await rest.put(Routes.applicationCommands(client.user.id), { body: generateStructure() });
                info(getText(client.consoleLocale, ["events", "registerCommands", "info", "registeredGlobalCommandStructure"]));
            } catch (e) {
                error(getText(client.consoleLocale, ["events", "registerCommands", "error", "cannotRegister"], e.stack));
            }
        }
        // record current global command structure
        writeFileSync(join(__dirname, "../cache/globalStructure.json"), JSON.stringify(generateStructure()), { flag: "w+", encoding: "utf-8" });

        // guild
        for (const guildID of [...new Set(commands.filter(x => x.guild).map(x => x.guild))]) {
            if (!existsSync(join(__dirname, `../cache/structure-${guildID}.json`)) || readFileSync(join(__dirname, `../cache/structure-${guildID}.json`), "utf-8") != JSON.stringify(generateStructure(guildID))) {
                // commands have been updated, re-register them
                const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
                try {
                    info(getText(client.consoleLocale, ["events", "registerCommands", "info", "registeringGuildCommandStructure"], guildID));
                    await rest.put(Routes.applicationGuildCommands(client.user.id, guildID), { body: generateStructure(guildID) });
                    info(getText(client.consoleLocale, ["events", "registerCommands", "info", "registeredGuildCommandStructure"], guildID));
                } catch (e) {
                    error(getText(client.consoleLocale, ["events", "registerCommands", "error", "cannotRegisterGuild"], guildID, e.stack));
                }
            }
            // record current guild command structure
            writeFileSync(join(__dirname, `../cache/structure-${guildID}.json`), JSON.stringify(generateStructure(guildID)), { flag: "w+", encoding: "utf-8" });
        }
    }
}