const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeouttest')
        .setDescription('Timeout a user (test)')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('The user to timeout')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('Timeout duration in seconds (min 5)')
                .setRequired(true)
                .setMinValue(5)
                .setMaxValue(2419200)
        ),
    async execute(interaction) {
        console.log(`⚙️ Command triggered by ${interaction.user.tag}`);

        const target = interaction.options.getUser('target');
        const duration = interaction.options.getInteger('duration');

        console.log(`➡️ target: ${target?.tag}, duration: ${duration}`);

        if (!target || !duration) {
            console.log("❌ Missing target or duration");
            return interaction.reply({ content: 'Something went wrong with your input.', ephemeral: true });
        }

        try {
            console.log("🔍 Fetching member...");
            const member = await interaction.guild.members.fetch(target.id);

            console.log(`🚀 Timing out ${member.user.tag} for ${duration} seconds`);
            await member.timeout(duration * 1000);

            await interaction.reply(`${target.tag} has been timed out for ${duration} seconds.`);
        } catch (error) {
            console.error("❌ Timeout failed:", error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'Failed to timeout the user.', ephemeral: true });
            }
        }
    },
};
