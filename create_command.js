const { SlashCommandBuilder } = require('@discordjs/builders')
const { REST } = require('@discordjs/rest')
const { Routes } = require('discord-api-types/v9')
const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_TOKEN)

const commands = [
	new SlashCommandBuilder()
		.setName('horny')
		.setDescription('Wraps daily spicy liked tweets and sends them via DM')
		.addStringOption(option =>
			option.setName('period')
				.setDescription('How far are you ready to dig into degeneracy?')
				.setRequired(true)
				.addChoice('Since today 😩', 'today')
				.addChoice('Since yesterday 😳', 'yesterday')
				.addChoice('Since last week 🥵', 'week')
				.addChoice('Since last month ☠️', 'month')
		)
].map(command => command.toJSON())

rest.put(Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.DISCORD_GUILD_ID), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error)