const {
  Client,
  Interaction,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");
const User = require("../../models/User");

module.exports = {
  name: "updatejoins",
  description: "Actualiza las fechas de unión reales de todos los usuarios (Admin).",
  deleted: true,
  defaultMemberPermissions: PermissionFlagsBits.Administrator,
  callback: async (client, interaction) => {
    if (!interaction.inGuild()) {
      return interaction.reply({
        content: "Solo puedes usar este comando en un servidor.",
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply();

    try {
      // Obtener todos los miembros del servidor
      const members = await interaction.guild.members.fetch();
      
      let updated = 0;
      let skipped = 0;

      for (const [, member] of members) {
        try {
          // Buscar el usuario en la BD
          let user = await User.findOne({
            userId: member.id,
            guildId: interaction.guild.id,
          });

          // Si existe, actualizar la fecha de unión real
          if (user) {
            user.joinedAt = member.joinedAt;
            await user.save();
            updated++;
          } else {
            // Si no existe, crearlo con la fecha real
            const newUser = new User({
              userId: member.id,
              guildId: interaction.guild.id,
              joinedAt: member.joinedAt,
            });
            await newUser.save();
            updated++;
          }
        } catch (error) {
          console.error(`Error actualizando usuario ${member.id}:`, error);
          skipped++;
        }
      }

      return interaction.editReply({
        content: `✅ Actualización completada:\n- **Actualizados:** ${updated} usuarios\n- **Errores:** ${skipped} usuarios`,
      });
    } catch (error) {
      console.error("Error en updatejoins:", error);
      return interaction.editReply({
        content: "❌ Hubo un error al actualizar las fechas de unión.",
      });
    }
  },
};
