const { SlashCommandBuilder } = require('discord.js');
const Logger = require('../modules/logger');

var logger = new Logger();

module.exports = (destjs) => ({
    data: new SlashCommandBuilder()
        .setName('get-global-top')
        .setDescription('Cumulative dungeon time rankings')
        .addUserOption((option) =>
            option
                .setName('target')
                .setDescription('User to apply roles to')
                .setRequired(true),
        ),
    async execute(interaction) {
        try {
            await interaction.deferReply()
            const target = interaction.options.getUser('target');
            const member = interaction.guild.members.cache.get(target.id);
            const nickname = member.nickname;
            const membership_details = await destjs.getMembershipDetailsFromBungieID(nickname);

            const [{ membershipId: membership_id, membershipType: membership_type }] = membership_details;

            const dungeon_runs = await destjs.getDungeonClears(membership_type, membership_id);

            await interaction.reply(dungeon_runs);
        } catch (error) {
            logger.logError('Error executing get-global-top command:', error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp('There was an error executing this command.');
            } else {
                await interaction.reply('There was an error executing this command.');
            }
        }
    }
});