const Discord = require('discord.js');
const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });
const axios = require('axios');

const channel_id = process.env.DISCORD_CHANNEL;

let accessToken;
let refreshToken;

const headers = {
  'Content-Type': 'application/x-www-form-urlencoded'
}

const orderTweets = (response, filteredMedias) => {
  const finalMap = new Map()
  response.data.data.forEach(tweet => {
    tweet.attachments.media_keys.forEach(mediaKey => {
      if (filteredMedias.has(mediaKey)) {
        let tweetsToday = [];
        const midnight = new Date(tweet.created_at).setHours(0, 0, 0, 0)
        if (finalMap.has(midnight)) {
          tweetsToday = finalMap.get(midnight)
        }
        else {
          finalMap.set(midnight, tweetsToday)
        }
        tweetsToday.push(filteredMedias.get(mediaKey))
      }
    })
  })
  return finalMap;
}

const wrapLikes = async () => {
  const url = new URL(`https://api.twitter.com/2/users/${process.env.TWITTER_ACCOUNT_ID}/liked_tweets`);
  url.searchParams.append('expansions', 'attachments.media_keys');
  url.searchParams.append('media.fields', 'url');
  url.searchParams.append('tweet.fields', 'created_at');
  const headers = {
    'Authorization': `Bearer ${accessToken}`
  }
  let res;
  try {
    res = await axios.get(url.toString(), { headers })
  } catch (error) {
    console.log(error)
    // TODO: Handle token error properly
    await refreshAccessToken()
    return wrapLikes()
  }
  const filteredMedias = new Map(res.data.includes.media.filter(media => media.url).map(media => [media.media_key, media]))
  const finalMap = orderTweets(res, filteredMedias);
  const date = new Date()
  const todays = finalMap.get(date.setHours(0, 0, 0, 0)) || []
  date.setDate(date.getDate() - 1)
  const yesterdays = finalMap.get(date.getTime()) || []
  return [...todays, ...yesterdays]
}

// TODO externalize Twitter related mechanic
const refreshAccessToken = async () => {
  const url = new URL('https://api.twitter.com/2/oauth2/token')
  url.searchParams.append('refresh_token', process.env.TWITTER_REFRESH_TOKEN)
  url.searchParams.append('grant_type', 'refresh_token')
  url.searchParams.append('client_id', process.env.TWITTER_CLIENT_ID)
  const res = await axios.post(url.toString(), { headers })
  accessToken = res.data.access_token
  refreshToken = res.data.refresh_token
}

const groupByN = (data, n) => {
  const result = []
  for (let i = 0; i < data.length; i += n) {
    result.push(data.slice(i, i + n))
  }
  return result
}

const hornyResponse = async (interaction) => {
  try {
    const tweetsToSend = await wrapLikes();
    const user = interaction.user
    user.send(`Here comes your dose of ~~copium~~ horny material 🥵`)
    groupByN(tweetsToSend, 5).forEach(msg => {
      user.send(msg.map(media => media.url).join('\n'))
    })
  } catch (error) {
    console.log(error)
    // TODO + verbose
    user.send('An error occured, please try again')
  }
}

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return
  if (interaction.commandName === 'horny') {
    await interaction.reply({ content: 'Looking for content, please wait ...', ephemeral: true });
    await hornyResponse(interaction);
    // TODO delete reply
  }
});

client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  channel = await client.channels.fetch(channel_id);
  await refreshAccessToken()
});

client.login(process.env.DISCORD_TOKEN);