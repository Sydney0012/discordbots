const { Client, GatewayIntentBits, EmbedBuilder, MessageEmbed ,  PermissionsBitField, REST, Routes, ButtonBuilder, ActionRowBuilder, ButtonStyle, Collection } = require('discord.js');
const { clientId, guildId, token, allowedUserId, logChannelId, muteRoleId } = require('./config.json');
const keepAlive = require('./keep_alive');

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Define the prefix for commands
const prefix = '!';

 // Replace with the allowed user's ID

// Define the channel ID where logs should be sent
const spamProtection = new Map();
client.warnings = new Collection();
const emojiSpamProtectionChannels = new Map();

//Discord NSFW invite links
const nsfwScamRegex = /(https?:\/\/)?(www\.)?(pornhub|xvideos|redtube|xnxx|scam|phishing|malware|virustotal|discord\.gg\/[a-zA-Z0-9]{8,})/gi;


client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    sendLogMessage('Bot has started and is online.');
});

client.on('messageCreate', message => {
  if (message.content === '!ping') {
    message.channel.send('Pong.');
  }
});


//clear message command
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options, user } = interaction;

  if (commandName === 'purge') {
    if (user.id !== allowedUserId) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('<:emoji_23:1247227796854538250> Permission Denied')
        .setDescription('You do not have permission to use this command.')
       // .setFooter({ text: 'Bot' });

      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    const amount = options.getInteger('amount');

    if (amount < 1 || amount > 100) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('<:emoji_23:1247227796854538250> Invalid Amount')
        .setDescription('Please provide a number between 1 and 100.')
       // .setFooter({ text: 'Bot' });

      await interaction.reply({ embeds: [embed], ephemeral: true });
      return;
    }

    try {
      await interaction.deferReply({ ephemeral: true }); // Acknowledge the interaction

      await interaction.channel.bulkDelete(amount, true);

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle('<:d_:1247542376550109205> Messages Deleted')
        .setDescription(`Successfully deleted ${amount} messages.`)
      //  .setFooter({ text: 'Bot' });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(error);

      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('Error')
        .setDescription('<:emoji_23:1247227796854538250> There was an error trying to delete messages in this channel.')
       // .setFooter({ text: 'Bot' });

      await interaction.reply({ embeds: [embed] });
    }
  }
});






// Function to send log messages to the specified channel
function sendLogMessage(content) {
    const channel = client.channels.cache.get(logChannelId);
    if (channel) {
        channel.send(content).catch(console.error);
    } else {
        console.error('Log channel not found.');
    }
}



    

//announce in specific channel 
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // Check if the user is the allowed user
  

  if (command === 'announce') {
    // Ensure a channel is mentioned
    const channelMention = message.mentions.channels.first();
    if (!channelMention) {
      return message.reply('<:emoji_23:1247227796854538250> You need to mention a channel to send the announcement to!');
    }

    // Remove the channel mention from the args
    const announcementContent = args.join(' ').replace(/<#[0-9]+>/, '').trim();
    
    // Split the content into title and message using '|' as a delimiter
    const [title, description] = announcementContent.split('|').map(str => str.trim());

    if (!title || !description) {
      return message.reply('<:emoji_23:1247227796854538250> You need to provide both a title and a description separated by "|".');
    }

    // Create the embed message
    const embed = new EmbedBuilder()
      .setColor(0x00ff00) // Green color
      .setTitle(title)
      .setDescription(description)
      .setFooter({ text: 'Bot' });

    try {
      // Send the embed message to the specified channel
      await channelMention.send({ embeds: [embed] });

      // Optionally, confirm in the current channel that the announcement was sent
      await message.channel.send('<:tick:1247200344623288381> Announcement sent!');
    } catch (error) {
      console.error('<:emoji_23:1247227796854538250> Error sending announcement:', error);
      await message.reply('<:emoji_23:1247227796854538250> There was an error sending the announcement.');
    }
  }
});



