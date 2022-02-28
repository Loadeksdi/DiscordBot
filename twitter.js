const axios = require('axios')
const fs = require('fs/promises')

let accessToken
let refreshToken

const loadConfig = async () => {
	const fileBuffer = await fs.readFile('config.json', 'utf-8')
	refreshToken = JSON.parse(fileBuffer.toString()).token
}

const orderTweets = (response, filteredMedias) => {
	const finalMap = new Map()
	response.data.data.forEach(tweet => {
		if (!tweet.attachments || !tweet.attachments.media_keys) return
		tweet.attachments.media_keys.forEach(mediaKey => {
			if (filteredMedias.has(mediaKey)) {
				let tweetsToday = []
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
	return finalMap
}

const retrieveTweetsToSend = (response, period) => {
	const filteredMedias = new Map(response.data.includes.media.filter(media => media.url).map(media => [media.media_key, media]))
	const finalMap = orderTweets(response, filteredMedias)
	const date = new Date()
	const tweets = finalMap.get(date.setHours(0, 0, 0, 0)) || []
	switch (period) {
		case 'today':
			period = 0
			break
		case 'yesterday':
			period = 1
			break
		case 'week':
			period = 6
			break
		case 'month':
			period = 30
			break
	}
	for (let index = 0; index < period; index++) {
		tweets.push(...(finalMap.get(date.setDate(date.getDate() - 1)) || []))
	}
	return tweets
}

const later = (delay) => {
	return new Promise(function (resolve) {
		setTimeout(resolve, delay)
	})
}

const wrapLikes = async (period, fetchedResponse) => {
	const url = new URL(`https://api.twitter.com/2/users/${process.env.TWITTER_ACCOUNT_ID}/liked_tweets`)
	url.searchParams.append('expansions', 'attachments.media_keys')
	url.searchParams.append('media.fields', 'url')
	url.searchParams.append('tweet.fields', 'created_at')
	if (fetchedResponse) {
		url.searchParams.append('pagination_token', fetchedResponse.data.meta.next_token)
	}
	const headers = {
		'Authorization': `Bearer ${accessToken}`
	}
	let res
	try {
		res = await axios.get(url.toString(), { headers })
	} catch (error) {
		if (error.response.status === 403 && error.response.data.detail === "Invalid or Expired Token") {
			await refreshAccessToken()
			return await wrapLikes()
		}
		else if (error.response.status === 429) {
			await later(parseInt(error.response.headers['x-rate-limit-reset']) * 1000 - Date.now())
			return await wrapLikes()
		}
		else {
			throw new Error(error.response.statusText)
		}
	}
	if (res.data.meta.next_token && !res.data.data.every(tweet => new Date(tweet.created_at) < new Date().setDate(-30))) {
		res = await wrapLikes(period, res)
	}
	if (fetchedResponse) {
		res = {
			...res,
			...fetchedResponse,
			data: {
				data: [...res.data.data, ...fetchedResponse.data.data],
				includes: {
					media: [...res.data.includes.media, ...fetchedResponse.data.includes.media]
				},
				meta: fetchedResponse.data.meta
			},
		}
		return res
	}
	return retrieveTweetsToSend(res, period)
}

const saveConfig = async (refreshToken) => {
	await fs.writeFile('config.json', JSON.stringify({ token: refreshToken }))
	console.log("Token saved.")
}

const refreshAccessToken = async () => {
	const url = new URL('https://api.twitter.com/2/oauth2/token')
	url.searchParams.append('refresh_token', refreshToken)
	url.searchParams.append('grant_type', 'refresh_token')
	url.searchParams.append('client_id', process.env.TWITTER_CLIENT_ID)
	const res = await axios.post(url.toString(), {
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		}
	})
	accessToken = res.data.access_token
	refreshToken = res.data.refresh_token
	saveConfig(refreshToken)
}

module.exports = {
	wrapLikes,
	refreshAccessToken,
	loadConfig
}