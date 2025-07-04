const { Client, GatewayIntentBits, Collection, AuditLogEvent } = require('discord.js');
const fs = require('fs');
require('dotenv').config();

const CONFIG_FILE = './logs-config.json';
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMembers
  ],
});

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  console.log(`Loaded ${file}:`, command);
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(`[WARNING] Missing "data" or "execute" in ./commands/${file}`);
  }
}

// =========================
// INVITE TRACKING
// =========================
client.invites = new Map();

client.on('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  for (const guild of client.guilds.cache.values()) {
    const invites = await guild.invites.fetch().catch(() => null);
    if (invites) client.invites.set(guild.id, invites);
  }
});

// Update invites on create/delete
client.on('inviteCreate', async invite => {
  const invites = await invite.guild.invites.fetch();
  client.invites.set(invite.guild.id, invites);
});

client.on('inviteDelete', async invite => {
  const invites = await invite.guild.invites.fetch();
  client.invites.set(invite.guild.id, invites);
});

// =========================
// COMMAND HANDLER
// =========================
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    if (!interaction.replied) {
      await interaction.reply({ content: 'There was an error.', ephemeral: true });
    }
  }
});

// =========================
// REACTION ROLES
// =========================
client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;

    // Ensure complete data
    if (reaction.partial) {
        try { await reaction.fetch(); } catch (e) { return console.error('Reaction fetch failed:', e); }
    }

    const db = fs.existsSync('./reactionroles.json') ? JSON.parse(fs.readFileSync('./reactionroles.json')) : {};
    const entry = db[reaction.message.id];

    if (!entry) return; // no reaction role configured for this message

    // Debug info
    console.log(`🚀 Reaction detected by ${user.tag}:`);
    console.log(` - Message ID: ${reaction.message.id}`);
    console.log(` - Emoji name: ${reaction.emoji.name}`);
    console.log(` - Emoji ID: ${reaction.emoji.id}`);
    console.log(` - DB roleId: ${entry.roleId}`);
    console.log(` - DB emoji: ${entry.emoji}`);

    // Universal matching for emoji
    const isMatch = (
        reaction.emoji.toString() === entry.emoji || // emoji.toString() gives <:name:id> or ✅
        reaction.emoji.name === entry.emoji ||       // plain name
        reaction.emoji.id === entry.emoji            // id
    );

    if (!isMatch) {
        console.log(`❌ Emoji did not match for this reaction role.`);
        return;
    }

    const role = reaction.message.guild.roles.cache.get(entry.roleId);
    const member = reaction.message.guild.members.cache.get(user.id);

    if (role && member) {
        await member.roles.add(role);
        console.log(`✅ Added role ${role.name} to ${user.tag}`);
    } else {
        console.log(`⚠️ Could not find role or member.`);
    }
});



// =========================
// MESSAGE LOGGER
// =========================
client.on('messageCreate', async message => {
  if (message.author.bot) return;
  const data = fs.existsSync(CONFIG_FILE) ? JSON.parse(fs.readFileSync(CONFIG_FILE)) : {};
  const config = data[message.guild?.id];
  if (!config) return;

  for (const map of config.messageLogs) {
    if (map.source === message.channel.id) {
      const destChannel = message.guild.channels.cache.get(map.destination);
      if (destChannel) {
        destChannel.send(`${message.author} in <#${map.source}>: ${message.content}`);
      }
    }
  }
});

// =========================
// VC LOGGER
// =========================
client.on('voiceStateUpdate', (oldState, newState) => {
  const data = fs.existsSync(CONFIG_FILE) ? JSON.parse(fs.readFileSync(CONFIG_FILE)) : {};
  const config = data[newState.guild.id];
  if (!config) return;

  for (const log of config.vcLogs) {
    const ch = newState.guild.channels.cache.get(log.destination);
    if (!ch) continue;
    if (!oldState.channel && newState.channel) {
      ch.send(`${newState.member.user.tag} joined VC ${newState.channel.name}`);
    } else if (oldState.channel && !newState.channel) {
      ch.send(`${oldState.member.user.tag} left VC ${oldState.channel.name}`);
    }
  }
});

// =========================
// ROLE LOGGER
// =========================
client.on('guildMemberUpdate', async (oldMember, newMember) => {
  const data = fs.existsSync(CONFIG_FILE) ? JSON.parse(fs.readFileSync(CONFIG_FILE)) : {};
  const config = data[newMember.guild.id];
  if (!config) return;

  const oldRoles = oldMember.roles.cache.map(r => r.id);
  const newRoles = newMember.roles.cache.map(r => r.id);
  const addedRoles = newRoles.filter(id => !oldRoles.includes(id));
  const removedRoles = oldRoles.filter(id => !newRoles.includes(id));

  if (addedRoles.length === 0 && removedRoles.length === 0) return;

  let executor = 'Unknown';
  try {
    await new Promise(res => setTimeout(res, 2000));
    const logs = await newMember.guild.fetchAuditLogs({ limit: 10, type: AuditLogEvent.MemberRoleUpdate });
    const log = logs.entries.find(e => e.target.id === newMember.id);
    if (log && log.executor) executor = `<@${log.executor.id}>`;
  } catch (err) {
    console.error('Audit log fetch error:', err);
  }

  for (const log of config.roleLogs) {
    const ch = newMember.guild.channels.cache.get(log.destination);
    if (!ch) continue;
    for (const roleId of addedRoles) {
      ch.send(`${newMember} role added <@&${roleId}> by ${executor}`);
    }
    for (const roleId of removedRoles) {
      ch.send(`${newMember} role removed <@&${roleId}> by ${executor}`);
    }
  }
});

// =========================
// JOIN/LEAVE LOGGER with INVITE TRACKING
// =========================
client.on('guildMemberAdd', async member => {
  const data = fs.existsSync(CONFIG_FILE) ? JSON.parse(fs.readFileSync(CONFIG_FILE)) : {};
  const config = data[member.guild.id];
  if (!config) return;

  let inviter = 'Unknown';
  const cachedInvites = client.invites.get(member.guild.id);
  const newInvites = await member.guild.invites.fetch().catch(() => null);

  if (cachedInvites && newInvites) {
    for (const [code, invite] of newInvites) {
      const oldUses = cachedInvites.get(code)?.uses ?? 0;
      if (invite.uses > oldUses) {
        inviter = invite.inviter ? `<@${invite.inviter.id}>` : 'Unknown';
        break;
      }
    }
    client.invites.set(member.guild.id, newInvites);
  } else {
    inviter = 'Maybe vanity URL or unknown';
  }

  for (const log of config.joinLeaveLogs) {
    const ch = member.guild.channels.cache.get(log.destination);
    if (ch) ch.send(`${member} joined. Invited by ${inviter}`);
  }
});

client.on('guildMemberRemove', member => {
  const data = fs.existsSync(CONFIG_FILE) ? JSON.parse(fs.readFileSync(CONFIG_FILE)) : {};
  const config = data[member.guild.id];
  if (!config) return;
  for (const log of config.joinLeaveLogs) {
    const ch = member.guild.channels.cache.get(log.destination);
    if (ch) ch.send(`${member.user.tag} left the server.`);
  }
});

client.login(process.env.BOT_TOKEN);