//ping command

//Link spam Protection 
client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        if (interaction.commandName === 'linkspam') {
            const channel = interaction.options.getChannel('channel');

            const activateButton = new ButtonBuilder()
                .setCustomId('activateLinkSpam')
                .setLabel('Activate')
                .setStyle(ButtonStyle.Success);

            const deactivateButton = new ButtonBuilder()
                .setCustomId('deactivateLinkSpam')
                .setLabel('Deactivate')
                .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder().addComponents(activateButton, deactivateButton);

            const embed = new EmbedBuilder()
                .setColor(0x0099ff)
                .setTitle('<:tick:1247200344623288381> Link Spam Protection')
                .setDescription(`<:emoji_27:1247534963654656051> Manage link spam protection for ${channel}. Click a button below to activate or deactivate.`);

            await interaction.reply({ embeds: [embed], components: [row] });

            const logChannel = interaction.guild.channels.cache.get(logChannelId);
            if (logChannel) {
                const logEmbed = new EmbedBuilder()
                    .setColor(0x0099ff)
                    .setTitle('<:tick:1247200344623288381> Link Spam Protection')
                    .setDescription(`Link spam protection command used by ${interaction.user.tag} in ${channel}.`)
                    .setTimestamp(new Date());

                await logChannel.send({ embeds: [logEmbed] });
            }
        }
    } else if (interaction.isButton()) {
        const channel = interaction.message.embeds[0].description.match(/<#(\d+)>/)[1];
        const guildChannel = interaction.guild.channels.cache.get(channel);

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '<:emoji_26:1247534934793388083> You do not have permission to use this command.', ephemeral: true });
        }

        if (interaction.customId === 'activateLinkSpam') {
            spamProtection.set(guildChannel.id, true);
            const newEmbed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('<:tick:1247200344623288381> Link Spam Protection Activated')
                .setDescription(`<:emoji_27:1247534963654656051> Link spam protection has been activated for <#${guildChannel.id}>.`);

            await interaction.reply({ embeds: [newEmbed], ephemeral: true });
        } else if (interaction.customId === 'deactivateLinkSpam') {
            spamProtection.set(guildChannel.id, false);
            const newEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('<:tick:1247200344623288381> Link Spam Protection Deactivated')
                .setDescription(`<:emoji_27:1247534963654656051> Link spam protection has been deactivated for <#${guildChannel.id}>.`);

            await interaction.reply({ embeds: [newEmbed], ephemeral: true });
        }
    }
});

client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;

    const isProtected = spamProtection.get(message.channel.id);
    if (isProtected && message.content.includes('http')) {
        await message.delete();
        await message.channel.send(`<:emoji_23:1247227796854538250> ${message.author}, link spam is not allowed in this channel.<:emoji_26:1247534934793388083>`).then(msg => {
            setTimeout(() => msg.delete(), 5000); // Delete the warning message after 5 seconds
        });
    }
});


//ban n unban command 

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const logChannel = interaction.guild.channels.cache.get(logChannelId);

    if (interaction.commandName === 'ban') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return interaction.reply({ content: '<:emoji_23:1247227796854538250> You do not have permission to use this command.', ephemeral: true });
        }

        const target = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const member = interaction.guild.members.cache.get(target.id);

        if (member) {
            await member.ban({ reason });
            const banEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('<:tick:1247200344623288381> User Banned')
                .addFields(
                    { name: '<:emoji_25:1247534904133161042> User', value: `${target.tag} (${target.id})`, inline: true },
                    { name: '<:emoji_26:1247534934793388083> Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                    { name: '<:m_:1247542336238653551> Reason', value: reason, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [banEmbed] });
            if (logChannel) {
                await logChannel.send({ content: `<@${interaction.user.id}>`, embeds: [banEmbed] });
            }
        } else {
            await interaction.reply({ content: 'User not found.', ephemeral: true });
        }
    } else if (interaction.commandName === 'unban') {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return interaction.reply({ content: '<:emoji_23:1247227796854538250> You do not have permission to use this command.', ephemeral: true });
        }

        const userId = interaction.options.getString('userid');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        try {
            await interaction.guild.members.unban(userId, reason);
            const user = await client.users.fetch(userId);
            const unbanEmbed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('<:tick:1247200344623288381> User Unbanned')
                .addFields(
                    { name: '<:emoji_25:1247534904133161042> User', value: `${user.tag} (${user.id})`, inline: true },
                    { name: '<:emoji_26:1247534934793388083> Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                    { name: '<:m_:1247542336238653551> Reason', value: reason, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [unbanEmbed] });
            if (logChannel) {
                await logChannel.send({ content: `<@${interaction.user.id}>`, embeds: [unbanEmbed] });
            }
        } catch (error) {
            await interaction.reply({ content: 'User not found or not banned.', ephemeral: true });
        }
    }
});



