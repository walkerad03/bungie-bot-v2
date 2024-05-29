const DestJS = require("./modules/destjs");
const Discord = require("./modules/discord");
const config = require("../config.json");
const Logger = require("./modules/logger");

let destjs;
let discord;
let logger;

function init() {
    destjs = new DestJS(config.bungie_api_key);
    discord = new Discord();
    logger = new Logger();

    discord.loadCommands(destjs);
    discord.setupCommandHandler();

    logger.logInfo("Initialization successful.");

    return {discord, logger};
}

async function login(discord, logger) {
    try {
        await discord.login(config.token);
    } catch (error) {
        logger.logError("Discord login failed:", error);
    }
}

async function processMember(member) {
    if (!member.nickname) {
        logger.logWarn(`Member ${member} has no nickname`);
        return;
    }
    if (member.nickname.includes("#")) {
        discord.setRole(member, "⠀⠀⠀⠀⠀⠀⠀⠀⠀Completions⠀⠀⠀⠀⠀⠀⠀⠀");
        discord.setRole(member, "⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀Misc⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀");
        await destjs.updateChallengeRoles(discord, member);
    }
}

async function scheduledTasks() {
    logger.logInfo("Starting scheduled tasks");
    const guild = await discord.client.guilds.fetch(config.guildId);
    await guild.members.fetch();
    for (const member of guild.members.cache.values()) {
        if (member.nickname == "Mitch#7658" || member.nickname == "shy#8600") {
            continue;
        }
        await processMember(member);
    }
    logger.logInfo("Completed scheduled tasks");
}

async function startScheduledTasks() {
    await scheduledTasks();

    setInterval(async () => {
        await scheduledTasks();
    }, 1000 * 60 * 60);
}


module.exports = {init, login, startScheduledTasks};