'use strict';

const { Collection } = require("discord.js");
const { getLocalisation: getText } = require("./LanguageHandler")
const { isAbsolute, normalize, resolve, extname, dirname } = require("path");
const { existsSync, statSync, readdirSync } = require("fs");
const { debug, warn, error, info } = require("./LoggingHandler");
const { CommandTypes, CommandRoles } = require("../types");
const { v4: uuidv4 } = require("uuid");

/**
 * A class that handles loading, registering and running slash commands.
 */
class CommandHandler {
    /**
     * Collection containing all commands.
     * @type {Collection<String, import("../types").Command>}
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
        if (!CommandHandler.#client) throw new Error(getText(undefined, ["generic", "errors", "noClient"]));
        // return if no dir to add
        if (!dir) return CommandHandler;
        debug(getText(CommandHandler.#client.consoleLang, ["handlers", "command", "debug", "addDirAttempt"], dir));
        // check path is absolute
        if (!isAbsolute(dir)) throw new Error(getText(CommandHandler.#client.consoleLang, ["generic", "errors", "path", "notAbsolute"], dir));
        // check path exists
        if (!existsSync(dir)) throw new Error(getText(CommandHandler.#client.consoleLang, ["generic", "errors", "path", "doesNotExist"], dir));
        // check path is a directory
        if (!statSync(dir).isDirectory()) throw new Error(getText(CommandHandler.#client.consoleLang, ["generic", "errors", "directory", "invalid"], dir));
        // add path to directories
        CommandHandler.#directories.push(normalize(dir));
        debug(getText(CommandHandler.#client.consoleLang, ["handlers", "command", "debug", "addedDir"], dir));
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
        if (!CommandHandler.#client) throw new Error(getText(undefined, ["generic", "errors", "noClient"]));
        // return if no dir to remove
        if (!dir) return CommandHandler;
        // return if dir not contained
        if (!this.#directories.includes(normalize(dir))) return CommandHandler;
        debug(getText(CommandHandler.#client.consoleLang, ["handlers", "command", "debug", "removeDirAttempt"], dir));
        // else remove the dir
        CommandHandler.#directories.splice(CommandHandler.#directories.indexOf(normalize(dir)), 1);
        debug(getText(CommandHandler.#client.consoleLang, ["handlers", "command", "debug", "removedDir"], dir));
        // return reference to CommandHandler
        return CommandHandler;
    }

    /**
     * Load all commands.
     * @returns {CommandHandler} A reference to the CommandHandler class.
     * @static
     * @example
     * // Load all commands in the directory "commands"
     * 
     * const { join } = require("path");
     * 
     * CommandHandler.addCommandDirectory(join(__dirname, "commands"));
     * CommandHandler.loadCommands();
     */
    static loadCommands() {
        // if no client attached
        if (!CommandHandler.#client) throw new Error(getText(undefined, ["generic", "errors", "noClient"]));
        
        debug(getText(CommandHandler.#client.consoleLang, ["handlers", "command", "debug", "loadingCommands"]));

        // reset commands
        CommandHandler.commands = new Collection();
        // test for directories that contain each other
        let overlapTest = CommandHandler.#directories.map(x => normalize(x));
        if (overlapTest.some((x, i, a) => a.some(y => y != x && y.includes(x)))) warn(getText(CommandHandler.#client.consoleLang, ["handlers", "command", "warn", "overlappingDirectories"]));
        // loop through directories
        for (const directory of CommandHandler.#directories) {
            debug(getText(CommandHandler.#client.consoleLang, ["handlers", "command", "debug", "loadingFromDirectory"], directory));
            // get folders within the directory
            let types = readdirSync(directory);
            // filter the folders to find the types of command folders
            types = types.filter(x => statSync(resolve(directory, x)).isDirectory()).map(x => x.toUpperCase()).filter(x => CommandTypes[x] !== undefined).map(x => CommandTypes[x]);
            // skip if none found
            if (!types.length) {
                debug(getText(CommandHandler.#client.consoleLang, ["handlers", "command", "debug", "noCommandsFound"], directory));
                continue;
            }
            // fancy message with info
            debug(getText(CommandHandler.#client.consoleLang, ["handlers", "command", "debug", types.includes(CommandTypes.GLOBAL) ? types.includes(CommandTypes.GUILD) ? "loadingFolderGlobalAndGuild" : "loadingFolderGlobal" : "loadingFolderGuild"]));
            // RIGHT THEN IT'S GO TIMEEEEEEEEEEEEE
            let toRegister = [];
            if (types.includes(CommandTypes.GLOBAL)) {
                // global commands dir
                let toSearch = resolve(directory, "global");
                // top level - solo commands and headers for subcommands
                let topLevelCommands = readdirSync(toSearch).map(x => resolve(toSearch, x)).filter(x => !statSync(x).isDirectory());
                // filter out non js files
                topLevelCommands = topLevelCommands.filter(x => extname(x) == ".js");
                // for each top level command
                for (const commandPath of topLevelCommands) {
                    try {
                        // delete cached files
                        delete require.cache[require.resolve(commandPath)];
                        /** @type {import("../types").Command} */
                        const command = require(commandPath);
                        // check for a command name
                        if (!command.name) {
                            warn(getText(CommandHandler.#client.consoleLang, ["handlers", "command", "warn", "noName"], commandPath));
                            continue;
                        }
                        // set the command's role (for subcommand structure)
                        if (!command.execute) command.role = CommandRoles.CONTAINER;
                        else command.role = CommandRoles.COMMAND;
                        // set description
                        if (!command.description) command.description = "No description set.";
                        // perms stuff
                        if (!command.botPerms) command.botPerms = [];
                        if (!command.userPerms) command.userPerms = [];
                        // check for options
                        if (!command.options) command.options = [];
                        // file path
                        command.filePath = commandPath;
                        // unique id (for structure calculation later)
                        command.id = uuidv4();
                        // add to commands to register
                        toRegister.push(command);
                        debug(getText(CommandHandler.#client.consoleLang, ["handlers", "command", "debug", "loadedTopLevelCommand"], command.name));
                    } catch (e) {
                        error(getText(CommandHandler.#client.consoleLang, ["handlers", "command", "error", "cannotLoad"], commandPath, e.stack));
                    }
                }
            }
            // guild specific commands
            if (types.includes(CommandTypes.GUILD)) {
                // directory to search
                let toSearch = resolve(directory, "guild");
                // each guild id (folder name)
                let guilds = readdirSync(toSearch);
                // for each guild id
                for (const g of guilds) {
                    // search for specific guild
                    let toSearch = resolve(directory, "guild", g);
                    // top level - solo commands and headers for subcommands
                    let topLevelCommands = readdirSync(toSearch).map(x => resolve(toSearch, x)).filter(x => !statSync(x).isDirectory());
                    // filter out non js files
                    topLevelCommands = topLevelCommands.filter(x => extname(x) == ".js");
                    // for each command path
                    for (const commandPath of topLevelCommands) {
                        try {
                            // delete cached files
                            delete require.cache[require.resolve(commandPath)];
                            /** @type {import("../types").Command} */
                            const command = require(commandPath);
                            // check for a command name
                            if (!command.name) {
                                warn(getText(CommandHandler.#client.consoleLang, ["handlers", "command", "warn", "noName"], commandPath));
                                continue;
                            }
                            // set the command's role (for subcommand structure)
                            if (!command.execute) command.role = CommandRoles.CONTAINER;
                            else command.role = CommandRoles.COMMAND;
                            // set description
                            if (!command.description) command.description = "No description set.";
                            // perms stuff
                            if (!command.botPerms) command.botPerms = [];
                            if (!command.userPerms) command.userPerms = [];
                            // check for options
                            if (!command.options) command.options = [];
                            // guild the command belongs to
                            command.guild = g;
                            // file path
                            command.filePath = commandPath;
                            // unique id (for structure calculation later)
                            command.id = uuidv4();
                            // add to commands to register
                            toRegister.push(command);
                            debug(getText(CommandHandler.#client.consoleLang, ["handlers", "command", "debug", "loadedTopLevelCommand"], command.name));
                        } catch (e) {
                            error(getText(CommandHandler.#client.consoleLang, ["handlers", "command", "error", "cannotLoad"], commandPath, e.stack));
                        }
                    }
                }
            }
            // subcommand finding time woo
            for (const command of toRegister) {
                // check for subcommand folder
                let subcommandDir = resolve(dirname(command.filePath), command.name);
                // if no subcommand folder
                if (!existsSync(subcommandDir)) {
                    // but there's supposed to be one
                    if (command.role == CommandRoles.CONTAINER) {
                        warn(getText(CommandHandler.#client.consoleLang, ["handlers", "command", "warn", "noExecute"], command.name));
                        toRegister = toRegister.filter(x => x.id != command.id);
                    }
                    continue;
                }
                // if the subcommand folder has an identity crisis
                if (!statSync(subcommandDir).isDirectory()) {
                    // but it's not meant to
                    if (command.role == CommandRoles.CONTAINER) {
                        warn(getText(CommandHandler.#client.consoleLang, ["handlers", "command", "warn", "folderIdentityCrisis"], subcommandDir, command.name));
                        toRegister = toRegister.filter(x => x.id != command.id);
                    }
                    continue;
                }
                // ok so there is actually a subcommand folder, find subcommands
                let subcommandFilePaths = readdirSync(subcommandDir).map(x => resolve(subcommandDir, x)).filter(x => !statSync(x).isDirectory()).filter(x => extname(x) == ".js");
                if (!subcommandFilePaths.length && command.role == CommandRoles.CONTAINER) {
                    // why did i bother to find the folder when there weren't any subcommands anyway
                    warn(getText(CommandHandler.#client.consoleLang, ["handlers", "command", "warn", "noSubcommands"], command.name));
                    toRegister = toRegister.filter(x => x.id != command.id);
                    continue;
                }
                // anyway load the subcommands
                for (const subcommandPath of subcommandFilePaths) {
                    try {
                        // delete cached files
                        delete require.cache[require.resolve(subcommandPath)];
                        /** @type {import("../types").Command} */
                        const subcommand = require(subcommandPath);
                        // check for a command name
                        if (!subcommand.name) {
                            warn(getText(CommandHandler.#client.consoleLang, ["handlers", "command", "warn", "noName"], subcommandPath));
                            continue;
                        }
                        // set the command's role (for subcommand structure)
                        subcommand.role = CommandRoles.SUBCOMMAND;
                        // set description
                        if (!subcommand.description) subcommand.description = "No description set.";
                        // perms stuff
                        if (!subcommand.botPerms) subcommand.botPerms = [];
                        if (!subcommand.userPerms) subcommand.userPerms = [];
                        // check for options
                        if (!subcommand.options) subcommand.options = [];
                        // file path
                        subcommand.filePath = subcommandPath;
                        // unique id (for structure calculation later)
                        subcommand.id = uuidv4();

                        // parent-child stuff for structure
                        subcommand.parent = command.id;
                        if (!command.children) command.children = [];
                        command.children.push(subcommand.id);

                        // add to commands to register
                        toRegister.push(subcommand);
                        debug(getText(CommandHandler.#client.consoleLang, ["handlers", "command", "debug", "loadedSubcommand"], command.name, subcommand.name));
                    } catch (e) {
                        error(getText(CommandHandler.#client.consoleLang, ["handlers", "command", "error", "cannotLoad"], subcommandPath, e.stack));
                    }
                }
            }
            // now actually register them
            toRegister.forEach(x => CommandHandler.commands.set(x.id, x));
        }
        info(getText(CommandHandler.#client.consoleLang, ["handlers", "command", "info", "loadedCommands"]));

        console.log(CommandHandler.commands);

        return CommandHandler;
    }
}

module.exports = CommandHandler;