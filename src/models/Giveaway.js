const mongoose = require('mongoose');

const giveawaySchema = new mongoose.Schema({
    giveawayId: { type: String, required: true, unique: true },
    guildId: { type: String, required: true },
    creatorId: { type: String, required: true },
    premioTipo: { type: String, enum: ['BTC', 'NITRO', 'STEAM', 'LOL_RP', 'GENSHIN', 'OTRO'], required: true },
    premioValor: { type: String, required: true }, // "100 BTC", "3 meses Nitro", "60 USD Steam", etc
    premioDescripcion: { type: String }, // Descripción adicional
    costo: { type: Number, required: true }, // Costo en BTC para entrar
    ganadores: { type: Number, default: 1, max: 10 },
    participantes: [{ type: String }], // Array de IDs de usuarios
    ganadorIds: [{ type: String }], // Array de IDs ganadores
    messageId: { type: String },
    channelId: { type: String },
    fechaInicio: { type: Date, default: Date.now },
    fechaFin: { type: Date, required: true },
    estado: { type: String, enum: ['activo', 'finalizado', 'cancelado'], default: 'activo' },
});

module.exports = mongoose.model('Giveaway', giveawaySchema);
