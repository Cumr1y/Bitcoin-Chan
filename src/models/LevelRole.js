const { Schema, model } = require("mongoose");

const levelRoleSchema = new Schema({
    guildId: {
        type: String,
        required: true,
    },
    level: {
        type: Number,
        required: true,
    },
    roleId: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Índice compuesto para asegurar que no haya duplicados
levelRoleSchema.index({ guildId: 1, level: 1 }, { unique: true });

module.exports = model("LevelRole", levelRoleSchema);
