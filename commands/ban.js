const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to ban')
                .setRequired(true)
        ),
    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const member = await interaction.guild.members.fetch(target.id);
        if (!member.bannable) {
            return interaction.reply({ content: 'I cannot ban this user.', ephemeral: true });
        }
        await member.ban();
        await interaction.reply(`${target.tag} has been banned.`);
    },
};
