'use strict';

/**
 * @typedef {0|1} CommandType
 */

/**
 * Enum for command types.
 * @readonly
 * @enum {number}
 */
const CommandTypes = {
    GLOBAL: 0,
    GUILD: 1
}
/**
 * @typedef {0|1|2|3} CommandRole
 */

/**
 * Enum for command roles.
 * @readonly
 * @enum {number}
 */
const CommandRoles = {
    COMMAND: 0,
    CONTAINER: 1,
    SUBCOMMAND: 2,
    SUBCOMMAND_CONTAINER: 3
}

/**
 * @typedef {0|1|2|3|4|5|6|7} CommandOptionType
 */

/**
 * Enum for command option types.
 * @readonly
 * @enum {number}
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
 * @typedef {Object} CommandOptionChoice
 * @property {String} name
 * @property {String|Number} value
 */

/**
 * @typedef {Object} CommandOption
 * @property {CommandOptionType} type
 * @property {String} name
 * @property {String} [description]
 * @property {boolean} [required]
 * @property {CommandOptionChoice[]} [choices]
 */

/**
 * @typedef {Function} CommandExecute
 * @param {import("discord.js").Interaction} interaction
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

/**
 * @typedef {Object} CommandLocalisationObject
 * @property {import("discord-api-types/v10").LocalizationMap} name
 * @property {import("discord-api-types/v10").LocalizationMap} description
 */

/**
 * @typedef {Object.<import("discord-api-types/v10").Locale, CommandLocalisationObject>} CommandOptionLocalisationObject
 */

/**
 * @typedef {Object} EventDebounceSettingsObject
 * @property {Number} time
 * @property {Boolean} [risingEdge=false]
 */

/**
 * @typedef {Object} EventSettingsObject
 * @property {EventDebounceSettingsObject} debounce
 */

/**
 * @typedef {Object} Event
 * @property {String} [name]
 * @property {String} event
 * @property {EventSettingsObject} settings
 * @property {Function} execute
 * @property {String} filePath
 */

module.exports = {
    CommandTypes,
    CommandRoles,
    CommandOptionTypes
}