const Discord = require('discord.js')
const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES] })
const Twitter = require('./twitter')

const groupByN = (data, n) => {
  const result = []
  for (let i = 0; i < data.length; i += n) {
    result.push(data.slice(i, i + n))
  }
  return result
}
// TODO: Cache tweet requests, pnpm, CD :D
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
  if (!interaction.isCommand()) return
  commands[interaction.commandName](interaction)
})

client.on('ready', async () => {
  await Twitter.loadConfig()
  console.log(`Logged in as ${client.user.tag}!`)
  client.user.setActivity('with your desires 💜', { type: 'PLAYING' })
  await Twitter.refreshAccessToken()
})

client.login(process.env.DISCORD_TOKEN)
