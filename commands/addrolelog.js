const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');
const CONFIG_FILE = './logs-config.json';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addrolelog')
        .setDescription('Log role updates into a channel')
        .addChannelOption(opt =>
            opt.setName('destination').setDescription('Channel to log into').setRequired(true)),

    async execute(interaction) {
        const guildId = interaction.guild.id;
        const dest = interaction.options.getChannel('destination').id;

        let data = {};
        if (fs.existsSync(CONFIG_FILE)) {
            data = JSON.parse(fs.readFileSync(CONFIG_FILE));
        }
        if (!data[guildId]) {
            data[guildId] = { messageLogs: [], vcLogs: [], roleLogs: [], joinLeaveLogs: [] };
        }

        data[guildId].roleLogs.push({ destination: dest });
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2));

        await interaction.reply(`✅ Role changes will be logged to <#${dest}>`);
    }
};
