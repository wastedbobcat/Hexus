const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('untimeout')
        .setDescription('Remove timeout from a user')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to untimeout')
                .setRequired(true)
        ),
    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const member = await interaction.guild.members.fetch(target.id);
        await member.timeout(null);
        await interaction.reply(`${target.tag} has been removed from timeout.`);
    },
};
