const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const { clientId, guildId, token } = require('./config.json');

const commands = [
  {
    name: 'purge',
    description: 'Delete a specific number of messages',
    options: [
      {
        name: 'amount',
        type: 4, // INTEGER type
        description: 'The number of messages to delete',
        required: true,
      },
    ],
  },


  new SlashCommandBuilder()
        .setName('linkspam')
        .setDescription('Activate or deactivate link spam protection in a specific channel.')
        .addChannelOption(option => 
            option.setName('channel')
            .setDescription('The channel to protect from link spam')
            .setRequired(true))
        .toJSON(),


  new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user with a reason.')
        .addUserOption(option => 
            option.setName('target')
            .setDescription('The user to ban')
            .setRequired(true))
        .addStringOption(option => 
            option.setName('reason')
            .setDescription('The reason for the ban')
            .setRequired(false))
        .toJSON(),
    new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user with a reason.')
        .addStringOption(option => 
            option.setName('userid')
            .setDescription('The ID of the user to unban')
            .setRequired(true))
        .addStringOption(option => 
            option.setName('reason')
            .setDescription('The reason for the unban')
            .setRequired(false))
        .toJSON(),

{
        name: 'warn',
        description: 'Warn a user',
        options: [
            {
                name: 'target',
                type: 6, // USER
                description: 'The user to warn',
                required: true,
            },
            {
                name: 'reason',
                type: 3, // STRING
                description: 'The reason for the warning',
                required: true,
            },
        ],
    },
    {
        name: 'unwarn',
        description: 'Remove a specific warning from a user',
        options: [
            {
                name: 'target',
                type: 6, // USER
                description: 'The user to unwarn',
                required: true,
            },
            {
                name: 'index',
                type: 4, // INTEGER
                description: 'The index of the warning to remove',
                required: true,
            },
        ],
    },
    {
        name: 'warnings',
        description: 'Check warnings for a user',
        options: [
            {
                name: 'target',
                type: 6, // USER
                description: 'The user to check warnings for',
                required: true,
            },
        ],
    },

    new SlashCommandBuilder()
        .setName('toggle-emoji-spam')
        .setDescription('Toggle emoji spam protection for a specific channel.')
        .addChannelOption(option => 
            option.setName('channel')
            .setDescription('The channel to toggle emoji spam protection for.')
            .setRequired(true)
        )
        .toJSON(),


    
    new SlashCommandBuilder()          .setName('tempmute')
           .setDescription('Temporarily mute a user.')
           .addUserOption(option => option.setName('user').setDescription('The user to mute').setRequired(true))
           .addIntegerOption(option => option.setName('duration').setDescription('Duration').setRequired(true))
           .addStringOption(option => option.setName('unit').setDescription('Minutes or days').setRequired(true).addChoices(
             { name: 'minutes', value: 'minutes' },
             { name: 'days', value: 'days' }
           )),
         new SlashCommandBuilder()
           .setName('unmute')
           .setDescription('Unmute a user.')
           .addUserOption(option => option.setName('user').setDescription('The user to unmute')
               .setRequired(true))
                 .toJSON(),

];





  


const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }

})();