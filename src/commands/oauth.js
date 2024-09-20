const {SlashCommandBuilder} = require('discord.js');
const Logger = require('../modules/logger');
const config = require("../../config.json");

var logger = new Logger();

module.exports = () => ({
    data: new SlashCommandBuilder()
    .setName('authenticate-me')
    .setDescription('Register your guardian with the bot.'),
    async execute(interaction) {
        const authUrl = `https://www.bungie.net/en/OAuth/Authorize?client_id=${config.oauth_client_id}&response_type=code`

        await interaction.reply({
            content: `Please authenticate with Bungie by clicking [here](${authUrl}).`,
            ephemeral: true
        });
    }
});