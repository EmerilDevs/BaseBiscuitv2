'use strict';

const { Collection } = require("discord.js");
const { isAbsolute, normalize } = require("path");
const { existsSync, statSync } = require("fs");

/**
 * @module handlers
 */

/**
 * @typedef {Object} Language A set of language data.
 * @property {String} id The language's ISO 639-1 code.
 * @property {Object} data All translations.
 */

/**
 * Class used to handle interpretation and use of language files.
 */
class LanguageHandler {
    /**
     * Array containing absolute paths to folders containing language files.
     * @type {String[]}
     * @private
     * @static
     */
    static #languageFolders = [];
    /**
     * Collection containing all language data.
     * @type {Collection<String, Language>}
     * @private
     * @static
     */
    static #languages = new Collection();
    
    /**
     * Add a folder to scan for language files when language files are loaded.
     * @param {String} languageFolder The absolute path to the folder containing language files.
     * @static
     * @example
     * // Add "src/lang" to the list of folders to scan
     * 
     * const { join } = require("path");
     * 
     * LanguageHandler.addLanguageFolder(join(__dirname, "src", "lang"));
     */
    static addLanguageFolder(languageFolder) {
        // check if then normalised path is absolute
        if (!isAbsolute(normalize(languageFolder))) throw new Error("Only absolute paths can be set as language folders.");
        // check the folder exists
        if (!existsSync(normalize(languageFolder))) throw new Error("That path does not exist.");
        // check that the folder is indeed a folder
        if (!statSync(normalize(languageFolder)).isDirectory()) throw new Error("This function expects a folder path, not a file path.")
        // add the path to the array or folder paths
        LanguageHandler.#languageFolders.push(normalize(languageFolder));
    }
}

module.exports = LanguageHandler;