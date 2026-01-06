const { MessageFlags, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'dropchance',
    description: 'Muestra el chance fijo de drop',
    deleted: true,
    defaultMemberPermissions: PermissionFlagsBits.Administrator,
    callback: async (client, interaction) => {
        await interaction.reply({
            content: `📊 **Chance de drop: 5%** (fijo por cada mensaje)`,
            flags: MessageFlags.Ephemeral
        });
    }
};
