const { SlashCommandBuilder, ChannelType } = require('discord.js');
const fs = require('fs');

const CONFIG_FILE = './logs-config.json';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addjoinleavelog')
    .setDescription('Set a channel to log join/leave events')
    .addChannelOption(option =>
      option.setName('destination')
        .setDescription('Channel to send join/leave logs to')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel('destination');
    const guildId = interaction.guild.id;

    let data = fs.existsSync(CONFIG_FILE) ? JSON.parse(fs.readFileSync(CONFIG_FILE)) : {};
    if (!data[guildId]) data[guildId] = { messageLogs: [], vcLogs: [], roleLogs: [], joinLeaveLogs: [] };

    data[guildId].joinLeaveLogs.push({
      destination: channel.id
    });

    fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2));

    await interaction.reply({ content: `✅ Join/leave logs will be sent to ${channel}`, flags: 64 });
  },
};
