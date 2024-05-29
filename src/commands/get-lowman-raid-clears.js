const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Logger = require('../modules/logger');

var logger = new Logger();

module.exports = (destjs) => ({
    data: new SlashCommandBuilder()
    .setName('get-lowman-raid-clears')
    .setDescription('Return all of your lowman clears')
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
    
            const [{ membershipId: membership_id, membershipType: membership_type }] = membership_details
            const lowmanRaids = await destjs.getLowmanRaidClears(membership_type, membership_id);
            
            const clearCounts = {};

            lowmanRaids.forEach(item => {
                if (item.player_count == 3) {
                    item.activity_name = `Trio ${item.activity_name}`;
                } else if (item.player_count == 2) {
                    item.activity_name = `Duo ${item.activity_name}`;
                } else if (item.player_count == 1) {
                    item.activity_name = `Solo ${item.activity_name}`;
                }
            });

            lowmanRaids.forEach(item => {
                if (clearCounts[item.activity_name]) {
                    clearCounts[item.activity_name] += 1;
                } else {
                    clearCounts[item.activity_name] = 1;
                }
            });

            const fields = Object.entries(clearCounts).map(([name, clears]) => ({
                name: name,
                value: `Clears: ${clears}`,
                inline: true
            }));

            const embed = new EmbedBuilder()
                .setTitle(`${nickname} - Lowman Raids`)
                .setColor(0x0099FF)
                .setThumbnail('https://www.bungie.net/common/destiny2_content/icons/9f7a4c302de91bade65119ce6c11021c.png')
                .addFields(fields);

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
        logger.logError('Error executing get-lowman-raid-clears command', error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp('There was an error executing this command.');
        } else {
            await interaction.reply('There was an error executing this command.');
        }
    }
    }
});