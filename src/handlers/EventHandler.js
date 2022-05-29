'use strict';

/** Class that handles Discord events. */
class EventHandler {
    /**
     * Filepaths to directories containing event handlers.
     * @type {String[]}
     * @static
     * @privates
     */
    static #directories;

    static #eventEmitter;
    
    /**
     * The Discord client the CommandHandler works with.
     * @type {import("discord.js").Client}
     * @static
     * @private
     */
     static #client;

    static attachClient(client) {

    }
}