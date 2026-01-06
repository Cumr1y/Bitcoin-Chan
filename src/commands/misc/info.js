const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    name: "info",
    description: "Obtén información sobre el bot y accede al servidor principal",
    dmPermission: true,
    testOnly: true,
    callback: async (client, interaction) => {
        const embed = new EmbedBuilder()
            .setColor("#272727ff")
            .setTitle("¿Quién soy yo?")
            .setDescription(
                "Soy ese bot que tu servidor necesitaba pero no sabía que le faltaba.\n\n" +
                "**¿Qué me hace especial?**\n" +
                "- Dinero falso que la gente se toma en serio\n" +
                "- La suerte es para los que creen en eso\n" +
                "- Estadísticas para que veas cuánto fracasas\n" +
                "- Herramientas para silenciar a los que molestan\n" +
                "- Diversión no tan garantizada\n\n" +
                "**Spoiler:** tu dinero nunca fue real de todas formas."
            )
            .addFields(
                { name: "Servidores para los que existo", value: `${client.guilds.cache.size}`, inline: true },
                { name: "Usuarios ayudados", value: `${client.users.cache.size}`, inline: true },
                { name: "Tiempo en línea", value: `${Math.floor(client.uptime / 1000 / 60)} minutos`, inline: true }
            )
            .setFooter({ text: "Sí, funciono mejor que la mitad de los bots del mercado (eso creo...)" })
            .setThumbnail(client.user.displayAvatarURL({ size: 256 }));

        const button = new ButtonBuilder()
            .setLabel("Mi sotano... - Servidor Oficial")
            .setURL("https://discord.gg/4yeaxwSUj9")
            .setStyle(ButtonStyle.Link);

        const row = new ActionRowBuilder().addComponents(button);

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};
