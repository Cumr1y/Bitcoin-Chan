const { EmbedBuilder, MessageFlags, AttachmentBuilder } = require("discord.js");
const { deleted } = require("./previsualizarbienvenida");

module.exports = {
    name: "emote",
    description: "Extrae y amplía un emote o emoji para descargarlo.",
    testOnly: true,
    deleted: false,
    options: [
        {
            name: "emote",
            description: "El emoji o emote a extraer",
            type: 3, // STRING type
            required: true,
        },
        {
            name: "tamaño",
            description: "Tamaño de la imagen: pequeño (128), mediano (256), grande (512) o muy_grande (1024)",
            type: 3, // STRING type
            required: false,
            choices: [
                { name: "Pequeño (128px)", value: "128" },
                { name: "Mediano (256px)", value: "256" },
                { name: "Grande (512px)", value: "512" },
                { name: "Muy Grande (1024px)", value: "1024" },
            ],
        },
    ],
    callback: async (client, interaction) => {
        if (!interaction.inGuild()) {
            return interaction.reply({
                content: "Solo puedes usar este comando en un servidor.",
                flags: MessageFlags.Ephemeral,
            });
        }

        await interaction.deferReply();

        const emoteInput = interaction.options.getString("emote").trim();
        const size = interaction.options.getString("tamaño") || "512";

        let emoteId = null;
        let emoteName = null;
        let isAnimated = false;
        let isUnicode = false;

        // Detectar si es un emote personalizado o unicode
        const customEmoteRegex = /<a?:(\w+):(\d+)>/;
        const match = emoteInput.match(customEmoteRegex);

        if (match) {
            // Es un emote personalizado
            emoteName = match[1];
            emoteId = match[2];
            isAnimated = emoteInput.startsWith("<a:");
        } else if (emoteInput.length <= 2) {
            // Es un emoji unicode
            isUnicode = true;
            emoteName = emoteInput;
        } else {
            return interaction.editReply({
                content: "❌ Por favor, envía un emote válido o un emoji unicode.",
            });
        }

        let imageUrl = null;
        let format = "png";

        if (isUnicode) {
            // Para emojis unicode, usar la API de Twemoji
            const codePoints = [...emoteName]
                .map(char => char.codePointAt(0).toString(16))
                .join("-");
            imageUrl = `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${codePoints}.png`;
        } else {
            // Para emotes personalizados de Discord
            format = isAnimated ? "gif" : "png";
            imageUrl = `https://cdn.discordapp.com/emojis/${emoteId}.${format}?quality=lossless&size=${size}`;
        }

        // Descargar la imagen
        try {
            const response = await require("axios").get(imageUrl, {
                responseType: "arraybuffer",
            });

            const fileName = `${emoteName}.${format}`;
            const attachment = new AttachmentBuilder(response.data, {
                name: fileName,
            });

            await interaction.editReply({
                files: [attachment],
            });
        } catch (error) {
            console.error("Error descargando el emote:", error);
            await interaction.editReply({
                content: "❌ No se pudo descargar el emote. Asegúrate de que sea válido.",
            });
        }
    },
};
