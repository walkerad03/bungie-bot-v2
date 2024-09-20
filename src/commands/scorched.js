const {SlashCommandBuilder, EmbedBuilder, Embed} = require('discord.js');
const Logger = require('../modules/logger');

var logger = new Logger();

module.exports = (destjs) => ({
    data: new SlashCommandBuilder()
    .setName('scorched-stats')
    .setDescription('Check your Team Scorched stats')
    .addUserOption((option) =>
        option
            .setName('target')
            .setDescription('User to apply roles to')
            .setRequired(true),
    ),
    async execute(interaction) {
        try {
            await interaction.deferReply();
            const target = interaction.options.getUser('target');
            const member = interaction.guild.members.cache.get(target.id);
            const nickname = member.nickname;
            const membership_details = await destjs.getMembershipDetailsFromBungieID(nickname);
            const [{ membershipId: membership_id, membershipType: membership_type }] = membership_details;

            const scorched_stats = await destjs.getTeamScorchedStats(membership_type, membership_id);

            const time_hms = new Date(scorched_stats.total_time_played * 1000).toISOString().slice(11, 19);
            const efficiency = scorched_stats.total_kills_assists / scorched_stats.total_deaths;

            const fields = [
                {
                    name: "Kills",
                    value: `${scorched_stats.total_kills_assists}`,
                    inline: true
                },
                {
                    name: "Total Time Played",
                    value: `${time_hms}`,
                    inline: true
                },
                {
                    name: "Efficiency",
                    value: `${efficiency.toFixed(3)}`,
                    inline: true
                },
                {
                    name: "Single Game Most Kills",
                    value: `${scorched_stats.most_kills_per_game}`,
                    inline: true
                }
            ];

            const embed = new EmbedBuilder()
                .setTitle(`${nickname} - Lifetime Team Scorched Stats`)
                .setColor(0x0099FF)
                .setThumbnail('https://www.bungie.net/common/destiny2_content/icons/DestinyActivityModeDefinition_fb3e9149c43f7a2e8f8b66cbea7845fe.png')
                .setFields(fields);

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            logger.logError('Error executing scorched-stats command:', error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp('There was an error executing this command.');
            } else {
                await interaction.reply('There was an error executing this command.');
            }
        }
    }
});