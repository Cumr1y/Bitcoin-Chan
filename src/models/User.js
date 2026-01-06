const { MentionableSelectMenuInteraction } = require('discord.js');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    balance: { type: Number, default: 0 },
    lastDaily: { type: Date, default: null },
    joinedAt: { type: Date, default: Date.now },
}, {
    indexes: [
        { key: { userId: 1, guildId: 1 }, unique: true } // Unicidad por userId y guildId
    ]
});

module.exports = mongoose.model('User', userSchema);