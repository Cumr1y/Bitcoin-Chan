const { EmbedBuilder, MessageFlags, StringSelectMenuBuilder, ActionRowBuilder } = require("discord.js");
const getLocalCommands = require("../../utils/getLocalCommands");

module.exports = {
    name: "help",
    description: "Muestra todos los comandos disponibles",
    testOnly: true,
    callback: async (client, interaction) => {
        const localCommands = getLocalCommands();

        // Agrupar comandos por categoría basado en una propiedad o lógica
        const categories = {
            "economia": { emoji: "💰", nombre: "Economía", comandos: [] },
            "moderacion": { emoji: "🛡️", nombre: "Moderación", comandos: [] },
            "miscelanea": { emoji: "🎯", nombre: "Miscelánea", comandos: [] }
        };

        for (const command of localCommands) {
            // Saltar el comando help a sí mismo
            if (command.name === "help") continue;

            // Saltar comandos marcados como deleted
            if (command.deleted === true) continue;

            // Determinar categoría basada en el nombre del comando
            let categoryKey = "miscelanea";

            if (["claim", "daily", "level", "profile", "specialdrop"].includes(command.name)) {
                categoryKey = "economia";
            } else if (["ban", "kick", "clear", "modsettings", "updatejoins"].includes(command.name)) {
                categoryKey = "moderacion";
            }

            categories[categoryKey].comandos.push(command);
        }

        // Crear el select menu
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId("help_select")
            .setPlaceholder("📚 Selecciona una categoría...");

        // Agregar opciones al select menu
        for (const [key, category] of Object.entries(categories)) {
            if (category.comandos.length > 0) {
                selectMenu.addOptions({
                    label: `${category.emoji} ${category.nombre}`,
                    value: key,
                    description: `${category.comandos.length} comandos disponibles`
                });
            }
        }

        // Crear embed de bienvenida
        const welcomeEmbed = new EmbedBuilder()
            .setColor("#0099ff")
            .setTitle("📚 Centro de Ayuda")
            .setDescription("Selecciona una categoría en el menú desplegable para ver los comandos disponibles.")
            .addFields(
                { name: "💰 Economía", value: `${categories.economia.comandos.length} comandos`, inline: true },
                { name: "🛡️ Moderación", value: `${categories.moderacion.comandos.length} comandos`, inline: true },
                { name: "🎯 Miscelánea", value: `${categories.miscelanea.comandos.length} comandos`, inline: true }
            );

        // Crear action row con el select menu
        const actionRow = new ActionRowBuilder().addComponents(selectMenu);

        // Responder
        await interaction.reply({
            embeds: [welcomeEmbed],
            components: [actionRow]
        });

        // Configurar el collector para las interacciones del select menu
        const collector = interaction.channel.createMessageComponentCollector({
            filter: (i) => i.user.id === interaction.user.id && i.customId === "help_select",
            time: 300000 // 5 minutos
        });

        collector.on("collect", async (selectInteraction) => {
            const selectedCategory = selectInteraction.values[0];
            const category = categories[selectedCategory];

            if (!category || category.comandos.length === 0) {
                await selectInteraction.reply({
                    content: "No hay comandos en esta categoría.",
                    flags: MessageFlags.Ephemeral
                });
                return;
            }

            // Crear embed con los comandos de la categoría
            const categoryEmbed = new EmbedBuilder()
                .setColor("#0099ff")
                .setTitle(`${category.emoji} ${category.nombre}`);

            let description = "";

            for (const command of category.comandos) {
                const cmdName = command.name || "sin nombre";
                const cmdDesc = command.description || "Sin descripción";
                description += `**/${cmdName}** - ${cmdDesc}\n`;
            }

            categoryEmbed.setDescription(description);

            await selectInteraction.reply({
                embeds: [categoryEmbed],
                flags: MessageFlags.Ephemeral
            });
        });

        collector.on("end", () => {
            // El collector se termina después de 5 minutos
        });
    }
};
