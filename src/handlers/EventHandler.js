'use strict';

const { debug, warn, error, info } = require("./LoggingHandler");
const { getLocalisation: getText } = require("./LanguageHandler");
const { isAbsolute, normalize } = require("path");
const { existsSync, statSync } = require("fs");
const { walk, arrayToConsoleList } = require("../util");
const { EventEmitter } = require("events");
const debounce = require("debounce");

/** Class that handles Discord events. */
class EventHandler {
    /**
     * Filepaths to directories containing event handlers.
     * @type {String[]}
     * @static
     * @private
     */
    static #directories = [];

    /**
     * Event emitter to emit events
     * @type {EventEmitter}
     * @static
     * @private
     */
    static #eventEmitter = new EventEmitter();
    
    /**
     * The Discord client the CommandHandler works with.
     * @type {import("discord.js").Client}
     * @static
     * @private
     */
     static #client;

    /**
     * Attach a client to the EventHandler.
     * @param {import("discord.js").Client} client The Discord client to attach. 
     * @returns {EventHandler} A reference to the EventHandler class.
     * @static
     */
     static attachClient(client) {
        EventHandler.#client = client;
        return EventHandler;
    }

    /**
     * Add a directory to scan for events.
     * @param {String} dir The absolute path of the directory to add.
     * @returns {EventHandler} A reference to the CommandHandler class.
     * @static
     * @example
     * // Adds the directory "events" to the event handler.
     * 
     * const { join } = require("path");
     * 
     * EventHandler.addEventDirectory(join(__dirname, "events"));
     */
    static addEventDirectory(dir) {
        // if no client attached
        if (!EventHandler.#client) throw new Error(getText(undefined, ["generic", "errors", "noClient"]));
        // return if no dir to add
        if (!dir) return EventHandler;
        debug(getText(EventHandler.#client.consoleLang, ["handlers", "event", "debug", "addDirAttempt"], dir));
        // check path is absolute
        if (!isAbsolute(dir)) throw new Error(getText(EventHandler.#client.consoleLang, ["generic", "errors", "path", "notAbsolute"], dir));
        // check path exists
        if (!existsSync(dir)) throw new Error(getText(EventHandler.#client.consoleLang, ["generic", "errors", "path", "doesNotExist"], dir));
        // check path is a directory
        if (!statSync(dir).isDirectory()) throw new Error(getText(EventHandler.#client.consoleLang, ["generic", "errors", "directory", "invalid"], dir));
        // add path to directories
        EventHandler.#directories.push(normalize(dir));
        debug(getText(EventHandler.#client.consoleLang, ["handlers", "command", "debug", "addedDir"], dir));
        // return reference to EventHandler
        return EventHandler;
    }

    /**
     * Remove a directory to scan for events.
     * @param {String} dir The absolute path of the directory to remove.
     * @returns {EventHandler} A reference to the EventHandler class.
     * @static
     * @example
     * // Removes the directory "events" from the event handler.
     * 
     * const { join } = require("path");
     * 
     * EventHandler.removeEventDirectory(join(__dirname, "events"));
     */
    static removeEventDirectory(dir) {
        // if no client attached
        if (!EventHandler.#client) throw new Error(getText(undefined, ["generic", "errors", "noClient"]));
        // return if no dir to remove
        if (!dir) return EventHandler;
        // return if dir not contained
        if (!this.#directories.includes(normalize(dir))) return EventHandler;
        // else remove the dir
        EventHandler.#directories.splice(EventHandler.#directories.indexOf(normalize(dir)), 1);
        debug(getText(EventHandler.#client.consoleLang, ["handlers", "event", "debug", "removedDir"], dir));
        // return reference to EventHandler
        return EventHandler;
    }

    /**
     * Load all events.
     * @returns {EventHandler} A reference to the EventHandler class.
     * @static
     * @example
     * // Load all events in the directory "events"
     * 
     * const { join } = require("path");
     * 
     * EventHandler.addEventDirectory(join(__dirname, "events"));
     * EventHandler.loadEvents();
     */
    static loadEvents() {
        // if no client attached
        if (!EventHandler.#client) throw new Error(getText(undefined, ["generic", "errors", "noClient"]));

        debug(getText(EventHandler.#client.consoleLang, ["handlers", "event", "debug", "loadingEvents"]));
        // test for directories that contain each other
        let overlapTest = this.#directories.map(x => normalize(x));
        if (overlapTest.some((x, i, a) => a.some(y => y != x && y.includes(x)))) warn(getText(EventHandler.#client.consoleLang, ["handlers", "event", "warn", "overlappingDirectories"]));
        // remove existing event listeners
        EventHandler.#client.removeAllListeners();
        EventHandler.#eventEmitter.removeAllListeners();
        debug(getText(EventHandler.#client.consoleLang, ["handlers", "event", "debug", "removedListeners"]));
        // loop through directories
        for (const directory of EventHandler.#directories) {
            debug(getText(EventHandler.#client.consoleLang, ["handlers", "event", "debug", "loadingFromDirectory"], directory));
            // get all js files within the directory
            const filePaths = walk(directory, "js");
            // continue if no files found
            if (!filePaths.length) {
                debug(getText(EventHandler.#client.consoleLang, ["handlers", "event", "debug", "noEventsFound"], ));
                continue;
            }
            debug(getText(EventHandler.#client.consoleLang, ["generic", "debug", "loading", "newLine"], arrayToConsoleList(filePaths.map(x => x.replace(/\\/g, "/")), "\t")));
            // array of events to register
            let toRegister = [];
            // for each file path
            for (const filePath of filePaths) {
                try {
                    // delete cached files
                    delete require.cache[require.resolve(filePath)];
                    // importtttttttt
                    /** @type {import("../types").Event} */
                    const event = require(filePath);
                    // check for an event name
                    if (!event.event) {
                        warn(getText(EventHandler.#client.consoleLang, ["handlers", "event", "warn", "noEvent"], event.name || filePath));
                        continue;
                    }
                    // check for a funtion
                    if (!event.execute) {
                        warn(getText(EventHandler.#client.consoleLang, ["handlers", "event", "warn", "noExecute"], event.name || filePath));
                        continue;
                    }
                    // check for a name
                    if (!event.name) {
                        warn(getText(EventHandler.#client.consoleLang, ["handlers", "event", "warn", "noName"]));
                    }
                    // attach the filepath
                    event.filePath = filePath;
                    // push to register list
                    toRegister.push(event);
                } catch (e) {
                    error(getText(EventHandler.#client.consoleLang, ["handlers", "event", "error", "cannotLoad"], filePath, e.stack));
                }
            }
            // check for events with duplicate names
            let duplicates = toRegister.map(x => x.name).map((x, i, f) => f.indexOf(x) !== i && i).filter(x => toRegister[x]).map(x => toRegister[x].name);
            if (duplicates.length) {
                // warn about and remove duplicates
                duplicates.forEach(x => {
                    warn(getText(EventHandler.#client.consoleLang, ["handlers", "event", "warn", "duplicateEvents"], x, arrayToConsoleList(toRegister.filter(y => y.name == x).map(y => y.filePath), "\t")));
                    toRegister = toRegister.filter(y => y.name != x);
                });
            }

            // register event timeeeeee
            if (toRegister.length == 1) debug(getText(EventHandler.#client.consoleLang, ["handlers", "event", "debug", "registeringEvent"], toRegister.length));
            else debug(getText(EventHandler.#client.consoleLang, ["handlers", "event", "debug", "registeringEvents"], toRegister.length));
            
            for (const event of toRegister) {
                debug(getText(EventHandler.#client.consoleLang, ["handlers", "event", "debug", "registeringSpecific"], event.name || event.filePath));
                // determine execute function
                let execute;
                // depending on settings
                if (event.settings) {
                    let settings = event.settings;
                    if (settings.debounce) {
                        if (!settings.debounce.time) warn(getText(EventHandler.#client.consoleLang, ["handlers", "event", "warn", "noDebounceTime"], event.name || event.filePath));
                        else execute = debounce(event.execute, settings.debounce.time, settings.debounce.risingEdge || false);
                    }
                }
                if (!execute) execute = event.execute;
                // attach the listener
                EventHandler.#client.on(event.event, (...args) => this.#eventEmitter.emit(event.event, EventHandler.#client, args));
                EventHandler.#eventEmitter.on(event.event, execute);
                debug(getText(EventHandler.#client.consoleLang, ["handlers", "event", "debug", "loadedEvent"], event.name || event.filePath));
            }
        }
        info(getText(EventHandler.#client.consoleLang, ["handlers", "event", "info", "loadedEvents"]));
        return EventHandler;
    }
}

module.exports = EventHandler;