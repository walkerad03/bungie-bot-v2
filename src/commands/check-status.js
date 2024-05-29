const {SlashCommandBuilder} = require('discord.js');
const Logger = require('../modules/logger');

var logger = new Logger();

module.exports = () => ({
    data: new SlashCommandBuilder()
    .setName('check-status')
    .setDescription('Ping the bot to make sure it is working lol'),
    async execute(interaction) {
        await interaction.reply('Bot is running!');
    }
});