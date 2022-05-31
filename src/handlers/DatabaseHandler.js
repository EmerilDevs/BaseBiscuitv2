'use strict';

const { getLocalisation: getText } = require("./LanguageHandler");
const { error, debug, info } = require("./LoggingHandler");

/**
 * A class that handles interaction with a database.
 */
class DatabaseHandler {
    /**
     * True/false depending on whether the DatabaseHandler is ready to be used.
     * @type {Boolean}
     * @static
     * @private
     */
    static #ready = false;

    /**
     * The Discord client the CommandHandler works with.
     * @type {import("discord.js").Client}
     * @static
     * @private
     */
    static #client;

    /**
     * The path of the database.
     * @type {String}
     * @static
     * @private
     */
    static #path;

    /**
     * All table definitions.
     * @type {String[]}
     * @static
     * @private
     */
    static #tableDefinitions = [
        
    ]

    /**
     * Initialise the DatabaseHandler.
     * @param {import("discord.js").Client} client The Discord client this DatabaseHandler is attached to.
     * @param {String} dbPath The path to the database.
     * @returns {DatabaseHandler} A reference to the DatabaseHandler class.
     */
    static init(client, dbPath) {
        DatabaseHandler.#client = client;
        // if no client attached
        if (!DatabaseHandler.#client) throw new Error(getText(undefined, ["generic", "errors", "noClient"]));
        // check for db path
        if (!dbPath) throw new Error(getText(DatabaseHandler.#client.consoleLang, ["handlers", "database", "error", "noPath"]));
        DatabaseHandler.#path = dbPath;

        debug(getText(DatabaseHandler.#client.consoleLang, ["handlers", "database", "debug", "loading"]));
        // set ready
        DatabaseHandler.#ready = true;
        // create tables if required
        DatabaseHandler.operation(db => {
            DatabaseHandler.#tableDefinitions.forEach(x => {
                db.exec(`CREATE TABLE IF NOT EXISTS ${x}`);
            })
        })

        info(getText(DatabaseHandler.#client.consoleLang, ["handlers", "database", "info", "loaded"]));

        return DatabaseHandler;
    }

    /**
     * Run a function on the 
     * @param {Function} f The function to run on the database.
     * @returns {any} The result of the function.
     */
    static operation(f) {
        // if no client attached
        if (!DatabaseHandler.#client) throw new Error(getText(undefined, ["generic", "errors", "noClient"]));

        // ensure handler is set up
        if (!DatabaseHandler.#ready) throw new Error(getText(DatabaseHandler.#client.consoleLang, ["handlers", "database", "error", "notInitialised"]));
        // load db
        let db = require("better-sqlite3")(DatabaseHandler.#path);
        let output;
        // attempt function
        try {
            output = f(db);
        } catch {
            error(getText(DatabaseHandler.#client.consoleLang, ["handlers", "database", "error", "operationFailed"]));
        }
        db.close();
        return output;
    }
}

module.exports = DatabaseHandler;