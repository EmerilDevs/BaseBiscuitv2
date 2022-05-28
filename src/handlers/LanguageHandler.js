'use strict';

const { Collection } = require("discord.js");
const { isAbsolute, normalize } = require("path");
const { existsSync, statSync } = require("fs");

/**
 * @module handlers
 */

/**
 * @typedef {Object} Language A set of language data.
 * @property {ISOLangCode} id The language's ISO 639-1 code.
 * @property {Object} data All translations.
 */

/**
 * @typedef {'aa'|'ab'|'ae'|'af'|'ak'|'am'|'an'|'ar'|'as'|'av'|'ay'|'az'|'ba'|'be'|'bg'|'bh'|'bm'|'bi'|'bn'|'bo'|'br'|'bs'|'ca'|'ce'|'ch'|'co'|'cr'|'cs'|'cu'|'cv'|'cy'|'da'|'de'|'dv'|'dz'|'ee'|'el'|'en'|'eo'|'es'|'et'|'eu'|'fa'|'ff'|'fi'|'fj'|'fo'|'fr'|'fy'|'ga'|'gd'|'gl'|'gn'|'gu'|'gv'|'ha'|'he'|'hi'|'ho'|'hr'|'ht'|'hu'|'hy'|'hz'|'ia'|'id'|'ie'|'ig'|'ii'|'ik'|'io'|'is'|'it'|'iu'|'ja'|'jv'|'ka'|'kg'|'ki'|'kj'|'kk'|'kl'|'km'|'kn'|'ko'|'kr'|'ks'|'ku'|'kv'|'kw'|'ky'|'la'|'lb'|'lg'|'li'|'ln'|'lo'|'lt'|'lu'|'lv'|'mg'|'mh'|'mi'|'mk'|'ml'|'mn'|'mr'|'ms'|'mt'|'my'|'na'|'nb'|'nd'|'ne'|'ng'|'nl'|'nn'|'no'|'nr'|'nv'|'ny'|'oc'|'oj'|'om'|'or'|'os'|'pa'|'pi'|'pl'|'ps'|'pt'|'qu'|'rm'|'rn'|'ro'|'ru'|'rw'|'sa'|'sc'|'sd'|'se'|'sg'|'si'|'sk'|'sl'|'sm'|'sn'|'so'|'sq'|'sr'|'ss'|'st'|'su'|'sv'|'sw'|'ta'|'te'|'tg'|'th'|'ti'|'tk'|'tl'|'tn'|'to'|'tr'|'ts'|'tt'|'tw'|'ty'|'ug'|'uk'|'ur'|'uz'|'ve'|'vi'|'vo'|'wa'|'wo'|'xh'|'yi'|'yo'|'za'|'zh'|'zu'} ISOLangCode An ISO 639-1 language code.
 */

/**
 * Class used to handle interpretation and use of language files. 
 * Please load the LanguageHandler before any other handlers to 
 * ensure other handlers have access to the loaclised versions of 
 * any text they require. Any errors thrown from the LanguageHandler 
 * will be in English, as they cannot be localised.
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

    /**
     * Load an individual language file.
     * @param {String} filepath The path to the file to load.
     * @static
     * @example
     * // Load the default "en.lang" language file
     * 
     * const { join } = require("path");
     * 
     * LanguageHandler.loadLanguageFile(join(__dirname, "lang", "en.lang"));
     */
    static loadLanguageFile(filepath) {
        // check if the path is absolute
        if (!isAbsolute(normalize(filepath))) throw new Error("")
    }

    /**
     * Get localised text.
     * @param {ISOLangCode} locale The ISO language code of the locale to use.
     * @param {String[]} path An array containing the path to the localisation.
     * @param  {...String} replace Items to place within the localised text.
     * @returns {String} The localised text.
     * @static
     * @example
     * // Get a localised logging level name
     * 
     * let name = LanguageHandler.getLocalisation("en", ["console", "logging", "debug"]);
     */
    static getLocalisation(locale, path, ...replace) {
        // ensure locale is loaded
        if (!LanguageHandler.#languages.get(locale)) throw new Error(`The locale '${locale} has not been loaded.'`);
        // get the translation
        let nextElement = LanguageHandler.#languages.get(locale);
        path.forEach(x => nextElement = nextElement?.[x]);
        // return a fallback if no translation is found
        if (!nextElement) nextElement = path.join(".");
        // check the found translation is actually a string
        if (!typeof(nextElement) == "string") throw new Error(`The translation of '${path.join(".")}' in locale '${locale} is not a string.'`);
        // replace elements in the translation
        replace.forEach((x, i) => nextElement.replace(new RegExp(`\\\$\\\{${i}\\\}`, "g"), x));
        // return the final result
        return nextElement;
    }
}

module.exports = LanguageHandler;