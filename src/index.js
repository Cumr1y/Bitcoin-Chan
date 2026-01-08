require('dotenv').config();
const express = require('express');
const { Client, IntentsBitField, Collection, ChannelType } = require('discord.js');
const mongoose = require('mongoose');
const eventHandler = require('./handlers/eventHandler');
const DropChannel = require('./models/DropChannel');

// Servidor HTTP para mantener el bot activo
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
    console.log('GET / - Solicitud recibida');
    res.status(200).send('Bot en línea ✓');
});

app.use((req, res) => {
    console.log(`${req.method} ${req.path} - No encontrada`);
    res.status(404).send('Ruta no encontrada');
});

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor HTTP escuchando en puerto ${PORT}`);
});

server.on('error', (err) => {
    console.error(`❌ Error en servidor HTTP:`, err);
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
