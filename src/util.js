'use strict';

const { statSync, readdirSync } = require("fs");

/** Class for utility functions. */
class Util {
    /**
     * Loop through all subfolders of a folder and return the paths of all files with a specified file extension.
     * @param {String} dir The directory to scan.
     * @param {String=} [ext=js] The extension of the files to find.
     * @returns {String[]} The file paths of the files found in the directory provided with the extension provided.
     * @static
     */
    static walk (dir, ext) {
        // return if nothing to scan
        if (!dir) return [];
        let results = [];
        // get dir contents
        let list = readdirSync(dir);
        // for each file/folder
        list.forEach(file => {
            // get full path
            file = dir + '/' + file;
            // get stats
            let stat = statSync(file);
            // recurse if directory
            if (stat && stat.isDirectory()) results = results.concat(Util.walk(file));
            // else push file path
            else if (file.split(".").pop() == (ext || "js")) results.push(file);
        });
        // return all results
        return results;
    }

    /**
     * Turn an array into a list-esque string, normally to be printed to the console.
     * @param {Array} array An array of things to print.
     * @param {string=} prepend A string to add to the beginning of every line.
     * @returns {string} A list of the array's contents formatted to be printed to the console as a list.
     * @example
     * // Print a list of commands to the console.
     * const { arrayToConsoleList } = require('./util/Util');
     * console.log(arrayToConsoleList(["help", "ping"]));
     * // Would print:
     * // ├ help
     * // └ ping
     */
    static arrayToConsoleList (array, prepend) {
        return array.map((x, i) => `${prepend || ""}${i + 1 == array.length ? "└ " : "├ "}${x.toString ? x.toString() : x}`).join("\n");
    }
}

module.exports = Util;