//warn and unwarn




client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    if (!interaction.guild) {
        return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
    }

    try {
        const logChannel = interaction.guild.channels.cache.get(logChannelId);
        if (!logChannel) throw new Error('Log channel not found.');

        if (interaction.commandName === 'warn') {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
                return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
            }

            const target = interaction.options.getUser('target');
            const reason = interaction.options.getString('reason');
            const userWarnings = client.warnings.get(target.id) || [];

            userWarnings.push({ reason, moderator: interaction.user.tag });
            client.warnings.set(target.id, userWarnings);

            const warnEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('<:tick:1247200344623288381>User Warned')
                .addFields(
                    { name: 'User', value: `${target.tag} (${target.id})`, inline: true },
                    { name: '<:emoji_25:1247534904133161042> Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                    { name: '<:m_:1247542336238653551> Reason', value: reason, inline: true },
                    { name: 'Total Warnings', value: `${userWarnings.length}`, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ content: '<:tick:1247200344623288381> User has been warned.', ephemeral: true });
            await logChannel.send({ embeds: [warnEmbed] });

            // Send DM to the warned user
            try {
                await target.send({ embeds: [warnEmbed] });
            } catch (err) {
                console.log(`Could not send DM to ${target.tag}`);
            }

        } else if (interaction.commandName === 'unwarn') {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
                return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
            }

            const target = interaction.options.getUser('target');
            const index = interaction.options.getInteger('index') - 1; // Convert to zero-based index
            const userWarnings = client.warnings.get(target.id);

            if (!userWarnings || userWarnings.length === 0) {
                return interaction.reply({ content: '<:m_:1247542336238653551> This user has no warnings.', ephemeral: true });
            }

            if (index < 0 || index >= userWarnings.length) {
                return interaction.reply({ content: 'Invalid warning index.', ephemeral: true });
            }

            userWarnings.splice(index, 1); // Remove specific warning
            client.warnings.set(target.id, userWarnings);

            const unwarnEmbed = new EmbedBuilder()
                .setColor(0x00ff00)
                .setTitle('<:tick:1247200344623288381> User Unwarned')
                .addFields(
                    { name: '<:emoji_25:1247534904133161042> User', value: `${target.tag} (${target.id})`, inline: true },
                    { name: '<:emoji_25:1247534904133161042> Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
                    { name: 'Total Warnings', value: `${userWarnings.length}`, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ content: '<:emoji_25:1247534904133161042> User has been unwarned.', ephemeral: true });
            await logChannel.send({ embeds: [unwarnEmbed] });

        } else if (interaction.commandName === 'warnings') {
            const target = interaction.options.getUser('target');
            const userWarnings = client.warnings.get(target.id);

            if (!userWarnings || userWarnings.length === 0) {
                return interaction.reply({ content: '<:m_:1247542336238653551> This user has no warnings.', ephemeral: true });
            }

            const warningsList = userWarnings.map((warning, index) =>
                `**${index + 1}.** <:m_:1247542336238653551> Reason: ${warning.reason},<:emoji_27:1247534963654656051> Moderator: ${warning.moderator}`).join('\n');

            const warningsEmbed = new EmbedBuilder()
                .setColor(0xffff00)
                .setTitle(`<:tick:1247200344623288381> Warnings for ${target.tag}`)
                .setDescription(warningsList)
                .setTimestamp();

            await interaction.reply({ embeds: [warningsEmbed], ephemeral: true });
        }
    } catch (error) {
        console.error('Error handling interaction:', error);
        await interaction.reply({ content: 'An error occurred while processing the command.', ephemeral: true });
    }
});

