const bot = require('./src');

const { discord, logger } = bot.init();
bot.login(discord, logger).then(() => {
    logger.logInfo('Bot started!');
    bot.startScheduledTasks();
})