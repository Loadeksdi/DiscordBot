const Discord = require('discord.js');
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
var Twit = require('twit');
const daytime_ms = 86400000;
const channel_id = '694098633338912802';

var T = new Twit({
  consumer_key: 'Tw9BvnCtnBW4QFyBzAvv8wVeL',
  consumer_secret: 'BrdSHgEVbpc218ekKN9G4N9EyRRxmrmI4aqqCH5IwVSjoPba4X',
  access_token: '1034404167543123969-ld8wfCJSd44qxiRRSRZ1ziIdHsP52j',
  access_token_secret: 'LmiT0wrvczas28DTIZsgYDc4djzQ54t9YRaW8nbi9lodj',
  timeout_ms: 60 * 1000,  // optional HTTP request timeout to apply to all requests.
  strictSSL: true,     // optional - requires SSL certificates to be valid.
})

function filter(reaction, user) {
  return reaction.message.channel.id === channel_id && reaction.emoji.name === '👀'
}

const stream = T.stream('statuses/filter', { follow: '1283703286953127936' });
let channel;

stream.on('tweet', async function (tweet) {
  const message = await channel.send("New activity on Twitter detected 😳👀");
  await message.react('👀');
  const reactionCollector = message.createReactionCollector(filter, { time: daytime_ms });
  reactionCollector.on('collect', async (reaction, user) => {
    await user.send(`https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`);
  });
});


client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  channel = client.channels.cache.get(channel_id);
});


client.login('NzU5NTY3NjE3NTI1ODA5MTY1.X2_YeA.7MkKInLohrvwwr5snnv6e61I-LA');