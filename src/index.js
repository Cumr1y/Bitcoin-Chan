require('dotenv').config();
const express = require('express');
const { Client, IntentsBitField, Collection, ChannelType } = require('discord.js');
const mongoose = require('mongoose');
const eventHandler = require('./handlers/eventHandler');
const DropChannel = require('./models/DropChannel');

// Servidor HTTP para mantener el bot activo
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.status(200).send('Bot en línea ✓');
});

app.listen(PORT, () => {
    console.log(`Servidor HTTP en puerto ${PORT}`);
});

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildPresences,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});

client.commands = new Collection();
client.commandArray = [];
client.dropChannels = new Map();
client.activeDrops = new Map();
client.dropChance = new Map();

eventHandler(client);

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Conectado a la Base de Datos!');
    })
    .catch((err) => {
        console.error('Error conectando a MongoDB:', err);
    });

client.login(process.env.TOKEN);
