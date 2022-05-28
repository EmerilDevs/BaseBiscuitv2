'use strict';

const { CommandOptionTypes } = require("../../../types");

/**
 * @type {import("../../../types").Command}
 */
module.exports = {
    name: "test",
    options: [
        {
            "type": CommandOptionTypes.STRING,
            "required": true,
            "name": "yeet",
            "description": "test stuff i guess 2"
        }
    ],
    description: "test stuff idk why",
    execute: interaction => {
        interaction.reply("yeettttttter");
    }
}