//tempmute and mute command





//spam protection 


client.on('messageCreate', async message => {
    if (message.author.bot) return;

    const isProtected = emojiSpamProtectionChannels.get(message.channel.id);
    if (isProtected) {
        const emojiCount = (message.content.match(/<a?:\w+:\d+>/g) || []).length;

        if (emojiCount > 5 && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            await message.delete();
            
            const warningEmbed = new EmbedBuilder()
                .setColor(0xff0000)
                .setTitle('⚠️Warning')
                .setDescription(`<:emoji_23:1247227796854538250> ${message.author}, please don't spam emojis.`)
                .setTimestamp();

            const warningMessage = await message.channel.send({ embeds: [warningEmbed] });
            setTimeout(() => warningMessage.delete(), 5000); // Delete the warning message after 5 seconds
        }
    }
});

client.on('interactionCreate', async interaction => {
    if (interaction.isCommand()) {
        if (interaction.commandName === 'toggle-emoji-spam') {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
            }

            const channel = interaction.options.getChannel('channel');
            const isProtected = emojiSpamProtectionChannels.get(channel.id);
            const newStatus = !isProtected;
            emojiSpamProtectionChannels.set(channel.id, newStatus);

            const status = newStatus ? 'activated' : 'deactivated';

            const toggleEmbed = new EmbedBuilder()
                .setColor(newStatus ? 0x00ff00 : 0xff0000)
                .setTitle('<:tick:1247200344623288381> Emoji Spam Protection')
                .setDescription(`Emoji spam protection has been ${status} for ${channel}.`)
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('toggle-emoji-spam')
                        .setLabel('Toggle Emoji Spam Protection')
                        .setStyle(ButtonStyle.Primary)
                );

            await interaction.reply({ embeds: [toggleEmbed], components: [row] });
        }
    } else if (interaction.isButton()) {
        if (interaction.customId === 'toggle-emoji-spam') {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ content: 'You do not have permission to use this button.', ephemeral: true });
            }

            const channel = interaction.channel;
            const isProtected = emojiSpamProtectionChannels.get(channel.id);
            const newStatus = !isProtected;
            emojiSpamProtectionChannels.set(channel.id, newStatus);

            const status = newStatus ? 'activated' : 'deactivated';

            const toggleEmbed = new EmbedBuilder()
                .setColor(newStatus ? 0x00ff00 : 0xff0000)
                .setTitle('<:tick:1247200344623288381> Emoji Spam Protection')
                .setDescription(`Emoji spam protection has been ${status} for this channel.`)
                .setTimestamp();

            await interaction.update({ embeds: [toggleEmbed], components: [] });

            await interaction.deferReply({ ephemeral: true }); // Defer the reply
            
            await interaction.followUp({ content: `Emoji spam protection is now ${status} for this channel.` });
        }
    }
});








