'use strict';

const { processInteraction } = require("../handlers/InteractionHandler");

/** @type {import("../types").Event} */
module.exports = {
    name: "processInteraction",
    event: "interactionCreate",
    execute: async (client, interaction) => {
        return await processInteraction(interaction);
    }
}