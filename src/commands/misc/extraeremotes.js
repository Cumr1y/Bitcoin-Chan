const { EmbedBuilder, MessageFlags, AttachmentBuilder } = require("discord.js");
const axios = require("axios");

module.exports = {
    name: "extraeremotes",
    description: "Extrae todos los emotes de un mensaje al que respondas.",
    testOnly: true,
    deleted: true,
    callback: async (client, interaction) => {
        if (!interaction.inGuild()) {
            return interaction.reply({
                content: "Solo puedes usar este comando en un servidor.",
                flags: MessageFlags.Ephemeral,
            });
        }

        await interaction.deferReply();

        // Obtener el mensaje al que se responde
        const targetMessage = interaction.options.getSubcommand ? null : interaction.targetMessage;

        if (!interaction.targetMessage) {
            return interaction.editReply({
                content: "❌ Debes responder a un mensaje para extraer sus emotes.",
            });
        }

        const content = interaction.targetMessage.content;

        // Regex para encontrar emotes personalizados
        const emoteRegex = /<a?:(\w+):(\d+)>/g;
        const matches = [...content.matchAll(emoteRegex)];

        if (matches.length === 0) {
            return interaction.editReply({
                content: "❌ No se encontraron emotes personalizados en ese mensaje.",
            });
        }

        // Crear array de promesas para descargar todos los emotes
        const emotePromises = matches.map(async (match) => {
            const emoteName = match[1];
            const emoteId = match[2];
            const isAnimated = match[0].startsWith("<a:");
            const format = isAnimated ? "gif" : "png";
            const imageUrl = `https://cdn.discordapp.com/emojis/${emoteId}.${format}?quality=lossless&size=512`;

            try {
                const response = await axios.get(imageUrl, {
                    responseType: "arraybuffer",
                });

                return {
                    success: true,
                    emoteName,
                    emoteId,
                    isAnimated,
                    format,
                    data: response.data,
                };
            } catch (error) {
                return {
                    success: false,
                    emoteName,
                    emoteId,
                    error: true,
                };
            }
        });

        const emoteResults = await Promise.all(emotePromises);
        const successfulEmotes = emoteResults.filter((e) => e.success);
        const failedEmotes = emoteResults.filter((e) => e.error);

        if (successfulEmotes.length === 0) {
            return interaction.editReply({
                content: "❌ No se pudieron descargar los emotes.",
            });
        }

        // Crear attachments
        const attachments = successfulEmotes.map((emote) => {
            return new AttachmentBuilder(emote.data, {
                name: `${emote.emoteName}.${emote.format}`,
            });
        });

        // Crear embed de información
        const embed = new EmbedBuilder()
            .setColor(0x5865F2)
            .setTitle("✅ Emotes Extraídos")
            .setDescription(
                `Se encontraron y descargaron **${successfulEmotes.length}** emote(s).${
                    failedEmotes.length > 0
                        ? `\n\n⚠️ **Fallos:** ${failedEmotes.map((e) => `\`${e.emoteName}\``).join(", ")}`
                        : ""
                }`
            )
            .addFields(
                {
                    name: "Emotes",
                    value: successfulEmotes
                        .map((e) => `${e.isAnimated ? "🎬" : "🖼️"} \`${e.emoteName}\` (${e.format.toUpperCase()})`)
                        .join("\n"),
                }
            )
            .setTimestamp();

        await interaction.editReply({
            embeds: [embed],
            files: attachments,
        });
    },
};
