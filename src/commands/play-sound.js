const {SlashCommandBuilder} = require('discord.js');
const {
    createAudioResource,
    joinVoiceChannel,
    createAudioPlayer,
    AudioPlayerStatus,
    VoiceConnectionStatus,
} = require('@discordjs/voice');
const Logger = require('../modules/logger');
const { join } = require('node:path');

var logger = new Logger();

module.exports = () => ({
    data: new SlashCommandBuilder()
    .setName('play-sound')
    .setDescription('Play a sound!'),
    async execute(interaction) {
        try {
            if (!interaction.member.voice.channel) {
                return interaction.reply('You need to be in a voice channel to use this command!');
            }

            const channel = await interaction.member.voice.channel;

            logger.logInfo("Attempting to join voice channel.");

            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
                selfDeaf: false,
                selfMute: false,
            });

            logger.logInfo('Voice connection object created.');

            connection.on(VoiceConnectionStatus.Signalling, () => {
                logger.logInfo('Signalling state');
            });

            connection.on(VoiceConnectionStatus.Connecting, () => {
                logger.logInfo('Connecting state');
            });

            connection.on(VoiceConnectionStatus.Ready, () => {
                logger.logInfo('The bot has connected to the channel!');

                const player = createAudioPlayer();

                const resource = createAudioResource(join(__dirname, '../audio_files/youve_been_hit_by.mp3'), {
                    metadata: {
                        title: "You've Been Hit By",
                    },
                });

                player.play(resource);
                const subscription = connection.subscribe(player);

                player.on(AudioPlayerStatus.Playing, () => {
                    logger.logInfo('The audio is now playing!');
                });

                player.on(AudioPlayerStatus.Idle, () => {
                    connection.destroy();
                    logger.logInfo("Finished playing the sound");
                });

                player.on('error', error => {
                    logger.logError(`Error`, error);
                    connection.destroy();
                });

                if (subscription) {
                    setTimeout(() => subscription.unsubscribe(), 5_000);
                }
            });

            connection.on('error', error => {
                logger.logError("Error connecting to channel", error);
            })
        } catch (error) {
            logger.logError("An unexpected error occurred", error);
            interaction.reply('An error occurred while trying to execute the command.');
        }
    }
});