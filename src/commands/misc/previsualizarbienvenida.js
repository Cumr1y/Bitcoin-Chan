const { EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
  name: "previsualizarbienvenida",
  description: "Previsualiza el mensaje de bienvenida",
  deleted: true,
  testOnly: true,
  devOnly: true,
  callback: async (client, interaction) => {
    try {
      // Crear embed igual al que se envía en guildMemberAdd
      const embed = new EmbedBuilder()
        .setColor(0x008000)
        .setTitle("Bienvenido al servidor")
        .setDescription(`${interaction.user} se ha unido al servidor.`)
        .addFields(
          { name: "Usuario", value: `${interaction.user.username}#${interaction.user.discriminator}`, inline: true },
          { name: "Miembros totales", value: `${interaction.guild.memberCount}`, inline: true },
          { name: "ID", value: `${interaction.user.id}`, inline: false }
        )
        .setThumbnail(interaction.user.displayAvatarURL())
        .setFooter({ text: `${interaction.guild.name}`, iconURL: interaction.guild.iconURL() })
        .setTimestamp();

      // Enviar en el canal actual
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Error en previsualizarbienvenida:", error);
      return interaction.reply({
        content: "Error al previsualizar el mensaje de bienvenida.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
