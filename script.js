const Discord = require('discord.js');
const slashDiscord = require('slashdiscord');
const TwitterEvents = require('./twitter');
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'GUILD_MEMBER'] });
const slash = new slashDiscord(client);
const channel_id = process.env.DISCORD_CHANNEL;
const interval = 24 * 60 * 60 * 1000;
let channel;
let dailyRTs = [];

function filter(reaction) {
  return reaction.emoji.name === '👀'
}

async function createNotification(data, ...msgs) {
  dailyRTs.push({ data, msgs });
  const message = await channel.send('New activity on Twitter detected 😳👀');
  await message.react('👀');
  const reactionCollector = message.createReactionCollector(filter, {});
  reactionCollector.on('collect', async (reaction, user) => {
    if (reaction.partial) {
      await reaction.fetch();
    }
    if (user.partial) {
      await user.fetch();
    }
    msgs.forEach(msg => {
      user.send(msg);
    });
  });
}

client.on('raw', async packet => {
  if (packet.t !== 'INTERACTION_CREATE') return;
  const user = await client.users.fetch(packet.d['member']['user']['id']);
  const today = new Date()
  user.send(`Here comes your daily dose of horny material 🥵 (${today.toLocaleString("fr-FR")})`);
  dailyRTs.filter(data => today - Date.parse(data.data.data.created_at) < interval).forEach(item => {
    item.msgs.forEach(msg => user.send(msg));
  });
});

client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}!`);
  channel = await client.channels.fetch(channel_id);
  slash.quickCreateCommand('horny', 'Wraps daily spicy retweets and sends it via DM').then(res => console.log(res));
  new TwitterEvents().on('tweet', createNotification);
});

client.login(process.env.DISCORD_TOKEN);