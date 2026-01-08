# BitcoinChan Discord Bot

## Overview
A Discord bot built with discord.js v14 that provides economy, moderation, and miscellaneous commands. It uses MongoDB for data persistence and includes features like XP/leveling system, drops, and welcome messages with canvas-generated images.

## Project Structure
```
src/
├── commands/          # Slash commands organized by category
│   ├── economy/       # Economy-related commands (daily, claim, level, etc.)
│   ├── misc/          # Miscellaneous commands (help, info, ping, etc.)
│   └── moderation/    # Moderation commands (ban, kick, clear, etc.)
├── events/            # Discord event handlers
│   ├── guildMemberAdd/
│   ├── interactionCreate/
│   ├── messageCreate/
│   └── ready/
├── fonts/             # Custom fonts for canvas
├── handlers/          # Event and RPC handlers
├── models/            # Mongoose schemas
├── utils/             # Utility functions
└── index.js           # Main entry point
```

## Required Environment Variables
- `TOKEN` - Discord bot token (from Discord Developer Portal)
- `MONGODB_URI` - MongoDB connection string

## Configuration
- `config.json` contains test server ID, client ID, and developer user IDs

## Running the Bot
```bash
npm start       # Production
npm run dev     # Development with nodemon
```

## Dependencies
- discord.js v14 - Discord API library
- mongoose - MongoDB ODM
- canvas/canvacord - Image generation for welcome messages
- dotenv - Environment variable management
