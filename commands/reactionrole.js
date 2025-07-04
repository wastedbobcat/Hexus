const { SlashCommandBuilder, ChannelType, EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reactionrole')
    .setDescription('Create a reaction role embed')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Channel to send the embed to')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText))
    .addStringOption(option =>
      option.setName('title')
        .setDescription('Title of the embed')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('text')
        .setDescription('Description of the embed, use \\n\\n for line breaks')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Role to give on reaction')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('emoji')
        .setDescription('Emoji to use')
        .setRequired(true)),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const title = interaction.options.getString('title');
    const textRaw = interaction.options.getString('text');
    const role = interaction.options.getRole('role');
    const emoji = interaction.options.getString('emoji');

    // Replace escaped newlines with actual newlines for clean display
    const text = textRaw.replace(/\\n/g, '\n');

    // Create embed
    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(text)
      .setColor(0x00AE86);

    // Send embed
    const sentMessage = await channel.send({ embeds: [embed] });
    await sentMessage.react(emoji);

    // Save to JSON file
    const dbFile = './reactionroles.json';
    let data = fs.existsSync(dbFile) ? JSON.parse(fs.readFileSync(dbFile)) : {};
    data[sentMessage.id] = {
      roleId: role.id,
      emoji: emoji
    };
    fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));

    await interaction.reply({ content: `✅ Reaction role set in ${channel}`, ephemeral: true });
  },
};
