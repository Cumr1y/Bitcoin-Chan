const mongoose = require('mongoose');

const dropChannelSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    channelId: { type: String, required: true },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DropChannel', dropChannelSchema);
