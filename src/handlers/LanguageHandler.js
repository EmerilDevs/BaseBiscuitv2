'use strict';

const { Collection } = require("discord.js");
const { isAbsolute, normalize, join, basename, extname } = require("path");
const { existsSync, statSync, readdirSync, readFileSync } = require("fs");

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
     * Array containing absolute paths to language files.
     * @type {String[]}
     * @private
     * @static
     */
    static #languageFiles = [];
    /**
     * Collection containing all language data.
     * @type {Collection<String, Language>}
     * @private
     * @static
     */
    static #languages = new Collection();

    /**
     * ISO Language Code of the language to default to in cases in 
     * which the correct language to use cannot be determined.
     * @type {ISOLangCode}
     * @static
     */
    static defaultLanguage = "";
    
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
        // scan for language files
        readdirSync(normalize(languageFolder)).forEach(name => {
            // ignore folders
            if (statSync(join(normalize(languageFolder), name)).isDirectory()) return;
            // ignore other files
            if (!/.lang$/g.test(name)) return;
            // add the file to the list of language files
            LanguageHandler.#languageFiles.push(join(normalize(languageFolder), name));
        });
    }

    /**
     * Clear any languages currently loaded and load all languages currently set to be used.
     * @param {import("winston").Logger=} logger The logger being used (to report errors with language files).
     * @static
     * @example
     * // Load all languages in src/lang
     * 
     * const { join } = require("path");
     * 
     * LanguageHandler.addLanguageFolder(join(__dirname, "src", "lang"));
     * LanguageHandler.loadAllLanguages();
     */
    static loadAllLanguages(logger) {
        // unload all language data
        LanguageHandler.#languages = new Collection();
        // load all languages
        LanguageHandler.#languageFiles.forEach(path => {
            try {
                LanguageHandler.loadLanguageFile(path);
            } catch (e) {
                if (logger) logger.error(e);
                else console.error(e);
            }
        });
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
        if (!isAbsolute(normalize(filepath))) throw new Error("Please provide an absolute path.");
        // check the file exists
        if (!existsSync(normalize(filepath))) throw new Error("That path does not exist.");
        // check that the path isn't a directory
        if (statSync(normalize(filepath)).isDirectory()) throw new Error("That path leads to a directory.");
        // get file contents
        let content = readFileSync(filepath, "utf-8");
        let lines = content.split("\n");
        // create the empty language object
        let language = {};
        lines.forEach(line => {
            // ignore comments
            if (line.indexOf("#") == 0 || line.indexOf("-") == 0) return;
            // ensure the line has an entry
            if (line.indexOf("=") == -1) return;
            // get the identifier
            let separated = line.split("=");
            let identifier = separated.shift().trim();
            // get the value
            let value = separated.join("=");
            // add characters such as \n, \t, \# and \\
            value = value.replace(/(?<!\\)\\n/g, "\n").replace(/(?<!\\)\\t/g, "\t").replace(/(?<!\\)\\#/g, "#").replace(/\\\\/g, "\\");
            // remove \r cause it breaks stuff
            value = value.replace(/\r/g, "");
            // create entry in language object
            let lastLevel = language;
            // for each element of the identifier
            identifier.split(".").forEach((x, i, a) => {
                // if an element is undefined, create it
                if (!lastLevel[x]) lastLevel[x] = {};
                // if this is the last element, set it to the text
                if (i == a.length - 1) lastLevel[x] = value;
                // go a level deeper for the next element
                lastLevel = lastLevel[x];
            });
        });
        // add the language to the languages collection
        LanguageHandler.#languages.set(basename(normalize(filepath), extname(normalize(filepath))), language);
    }

    /**
     * Get localised text.
     * @param {ISOLangCode} locale The ISO language code of the locale to use.
     * @param {String[]} path An array containing the path to the localisation.
     * @param  {...String=} replace Items to place within the localised text.
     * @returns {String} The localised text.
     * @static
     * @example
     * // Get a localised logging level name
     * 
     * let name = LanguageHandler.getLocalisation("en", ["console", "logging", "debug"]);
     */
    static getLocalisation(locale, path, ...replace) {
        // if no locale provided use the default
        if (!locale) locale = LanguageHandler.defaultLanguage;
        // ensure locale is loaded
        if (!LanguageHandler.#languages.get(locale)) return path.join(".");
        // get the translation
        let nextElement = LanguageHandler.#languages.get(locale);
        path.forEach(x => nextElement = nextElement?.[x]);
        // return a fallback if no translation is found
        if (!nextElement) nextElement = path.join(".");
        // check the found translation is actually a string
        if (!typeof(nextElement) == "string") throw new Error(`The translation of '${path.join(".")}' in locale '${locale} is not a string.'`);
        // replace elements in the translation
        replace.forEach((x, i) => nextElement = nextElement.replace(new RegExp(`\\\$\\\{${i}\\\}`, "g"), x));
        // return the final result
        return nextElement;
    }

    /**
     * Get localised text with a locale defined by a Discord API locale..
     * @param {String|import("discord.js").Interaction} locale The Discord API locale or Discord Interaction.
     * @param {String[]} path An array containing the path to the localisation.
     * @param  {...String=} replace Items to place within the localised text.
     * @returns {String} The localised text.
     * @static
     * @example
     * // Get a localised logging level name
     * 
     * let name = LanguageHandler.getLocalisationFromAPILocale(interaction, ["console", "logging", "debug"]);
     * let otherName = LanguageHandler.getLocalisationFromAPILocale("en-GB", ["console", "logging", "debug"]);
     */
    static getLocalisationFromAPILocale(locale, path, ...replace) {
        let localeToUse = typeof(locale) == "string" ? locale : locale.locale;
        let languageID = Array.from(LanguageHandler.#languages).find(x => x[1].meta?.apiLocale == localeToUse)[0];
        return LanguageHandler.getLocalisation(languageID, path, ...replace);
    }

    /**
     * Get the localisations of a command to provide to the Discord API.
     * @param {import("../types").Command} command The command to retrieve localisations for.
     * @returns {import("../types").CommandLocalisationObject} The command's localisations.
     * @static
     */
    static getCommandLocalisations(command) {
        /** @type {import("../types").CommandLocalisationObject} */
        let localisations = {
            name: {},
            description: {}
        }
        // for each language
        for (const locale of [...LanguageHandler.#languages.keys()]) {
            // test for an api locale
            if (!LanguageHandler.#languages.get(locale).meta?.apiLocale) continue;
            // attempt to find the localised name
            if (LanguageHandler.#languages.get(locale).commands?.[command.guild ? "guild" : "global"]?.[command.name]?.name) {
                // set the localised name
                localisations.name[LanguageHandler.#languages.get(locale).meta.apiLocale] = LanguageHandler.#languages.get(locale).commands[command.guild ? "guild" : "global"][command.name].name;
            }
            // attempt to find the localised description
            if (LanguageHandler.#languages.get(locale).commands?.[command.guild ? "guild" : "global"]?.[command.name]?.description) {
                // set the localised description
                localisations.description[LanguageHandler.#languages.get(locale).meta.apiLocale] = LanguageHandler.#languages.get(locale).commands[command.guild ? "guild" : "global"][command.name].description;
            }
        }

        return localisations;
    }

    /**
     * Get the localistions of options of a command to provide to the Discord API.
     * @param {import("../types").Command} command The command to retrieve localisations for.
     * @returns {import("../types").CommandOptionLocalisationObject} The command's localisations.
     * @static
     */
    static getCommandOptionLocalisations(command) {
        /** @type {import("../types").CommandOptionLocalisationObject} */
        let localisations = {};
        // for each language
        for (const locale of [...LanguageHandler.#languages.keys()]) {
            // test for an api locale
            if (!LanguageHandler.#languages.get(locale).meta?.apiLocale) continue;
            // for each option
            for (const option of command.options) {
                /** @type {import("../types").CommandLocalisationObject} */
                let localisation = {
                    name: {},
                    description: {}
                }
                // try to find the localised name
                if (LanguageHandler.#languages.get(locale).commands?.options?.[command.guild ? "guild" : "global"]?.[command.name]?.[option.name]?.name) {
                    // set the localised name
                    localisation.name[LanguageHandler.#languages.get(locale).meta.apiLocale] = LanguageHandler.#languages.get(locale).commands.options[command.guild ? "guild" : "global"][command.name][option.name].name
                }
                // try to find the localised description
                if (LanguageHandler.#languages.get(locale).commands?.options?.[command.guild ? "guild" : "global"]?.[command.name]?.[option.name]?.description) {
                    // set the localised description
                    localisation.description[LanguageHandler.#languages.get(locale).meta.apiLocale] = LanguageHandler.#languages.get(locale).commands.options[command.guild ? "guild" : "global"][command.name][option.name].description
                }
                // add to the full object
                localisations[option.name] = localisation;
            }
        }
        // return the full object
        return localisations;
    }
}

module.exports = LanguageHandler;