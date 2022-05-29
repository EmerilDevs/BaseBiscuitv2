'use strict';

/**
 * @type {import("../../../types").Command}
 */
module.exports = {
    name: "specific",
    execute: interaction => {
        interaction.reply("woo this is guild specific")
    }
}