'use strict';

const { Interaction } = require("discord.js");

/**
 * @typedef {0|1} CommandType
 */

/**
 * @typedef {Object} CommandTypes
 * @property {0} GLOBAL
 * @property {1} GUILD
 */
const CommandTypes = {
    GLOBAL: 0,
    GUILD: 1
}
/**
 * @typedef {0|1|2} CommandRole
 */

/**
 * @typedef {Object} CommandRoles
 * @property {0} COMMAND
 * @property {1} CONTAINER
 * @property {2} SUBCOMMAND
 */
const CommandRoles = {
    COMMAND: 0,
    CONTAINER: 1,
    SUBCOMMAND: 2
}

/**
 * @typedef {0|1|2|3|4|5|6|7} CommandOptionType
 */

/**
 * @typedef {Object} CommandOptionTypes
 * @property {0} BOOLEAN
 * @property {1} CHANNEL
 * @property {2} INTEGER
 * @property {3} MENTIONABLE
 * @property {4} NUMBER
 * @property {5} ROLE
 * @property {6} STRING
 * @property {7} USER
 */
const CommandOptionTypes = {
    BOOLEAN: 0,
    CHANNEL: 1,
    INTEGER: 2,
    MENTIONABLE: 3,
    NUMBER: 4,
    ROLE: 5,
    STRING: 6,
    USER: 7
}

/**
 * @typedef {Object} CommandOption
 * @property {CommandOptionType} type
 * @property {String} name
 * @property {String} [description]
 * @property {boolean} [required]
 */

/**
 * @typedef {Function} CommandExecute
 * @param {Interaction} interaction
 */

/**
 * @typedef {Object} Command
 * @property {String} id
 * @property {String} name
 * @property {CommandRole} role
 * @property {CommandExecute} [execute]
 * @property {String} [description]
 * @property {CommandOption[]} [options]
 * @property {String[]} [botPerms]
 * @property {String[]} [userPerms]
 * @property {String} [guild]
 * @property {String} [filePath]
 * @property {String} [parent]
 * @property {String[]} [children]
 */

module.exports = {
    CommandTypes,
    CommandRoles,
    CommandOptionTypes
}