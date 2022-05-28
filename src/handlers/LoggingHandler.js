'use strict';

const winston = require("winston");
const { format } = winston;
const { format: prettyFormat } = require("pretty-format");

/**
 * @module handlers
 */

/**
 * Class that handles logging related tasks.
 */
class LoggingHandler {
    /**
     * Create, set up and return a Winston Logger.
     * @param {import("discord.js").Client} client The Discord client the Logger will be attached to.
     * @returns {import("winston").Logger} The created Logger.
     * @static
     */
    static createLogger(client) {
        const logger = winston.createLogger({
            // setup transports
            transports: [
                // console output
                new winston.transports.Console({
                    format: format.combine(
                        format.colorize({
                            all: true
                        })
                    ),
                    // send all messages, down to debug level
                    level: "debug"
                }),
                // file output
                new winston.transports.File({
                    // ensure all filenames are unique
                    filename: `logs/${require("../../package.json").name}-${new Date().getUTCFullYear()}.${new Date().getUTCMonth() + 1}.${new Date().getUTCDate()}-${new Date().valueOf()}.log`,
                    // send messages of importance "info" and above
                    level: "info"
                })
            ],
            // setup logging levels
            levels: {
                critical: 0,
                error: 1,
                warn: 2,
                info: 3,
                debug: 4
            },
            // use timestamps
            timestamp: true,
            // setup format
            format: format.combine(
                format.splat(),
                format.timestamp({
                    format: "YYYY/MM/DD, HH:mm:ss"
                }),
                format.errors({
                    stack: true
                }),
                format.printf(msg => `[${client.getText(client.consoleLang, ["console", "logging", msg.level.toLowerCase()]).toUpperCase()}] ${msg.timestamp}\t» ${typeof msg.message == "string" ? msg.message.replace(new RegExp(require("os").userInfo().username, "g"), "X") : "\n" + prettyFormat(msg.message).replace(new RegExp(require("os").userInfo().username, "g"), "X")}${msg.stack ? `\n${msg.stack.replace(new RegExp(require("os").userInfo().username, "g"), "X")}` : ""}`)
            )
        });
        // setup colours
        winston.addColors({
            critical: "bold red",
            error: "bold red blackBG",
            warn: "bold yellow blackBG",
            info: "cyan blackBG",
            debug: "grey blackBG"
        });
        // add uncaught exception logger
        process.on("uncaughtException", e => {
            logger.critical(`Uncaught exception:\n${e.stack}`);
        });

        logger.info(client.getText(client.consoleLang, ["console", "logging", "startMessage"], client.getText(client.consoleLang, ["meta", "name"]), client.getText(client.consoleLang, ["meta", "author"])));

        logger.info(client.getText(client.consoleLang, ["console", "logging", "loggerSetup"]));

        return logger;
    }
}

module.exports = LoggingHandler