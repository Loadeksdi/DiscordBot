const { Client, Intents, MessageActionRow, MessageButton, MessageEmbed } = require('discord.js')
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] })
const Twitter = require('./twitter')

const roles = {
  cat: process.env.DISCORD_ROLES_CAT,
  dev: process.env.DISCORD_ROLES_DEV,
  frog: process.env.DISCORD_ROLES_FROG,
  horny: process.env.DISCORD_ROLES_HORNY
}

const groupByN = (data, n) => {
  const result = []
  for (let i = 0; i < data.length; i += n) {
    result.push(data.slice(i, i + n))
  }
  return result
}
// TODO: Cache tweet requests
const hornyResponse = async (interaction) => {
  await interaction.reply({ content: 'Looking for content, please wait ...' })
  interaction.channel.sendTyping()
  const user = interaction.user
  try {
    const tweetsToSend = await Twitter.wrapLikes(interaction.options.getString('period'))
    if (tweetsToSend.length !== 0) {
      user.send('Here comes your dose of ~~copium~~ horny material 🥵')
    } else {
      user.send('Unfortunately, the horny material does not meet the quality requirements of the moment 😔')
    }
    groupByN(tweetsToSend, 5).forEach(msg => {
      user.send(msg.map(media => media.url).join('\n'))
    })
  } catch (error) {
    console.log(error)
    user.send('An error occured while loading liked tweets, please try again later')
  }
  await interaction.deleteReply()
}

const commands = {
  horny: hornyResponse
}

client.on('interactionCreate', async (interaction) => {
  if (interaction.isCommand()) {
    commands[interaction.commandName](interaction)
  } else if (interaction.isButton()) {
    interaction.reply({ content: 'Adding a role', ephemeral: true })
    const role = await interaction.guild.roles.fetch(roles[interaction.customId])
    await interaction.member.roles.add(role)
  }
})

const sendRolesMessage = async () => {
  const row = new MessageActionRow()
    .addComponents(
      new MessageButton()
        .setCustomId('cat')
        .setLabel('cat lovers 🐈')
        .setStyle('PRIMARY'),
      new MessageButton()
        .setCustomId('frog')
        .setLabel('frog enjoyers 🐸')
        .setStyle('SUCCESS'),
      new MessageButton()
        .setCustomId('dev')
        .setLabel('dev 💻')
        .setStyle('PRIMARY'),
      new MessageButton()
        .setCustomId('horny')
        .setLabel('horny pass 🥵')
        .setStyle('DANGER')
    )
  const embed = new MessageEmbed()
    .setColor('#aae5a3')
    .setTitle('Roles selection 🎭')
    .setDescription('Get your roles by clicking on the buttons below!')
    .setTimestamp(new Date())
  const channel = await client.channels.fetch(process.env.DISCORD_CHANNEL_ID)
  await channel.send({ embeds: [embed], components: [row] })
}

client.on('ready', async () => {
  await Twitter.loadConfig()
  console.log(`Logged in as ${client.user.tag}!`)
  client.user.setActivity('with your desires 💜', { type: 'PLAYING' })
  //sendRolesMessage()
  await Twitter.refreshAccessToken()
})

client.login(process.env.DISCORD_TOKEN)
