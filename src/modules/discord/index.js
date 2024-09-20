const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const fs = require('node:fs');
const Logger = require("../logger");

let logger = new Logger();

class Discord {
    constructor() {
      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMembers,
          GatewayIntentBits.GuildPresences,
          GatewayIntentBits.GuildVoiceStates,
        ],
      });
      this.client.commands = new Collection();
    }

    async login(token) {
      this.client.once('ready', () => {
          logger.logInfo("Discord client ready!")
      });

      try {
          await this.client.login(token);
          logger.logInfo('Logged into Discord successfully');
      } catch (error) {
          logger.logError(`Failed to login to Discord: ${error}`);
      }
    }

    loadCommands(destjs) {
      const commandFiles = fs.readdirSync('./src/commands').filter(file => file.endsWith('.js'));

      for (const file of commandFiles) {
          const command = require(`../../commands/${file}`)(destjs);
          this.client.commands.set(command.data.name, command);
      }

      logger.logInfo(`Loaded ${this.client.commands.size} commands.`);
    }

    setupCommandHandler() {
      this.client.on(Events.InteractionCreate, async interaction => {
        if (!interaction.isChatInputCommand()) return;

        logger.logInfo(`Attempting to run command ${interaction.commandName}`);

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
          logger.logError(`No command matching ${interaction.commandName} was found.`);
          return;
        }

        try {
            logger.logInfo(`Command ${interaction.commandName} is running.`);
            await command.execute(interaction);
        } catch (error) {
            logger.logError(`Command ${interaction.commandName} failed`, error);
            await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
        }
      });
    }


    async setRole(member, role_name) {
      const role = member.guild.roles.cache.find((r) => r.name === role_name);

      if (!role) {
        logger.logWarn(`Role "${role_name}" not found. Coult not set role ${role_name} for ${member.nickname}.`);
        return;
      }
  
      if (member.roles.cache.has(role.id)) {
        return;
      }
  
      try {
        await member.roles.add(role);
        logger.logInfo(`Added role ${role_name} to user ${member.nickname}`);
      } catch (error) {
        logger.logError(`Failed to assign role "${role_name}" to user "${member.nickname}": ${error}`);
      }
    }

    async removeRole(member, role_name) {
      const role = member.guild.roles.cache.find((r) => r.name === role_name);

      if (!role) {
        logger.logWarn(`Role "${role_name}" not found. Could not remove role ${role_name} for ${member.nickname}.`);
        return;
      }
  
      if (!member.roles.cache.has(role.id)) {
        return;
      }
  
      try {
        await member.roles.remove(role);
        logger.logInfo(`Removed role ${role_name} from ${member.nickname}`);
      } catch (error) {
        logger.logError(`Failed to remove role "${role_name}" from user "${member.nickname}": ${error}`);
      }
    }
}

module.exports = Discord;