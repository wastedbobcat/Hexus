const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clear a number of messages')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to delete')
                .setRequired(true)
        ),
    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');
        const channel = interaction.channel;
        await channel.bulkDelete(amount, true);
        await interaction.reply({ content: `Deleted ${amount} messages.`, ephemeral: true });
    },
};
