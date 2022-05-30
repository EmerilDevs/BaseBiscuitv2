'use strict';

const { Collection } = require("discord.js");
const { SlashCommandBuilder, SlashCommandSubcommandGroupBuilder, SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const { getLocalisation: getText, getCommandLocalisations, getCommandOptionLocalisations } = require("./LanguageHandler")
const { isAbsolute, normalize, resolve, extname, dirname, basename } = require("path");
const { existsSync, statSync, readdirSync } = require("fs");
const { debug, warn, error, info } = require("./LoggingHandler");
const { CommandTypes, CommandRoles, CommandOptionTypes } = require("../types");
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
                            debug(getText(CommandHandler.#client.consoleLang, ["handlers", "command", "debug", "loadedTopLevelCommandGuild"], command.name, command.guild));
                        } catch (e) {
                            error(getText(CommandHandler.#client.consoleLang, ["handlers", "command", "error", "cannotLoad"], commandPath, e.stack));
                        }
                    }
                }
            }
            // subcommand finding time woo
            let commandsToSearch = [...toRegister];
            for (const command of commandsToSearch) {
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
                // subcommand groups are a thing but no one really cares about them
                if (subcommandFilePaths.some(x => /^group\./g.test(basename(x)))) {
                    // oh ok nvm someone cares about them
                    let groupDefininitionPaths = subcommandFilePaths.filter(x => /^group\./g.test(basename(x)));
                    // for each definition
                    for (const groupPath of groupDefininitionPaths) {
                        try {
                            // delete cached files
                            delete require.cache[require.resolve(groupPath)];
                            // import the group thing
                            /** @type {import("../types").Command} */
                            const groupDefinition = require(groupPath);
                            // ignore if no name
                            if (!groupDefinition.name) {
                                warn(getText(CommandHandler.#client.consoleLang, ["handlers", "command", "warn", "noName"], groupPath));
                                continue;
                            }
                            // check for description
                            if (!groupDefinition.description) groupDefinition.description = "No description set.";
                            // link file path
                            groupDefinition.filePath = groupPath;
                            // assign a unique id
                            groupDefinition.id = uuidv4();
                            // set the role
                            groupDefinition.role = CommandRoles.SUBCOMMAND_CONTAINER;
                            // parent-child stuff
                            groupDefinition.parent = command.id;
                            if (!command.chilren) command.children = [];
                            command.children.push(groupDefinition.id);
                            // add to register list
                            toRegister.push(groupDefinition);
                            debug(getText(CommandHandler.#client.consoleLang, ["handlers", "command", "debug", "loadedGroupDefinition"], command.name, groupDefinition.name));
                        } catch (e) {
                            error(getText(CommandHandler.#client.consoleLang, ["handlers", "command", "error", "cannotLoad"], groupPath, e.stack));
                        }
                    }
                }

                // remove any subcommand group definitions from the list of subcommands
                subcommandFilePaths = subcommandFilePaths.filter(x => !/^group\./g.test(basename(x)));
                // test for paths with the 3 dot thing grouped subcommands need
                if (subcommandFilePaths.some(x => /(?<!^group)\.[^.]+\.[^.]+/g.test(basename(x)))) {
                    let groupedSubcommandFilePaths = subcommandFilePaths.filter(x => /(?<!^group)\.[^.]+\.[^.]+/g.test(basename(x)));
                    for (const groupedSubcommandPath of groupedSubcommandFilePaths) {
                        // get subcommand group name
                        let group = basename(groupedSubcommandPath).split(".")[0];
                        // ensure the group exists
                        if (!toRegister.find(x => x.role == CommandRoles.SUBCOMMAND_CONTAINER && x.name == group)) {
                            warn(getText(CommandHandler.#client.consoleLang, ["handlers", "command", "warn", "cannotFindGroup"], groupedSubcommandPath, group));
                            continue;
                        }
                        // right then actually load the thing
                        try {
                            // delete cached files
                            delete require.cache[require.resolve(groupedSubcommandPath)];
                            // importtttttttttttt
                            /** @type {import("../types").Command} */
                            const groupedSubcommand = require(groupedSubcommandPath);
                            // check for name
                            if (!groupedSubcommand.name)  {
                                warn(getText(CommandHandler.#client.consoleLang, ["handlers", "command", "warn", "noName"], groupedSubcommandPath));
                                continue;
                            }
                            // set the command's role (for subcommand structure)
                            groupedSubcommand.role = CommandRoles.SUBCOMMAND;
                            // set description
                            if (!groupedSubcommand.description) groupedSubcommand.description = "No description set.";
                            // perms stuff
                            if (!groupedSubcommand.botPerms) groupedSubcommand.botPerms = [];
                            if (!groupedSubcommand.userPerms) groupedSubcommand.userPerms = [];
                            // check for options
                            if (!groupedSubcommand.options) groupedSubcommand.options = [];
                            // file path
                            groupedSubcommand.filePath = groupedSubcommandPath;
                            // unique id (for structure calculation later)
                            groupedSubcommand.id = uuidv4();

                            // parent-child stuff
                            /** @type {import("../types").Command} */
                            let parent = toRegister.find(x => x.role == CommandRoles.SUBCOMMAND_CONTAINER && x.name == group);
                            groupedSubcommand.parent == parent.id;
                            if (!parent.children) parent.children = [];
                            parent.children.push(groupedSubcommand.id);

                            // add to register list
                            toRegister.push(groupedSubcommand);
                            debug(getText(CommandHandler.#client.consoleLang, ["handlers", "command", "debug", "loadedGroupedCommand"], command.name, parent.name, groupedSubcommand.name));
                        } catch (e) {
                            error(getText(CommandHandler.#client.consoleLang, ["handlers", "command", "error", "cannotLoad"], groupedSubcommandPath, e.stack));
                        }
                    }
                }

                // remove grouped commands from the list of subcommands
                subcommandFilePaths = subcommandFilePaths.filter(x => !/(?<!^group)\.[^.]+\.[^.]+/g.test(basename(x)));

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

        return CommandHandler;
    }

    /**
     * Generate the command structure in order to register commands with Discord.
     * @param {import("discord.js").Snowflake=} guildID The ID of the guild to generate a structure for.
     * @returns {import("discord-api-types/v10").RESTPostAPIApplicationCommandsJSONBody} The structure.
     * @static
     */
    static generateStructure(guildID) {
        // if no client attached
        if (!CommandHandler.#client) throw new Error(getText(undefined, ["generic", "errors", "noClient"]));

        // get commands to generate structure for
        let commandsToUse = guildID ? CommandHandler.commands.filter(x => x.guild == guildID) : CommandHandler.commands.filter(x => !x.guild);
        // return if no commands to generate structure for
        if (!commandsToUse.size) return [];
        // output array
        let structure = [];
        // get top level commands
        let topLevel = commandsToUse.filter(x => x.role == CommandRoles.COMMAND || x.role == CommandRoles.CONTAINER);
        // generate each command
        topLevel.forEach(command => {
            // set basic command info
            let toPush = new SlashCommandBuilder()
                .setName(command.name)
                .setDescription(command.name)
                .setNameLocalizations(getCommandLocalisations(command).name)
                .setDescriptionLocalizations(getCommandLocalisations(command).description);
            // set options
            if (command.options?.length) {
                // for each option
                command.options.forEach(option => {
                    // determine the option type + the function to use
                    switch (option.type) {
                        case CommandOptionTypes.STRING:
                        case CommandOptionTypes.INTEGER:
                        case CommandOptionTypes.NUMBER:
                            toPush[`add${Object.keys(CommandOptionTypes)[option.type].charAt(0) + Object.keys(CommandOptionTypes)[option.type].slice(1).toLowerCase()}Option`](
                                // actually add the option
                                x => {
                                    x.setName(option.name)
                                    .setDescription(option.description)
                                    .setRequired(option.required)
                                    .setNameLocalizations(getCommandOptionLocalisations(command)[option.name]?.name || {})
                                    .setDescriptionLocalizations(getCommandOptionLocalisations(command)[option.name]?.description || {});
                                    if (option.choices?.length) x.setChoices(...option.choices);
                                    return x;
                                }
                            );
                            break;
                        default:
                            toPush[`add${Object.keys(CommandOptionTypes)[option.type].charAt(0) + Object.keys(CommandOptionTypes)[option.type].slice(1).toLowerCase()}Option`](
                                // actually add the option
                                x => x.setName(option.name).setDescription(option.description).setRequired(option.required)
                            );
                    }
                });
            }
            // deal with children
            if (command.children?.length) {
                for (const childID of command.children) {
                    // find the child object
                    let child = CommandHandler.commands.find(x => x.id == childID);
                    // ignore if there is no child
                    if (!child) continue;
                    // else determine type
                    switch (child.role) {
                        case CommandRoles.SUBCOMMAND: // (normal subcommand)
                            // set basic command info
                            let subcommand = new SlashCommandSubcommandBuilder()
                                .setName(child.name)
                                .setDescription(child.description)
                                .setNameLocalizations(getCommandLocalisations(child).name)
                                .setDescriptionLocalizations(getCommandLocalisations(child).description);
                            // set options
                            if (child.options?.length) {
                                // for each option
                                child.options.forEach(option => {
                                    // determine the option type + the function to use
                                    switch (option.type) {
                                        case CommandOptionTypes.STRING:
                                        case CommandOptionTypes.INTEGER:
                                        case CommandOptionTypes.NUMBER:
                                            subcommand[`add${Object.keys(CommandOptionTypes)[option.type].charAt(0) + Object.keys(CommandOptionTypes)[option.type].slice(1).toLowerCase()}Option`](
                                                // actually add the option
                                                x => {
                                                    x.setName(option.name)
                                                    .setDescription(option.description)
                                                    .setRequired(option.required)
                                                    .setNameLocalizations(getCommandOptionLocalisations(child)[option.name]?.name || {})
                                                    .setDescriptionLocalizations(getCommandOptionLocalisations(child)[option.name]?.description || {});
                                                    if (option.choices?.length) x.setChoices(...option.choices);
                                                    return x;
                                                }
                                            );
                                            break;
                                        default:
                                            subcommand[`add${Object.keys(CommandOptionTypes)[option.type].charAt(0) + Object.keys(CommandOptionTypes)[option.type].slice(1).toLowerCase()}Option`](
                                                // actually add the option
                                                x => x.setName(option.name).setDescription(option.description).setRequired(option.required)
                                            );
                                    }
                                });
                            }
                            // add the subcommand to the command
                            toPush.addSubcommand(subcommand);
                            break;
                        case CommandRoles.SUBCOMMAND_CONTAINER: // (subcommand group def)
                            // set basic info
                            let subcommandGroup = new SlashCommandSubcommandGroupBuilder()
                                .setName(child.name)
                                .setDescription(child.description)
                                .setNameLocalizations(getCommandLocalisations(child).name)
                                .setDescriptionLocalizations(getCommandLocalisations(child).description);
                            // ignore if empty group
                            if (!child.children?.length) continue;
                            for (const childChildID of child.children) {
                                // get the child child
                                let childChild = CommandHandler.commands.find(x => x.id == childChildID);
                                // ignore if child child does not exist
                                if (!childChild) continue;
                                // set basic command info
                                let subcommand = new SlashCommandSubcommandBuilder()
                                    .setName(childChild.name)
                                    .setDescription(childChild.description)
                                    .setNameLocalizations(getCommandLocalisations(childChild).name)
                                    .setDescriptionLocalizations(getCommandLocalisations(childChild).description);
                                // set options
                                if (childChild.options?.length) {
                                    // for each option
                                    childChild.options.forEach(option => {
                                        // determine the option type + the function to use
                                    switch (option.type) {
                                        case CommandOptionTypes.STRING:
                                        case CommandOptionTypes.INTEGER:
                                        case CommandOptionTypes.NUMBER:
                                            subcommand[`add${Object.keys(CommandOptionTypes)[option.type].charAt(0) + Object.keys(CommandOptionTypes)[option.type].slice(1).toLowerCase()}Option`](
                                                // actually add the option
                                                x => {
                                                    x.setName(option.name)
                                                    .setDescription(option.description)
                                                    .setRequired(option.required)
                                                    .setNameLocalizations(getCommandOptionLocalisations(childChild)[option.name]?.name || {})
                                                    .setDescriptionLocalizations(getCommandOptionLocalisations(childChild)[option.name]?.description || {});
                                                    if (option.choices?.length) x.setChoices(...option.choices);
                                                    return x;
                                                }
                                            );
                                            break;
                                        default:
                                            subcommand[`add${Object.keys(CommandOptionTypes)[option.type].charAt(0) + Object.keys(CommandOptionTypes)[option.type].slice(1).toLowerCase()}Option`](
                                                // actually add the option
                                                x => x.setName(option.name).setDescription(option.description).setRequired(option.required)
                                            );
                                    }
                                    });
                                }
                                // add to subcommand group
                                subcommandGroup.addSubcommand(subcommand);
                            }
                            // add subcommand group to command
                            toPush.addSubcommandGroup(subcommandGroup);
                            break;
                        default:
                            warn(getText(CommandHandler.#client.consoleLang, ["handlers", "command", "warn", "invalidRole"], command.name, child.name, child.role));
                            continue;
                    }
                }
            }
            // push command to structure
            structure.push(toPush);
        });

        // convert structure to JSON
        structure = structure.map(x => x.toJSON());

        return structure;
    }
}

module.exports = CommandHandler;