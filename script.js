const Discord = require('discord.js');
const client = new Discord.Client({ partials: ['MESSAGE', 'CHANNEL', 'REACTION'] });
var Twit = require('twit');

var T = new Twit({
  consumer_key: 'Tw9BvnCtnBW4QFyBzAvv8wVeL',
  consumer_secret: 'BrdSHgEVbpc218ekKN9G4N9EyRRxmrmI4aqqCH5IwVSjoPba4X',
  access_token: '1034404167543123969-ld8wfCJSd44qxiRRSRZ1ziIdHsP52j',
  access_token_secret: 'LmiT0wrvczas28DTIZsgYDc4djzQ54t9YRaW8nbi9lodj',
  timeout_ms: 60 * 1000,  // optional HTTP request timeout to apply to all requests.
  strictSSL: true,     // optional - requires SSL certificates to be valid.
})


const stream = T.stream('statuses/filter', { follow: '1283703286953127936' });
let channel;

stream.on('tweet', async function (tweet) {
  const message = await channel.send("heho");
  await message.react('👀');
});

client.on('messageReactionAdd', async (reaction, user) => {
  // When we receive a reaction we check if the reaction is partial or not
  if (reaction.partial) {
    // If the message this reaction belongs to was removed the fetching might result in an API error, which we need to handle
    try {
      await reaction.fetch();
    } catch (error) {
      console.error('Something went wrong when fetching the message: ', error);
      // Return as `reaction.message.author` may be undefined/null
      return;
    }
  }
}
);


client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  channel = client.channels.cache.get('759568437764423704');
});


client.login('NzU5NTY3NjE3NTI1ODA5MTY1.X2_YeA.7MkKInLohrvwwr5snnv6e61I-LA');