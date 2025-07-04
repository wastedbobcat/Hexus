const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to kick')
                .setRequired(true)
        ),
    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const member = await interaction.guild.members.fetch(target.id);
        if (!member.kickable) {
            return interaction.reply({ content: 'I cannot kick this user.', ephemeral: true });
        }
        await member.kick();
        await interaction.reply(`${target.tag} has been kicked.`);
    },
};