client.on('messageCreate', async message => {
    if (message.author.bot) return;

    console.log(`Message from ${message.author.tag}: ${message.content}`);

    if (nsfwScamRegex.test(message.content)) {
        console.log('Detected inappropriate link');

        const member = message.guild.members.cache.get(message.author.id);

        if (member && member.kickable) {
            try {
                await member.kick('Sent NSFW, scam, or Discord NSFW invite link');
                console.log(`Kicked user: ${message.author.tag}`);
                
                await message.delete();
                console.log('Deleted message');

                const logChannel = client.channels.cache.get(logChannelId);
                if (logChannel) {
                    console.log('Found log channel');
                    
                    const logEmbed = new EmbedBuilder()
                        .setColor(0xff0000)
                        .setTitle('<:tick:1247200344623288381> User Kicked')
                        .setDescription(`User ${message.author.tag} was kicked for sending an NSFW, scam, or Discord NSFW invite link.`)
                        .addFields(
                            { name: 'User ID', value: message.author.id, inline: true },
                            { name: 'Message Content', value: message.content, inline: true },
                            { name: 'Channel', value: message.channel.toString(), inline: true }
                        )
                        .setTimestamp();

                    await logChannel.send({ embeds: [logEmbed] });
                    console.log('Sent log message');
                } else {
                    console.log('Log channel not found');
                }
            } catch (error) {
                console.error('Failed to kick user or delete message:', error);
            }
        } else {
            console.log('Member is not kickable or not found');
        }
    }
});


client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;

  if (commandName === 'tempmute') {
    const user = options.getUser('user');
    const duration = options.getInteger('duration');
    const unit = options.getString('unit');
    const moderator = interaction.user;

    const member = await interaction.guild.members.fetch(user.id);

    let durationMs;
    if (unit === 'minutes') {
      durationMs = duration * 60 * 1000;
    } else if (unit === 'days') {
      durationMs = duration * 24 * 60 * 60 * 1000;
    }

    const muteEmbed = new EmbedBuilder()
      .setTitle('User Muted')
      .setDescription(`${user.tag} has been muted.`)
      .addFields(
        { name: 'Muted By', value: moderator.tag, inline: true },
        { name: 'Duration', value: `${duration} ${unit}`, inline: true }
      )
      .setThumbnail(user.displayAvatarURL())
      .setColor(0xff0000)
      .setTimestamp();

    const logChannel = await interaction.guild.channels.fetch(logChannelId);
    await logChannel.send({ embeds: [muteEmbed] });

    await member.roles.add(muteRoleId, 'Temporary mute');

    try {
      await user.send(`You have been muted in ${interaction.guild.name} for ${duration} ${unit}.`);
    } catch (err) {
      console.error('Failed to send DM to user:', err);
    }

    await interaction.reply({ content: 'User has been muted.', ephemeral: true });

    setTimeout(async () => {
      try {
        await member.roles.remove(muteRoleId, 'Temporary mute ended');
        const unmuteEmbed = new EmbedBuilder()
          .setTitle('User Unmuted')
          .setDescription(`${user.tag} has been unmuted.`)
          .addFields(
            { name: 'Muted By', value: moderator.tag, inline: true },
            { name: 'Duration', value: `${duration} ${unit}`, inline: true }
          )
          .setThumbnail(user.displayAvatarURL())
          .setColor(0x00ff00)
          .setTimestamp();

        await logChannel.send({ embeds: [unmuteEmbed] });
      } catch (err) {
        console.error('Failed to unmute user:', err);
      }
    }, durationMs);
  } else if (commandName === 'unmute') {
    const user = options.getUser('user');
    const member = await interaction.guild.members.fetch(user.id);
    const moderator = interaction.user;

    await member.roles.remove(muteRoleId, 'Manual unmute');

    const unmuteEmbed = new EmbedBuilder()
      .setTitle('User Unmuted')
      .setDescription(`${user.tag} has been unmuted.`)
      .addFields(
        { name: 'Unmuted By', value: moderator.tag, inline: true }
      )
      .setThumbnail(user.displayAvatarURL())
      .setColor(0x00ff00)
      .setTimestamp();

    const logChannel = await interaction.guild.channels.fetch(logChannelId);
    await logChannel.send({ embeds: [unmuteEmbed] });

    await interaction.reply({ content: 'User has been unmuted.', ephemeral: true });
  }
});




client.login(token);

keepAlive();