'use strict';

const { error } = require("./LoggingHandler");
const { getLocalisation: getText, getLocalisationFromAPILocale: apiLocale } = require("./LanguageHandler");
const { getCommand, getGuildCommand } = require("./CommandHandler");
const { ownerCheck } = require("../util");

class InteractionHandler {
    /**
     * Process a Discord interaction.
     * @param {import("discord.js").Interaction} interaction The interaction to process.
     * @static
     */
    static async processInteraction(interaction) {
        // ignore if not command
        if (!interaction.isCommand()) return;
        try {
            // get command object from interaction
            let toFind = [
                interaction.commandName,
                interaction.options.getSubcommandGroup(false) ? interaction.options.getSubcommandGroup(false) : interaction.options.getSubcommand(false) ? interaction.options.getSubcommand(false) : undefined,
                interaction.options.getSubcommandGroup(false) ? interaction.options.getSubcommand(false) : undefined
            ];
            let command = getCommand(...toFind) || getGuildCommand(interaction.guild.id, ...toFind);
            // if no command (eg recently unregistered and discord's cache hasn't updated)
            if (!command) return await interaction.reply({ content: apiLocale(interaction, ["handlers", "interaction", "message", "invalidCommand"]), ephemeral: true });

            // check perms + settings
            if (!command.settings?.allowInDMs && !interaction.channel) return await interaction.reply({ content: apiLocale(interaction, ["handlers", "interaction", "message", "guildsOnly"]), ephemeral: true });
            if (command.userPerms && !ownerCheck(interaction.client, interaction.user.id)) for (const perm of command.userPerms) if (!interaction.member.permissions.has(perm)) return await interaction.reply({ content: apiLocale(interaction, ["handlers", "interaction", "message", "noUserPermission"]) });
            if (command.botPerms) for (const perm of command.botPerms) if (!interaction.guild.me.permissions.has(perm)) return await interaction.reply({ content: apiLocale(interaction, ["handlers", "interaction", "message", "noUserPermission"]) });
            await command.execute(interaction);
        } catch (e) {
            e.source = {
                guild: {
                    id: interaction.guild?.id,
                    name: interaction.guild?.name
                },
                channel: {
                    id: interaction.channel?.id,
                    name: interaction.channel?.name
                },
                user: {
                    id: interaction.user?.id,
                    tag: interaction.user?.tag
                }
            }

            error(e);
            await interaction.reply(getText(interaction.client.consoleLang, ["handlers", "interaction", "error", "executeFail"], e.toString()))
        }
    }
}

module.exports = InteractionHandler;