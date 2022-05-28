'use strict';

const { Collection } = require("discord.js");
const LanguageHandler = require("./LanguageHandler")
const { isAbsolute, normalize } = require("path");
const { existsSync, statSync } = require("fs");

/**
 * A class that handles loading, registering and running slash commands.
 */
class CommandHandler {
    /**
     * Collection containing all commands.
     * @type {Collection}
     * @static
     */
    static commands = new Collection();

    /**
     * Filepaths to folders containing commands.
     * @type {String[]}
     * @static
     * @private
     */
    static #directories = [];
    
    /**
     * The Discord client the CommandHandler works with.
     * @type {import("discord.js").Client}
     * @static
     * @private
     */
    static #client;

    /**
     * Attach a client to the CommandHandler.
     * @param {import("discord.js").Client} client The Discord client to attach. 
     * @returns {CommandHandler} A reference to the CommandHandler class.
     * @static
     */
    static attachClient(client) {
        CommandHandler.#client = client;
        return CommandHandler;
    }

    /**
     * Add a directory to scan for commands.
     * @param {String} dir The absolute path of the directory to add.
     * @returns {CommandHandler} A reference to the CommandHandler class.
     * @static
     * @example
     * // Adds the directory "commands" to the command handler.
     * 
     * const { join } = require("path");
     * 
     * CommandHandler.addCommandDirectory(join(__dirname, "commands"));
     */
    static addCommandDirectory(dir) {
        // if no client attached
        if (!CommandHandler.#client) throw new Error(LanguageHandler.getLocalisation(undefined, ["generic", "errors", "noClient"]));
        // return if no dir to add
        if (!dir) return CommandHandler;
        CommandHandler.#client.logger.debug(LanguageHandler.getLocalisation(CommandHandler.#client.consoleLang, ["handlers", "command", "debug", "addDirAttempt"], dir));
        // check path is absolute
        if (!isAbsolute(dir)) throw new Error(LanguageHandler.getLocalisation(CommandHandler.#client.consoleLang, ["generic", "errors", "path", "notAbsolute"], dir));
        // check path exists
        if (!existsSync(dir)) throw new Error(LanguageHandler.getLocalisation(CommandHandler.#client.consoleLang, ["generic", "errors", "path", "doesNotExist"], dir));
        // check path is a directory
        if (!statSync(dir).isDirectory()) throw new Error(LanguageHandler.getLocalisation(CommandHandler.#client.consoleLang, ["generic", "errors", "directory", "invalid"], dir));
        // add path to directories
        CommandHandler.#directories.push(normalize(dir));
        CommandHandler.#client.logger.debug(LanguageHandler.getLocalisation(CommandHandler.#client.consoleLang, ["handlers", "command", "debug", "addedDir"]));
        // return reference to CommandHandler
        return CommandHandler;
    }

    /**
     * Remove a directory to scan for commands.
     * @param {String} dir The absolute path of the directory to remove.
     * @returns {CommandHandler} A reference to the CommandHandler class.
     * @static
     * @example
     * // Removes the directory "commands" from the command handler.
     * 
     * const { join } = require("path");
     * 
     * CommandHandler.removeCommandDirectory(join(__dirname, "commands"));
     */
    static removeCommandDirectory(dir) {
        // if no client attached
        if (!CommandHandler.#client) throw new Error(LanguageHandler.getLocalisation(undefined, ["generic", "errors", "noClient"]));
        // return if no dir to remove
        if (!dir) return CommandHandler;
        // return if dir not contained
        if (!this.#directories.includes(normalize(dir))) return CommandHandler;
        CommandHandler.#client.logger.debug(LanguageHandler.getLocalisation(CommandHandler.#client.consoleLang, ["handlers", "command", "debug", "removeDirAttempt"], dir));
        // else remove the dir
        CommandHandler.#directories.splice(CommandHandler.#directories.indexOf(normalize(dir)), 1);
        CommandHandler.#client.logger.debug(LanguageHandler.getLocalisation(CommandHandler.#client.consoleLang, ["handlers", "command", "debug", "removedDir"], dir));
        // return reference to CommandHandler
        return CommandHandler;
    }

    static generateStructure(guildID) {
        
    }
}

module.exports = CommandHandler;