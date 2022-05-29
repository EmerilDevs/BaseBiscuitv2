'use strict';

const { CommandOptionTypes } = require("../../types");

/** @type {import("../../types").Command} */
module.exports = {
    name: "test",
    options: [
        {
            type: CommandOptionTypes.STRING,
            required: true,
            name: "test",
            description: "test stuff i guess"
        },
        {
            type: CommandOptionTypes.STRING,
            required: false,
            name: "defaults",
            description: "thing with defaults",
            choices: [
                {
                    name: "yeet",
                    value: "yeet1"
                }
            ]
        }
    ],
    description: "test stuff idk",
    execute: interaction => {
        interaction.reply("yeettttttt");
    }
}