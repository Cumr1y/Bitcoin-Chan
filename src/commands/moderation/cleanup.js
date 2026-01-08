const {
    PermissionFlagsBits,
    EmbedBuilder,
    MessageFlags,
} = require("discord.js");
const User = require("../../models/User");
const Level = require("../../models/Level");

module.exports = {
    name: "cleanup",
    description: "Elimina datos de usuarios que ya no están en el servidor",
    deleted: false,
    testOnly: false,
    callback: async (client, interaction) => {
        if (!interaction.inGuild()) {
            return interaction.reply({
                content: "Solo puedes usar este comando en un servidor.",
                flags: MessageFlags.Ephemeral,
            });
        }

        // Verificar permisos
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: "❌ No tienes permisos para usar este comando.",
                flags: MessageFlags.Ephemeral,
            });
        }

        const guildId = interaction.guildId;

        try {
            await interaction.deferReply();

            // Obtener todos los usuarios en la base de datos para este servidor
            const dbUsers = await User.find({ guildId });
            
            if (dbUsers.length === 0) {
                return interaction.editReply({
                    content: "❌ No hay usuarios en la base de datos para este servidor.",
                });
            }

            let deletedCount = 0;
            let errorCount = 0;

            console.log(`🔍 Limpiando ${dbUsers.length} usuarios de la BD...`);

            for (const dbUser of dbUsers) {
                try {
                    // Intentar obtener el miembro del servidor
                    const member = await interaction.guild.members.fetch(dbUser.userId).catch(() => null);

                    if (!member) {
                        // El usuario no está en el servidor, eliminar datos
                        await User.deleteOne({ userId: dbUser.userId, guildId });
                        await Level.deleteOne({ userId: dbUser.userId, guildId });
                        
                        deletedCount++;
                        console.log(`🗑️ Eliminado usuario ${dbUser.userId}`);
                    }
                } catch (error) {
                    errorCount++;
                    console.error(`❌ Error procesando usuario ${dbUser.userId}:`, error.message);
                }
            }

            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle("🧹 Limpieza Completada")
                .setDescription(
                    `Se eliminaron **${deletedCount}** registros de usuarios que ya no están en el servidor.\n` +
                    `Total procesado: **${dbUsers.length}** usuarios\n` +
                    `Errores: **${errorCount}**`
                )
                .setTimestamp();

            return interaction.editReply({
                embeds: [embed],
            });

        } catch (error) {
            console.log(`Error en cleanup: ${error}`);
            return interaction.editReply({
                content: "❌ Ocurrió un error al procesar el comando.",
            });
        }
    },
};
