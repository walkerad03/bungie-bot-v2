const DestJS = require("./modules/destjs");
const Discord = require("./modules/discord");
const config = require("../config.json");
const Logger = require("./modules/logger");
const OAuthServer = require("./modules/auth");

let destjs;
let discord;
let logger;
let auth;

function init() {
    destjs = new DestJS(config.bungie_api_key);
    discord = new Discord();
    logger = new Logger();
    auth = new OAuthServer(3000, handleAuthenticatedUser);

    discord.loadCommands(destjs);
    discord.setupCommandHandler();

    auth.start();

    logger.logInfo("Initialization successful.");

    return {discord, logger};
}

async function handleAuthenticatedUser(token) {
    logger.logInfo(`Received token ${token}`);

    if (!token) {
        logger.logError("No token given.");
        return;
    }

    const mem_data = await destjs.getMembershipDetailsFromAccessToken(token);

    console.log(mem_data);

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
        await destjs.updateChallengeRoles(discord, member);
    }
}

async function scheduledTasks() {
    logger.logInfo("Starting scheduled tasks");
    const guild = await discord.client.guilds.fetch(config.guildId);
    await guild.members.fetch();
    for (const member of guild.members.cache.values()) {
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