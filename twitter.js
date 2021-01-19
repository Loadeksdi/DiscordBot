const EventEmitter = require('events');
const { URL } = require('url');

const fetch = require('node-fetch');

class TwitterEvents extends EventEmitter {
  connectionOpened = false

  constructor() {
    super();
    this.startStream()
  }
  startStream() {
    if (this.connectionOpened === true) return
    const headers = {
      Authorization: 'Bearer ' + process.env.TWITTER_TOKEN,
      'Content-Type': 'application/json'
    }
    const url = new URL('https://api.twitter.com/2/tweets/search/stream');
    url.searchParams.append('expansions', 'attachments.media_keys');
    url.searchParams.append('media.fields', 'url');
    url.searchParams.append('tweet.fields', 'created_at');
    const initGet = {
      method: 'GET',
      headers: headers,
      mode: 'cors',
      cache: 'default',
      timeout: 0
    };
    const restart = () => {
      this.connectionOpened = false;
      this.startStream();
    };
    fetch(url, initGet).then(response => {
      console.log("Succesfully connected");
      this.connectionOpened = true;
      response.body.on('data', (data) => this.readData(data));
      response.body.on('error', () => setTimeout(restart, 30 * 1000));
      response.body.on('end', restart);
      response.body.on('close', restart);
    }).catch(err => {
      console.error(err);
      setTimeout(restart, 30 * 1000);
    });
  }
  readData(chunk) {
    if (chunk.length <= 2) {
      return;
    }
    const data = JSON.parse(chunk.toString('utf8'));
    if (data.title === 'ConnectionException') {
      console.error('Connection to the stream failed');
      console.error(data);
      return;
    }
    if (data?.includes?.media?.every(media => media.url)) {
      this.emit('tweet', data, `<https://twitter.com/0/status/${data.data.id}>`, ...data.includes.media.map(media => media.url));
    }
    else {
      this.emit('tweet', data, `https://twitter.com/0/status/${data.data.id}`);
    }
  }
};

module.exports = TwitterEvents;
