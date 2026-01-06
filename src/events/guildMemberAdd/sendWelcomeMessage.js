module.exports = async (client, member) => {
  try {
    // ID del canal donde enviar el mensaje de bienvenida
    const welcomeChannelId = "1442593512012124344";
    const channel = await client.channels.fetch(welcomeChannelId);

    if (!channel || !channel.isTextBased()) {
      console.error("Canal de bienvenida no encontrado o no es un canal de texto");
      return;
    }

    // Enviar mensaje mencionando al usuario
    await channel.send(`${member.user} wlc!`);
  } catch (error) {
    console.error("Error en el evento guildMemberAdd:", error);
  }
};
