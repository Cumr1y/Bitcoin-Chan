const { EmbedBuilder, MessageFlags } = require('discord.js');
const { deleteModel } = require('mongoose');

module.exports = {
    name: "testdrop",
    description: "Genera un drop de BTC manualmente para testing.",
    deleted: true,
    callback: async (client, interaction) => {
        if (!interaction.inGuild()) {
            return interaction.reply({ content: "Este comando solo funciona en un servidor.", flags: MessageFlags.Ephemeral });
        }

        // Verificar si hay un drop activo en el canal
        if (client.activeDrops.has(interaction.channel.id)) {
            return interaction.reply({ content: "Ya hay un drop activo en este canal.", flags: MessageFlags.Ephemeral });
        }

        // Generar cantidad aleatoria
        let amount;
        if (Math.random() < 0.85) {
            // 85% de chance: Drop normal (50-300 BTC)
            amount = Math.floor(Math.random() * 250) + 50;
        } else {
            // 15% de chance: Drop raro (300-1000 BTC)
            amount = Math.floor(Math.random() * 700) + 300;
        }

        const embed = new EmbedBuilder()
            .setTitle("💰 Drop de BTC!")
            .setDescription("Un drop de BTC ha aparecido! Escribe `bc claim` para reclamarlo.")
            .setColor(0xffff00)
            .setImage('https://c.tenor.com/IAd79sYP2JIAAAAC/tenor.gif') // URL del GIF para el drop
            .setTimestamp();

        try {
            const dropMessage = await interaction.channel.send({ embeds: [embed] });
            client.activeDrops.set(interaction.channel.id, {
                messageId: dropMessage.id,
                message: dropMessage,
                amount,
                claimed: false,
                claimer: null
            });

            setTimeout(() => {
                const drop = client.activeDrops.get(interaction.channel.id);
                if (drop && !drop.claimed) {
                    drop.claimed = true;
                    client.activeDrops.delete(interaction.channel.id);
                    dropMessage.edit({ embeds: [new EmbedBuilder()
                        .setTitle("💰 Drop Expirado")
                        .setDescription("El drop de BTC ha expirado sin ser reclamado.")
                        .setColor(0xff0000)
                        .setTimestamp()] }).catch(console.error);
                    setTimeout(() => dropMessage.delete().catch(console.error), 30000);
                }
            }, 30 * 1000); // 30 segundos

            await interaction.reply({ content: "Drop generado exitosamente.", flags: MessageFlags.Ephemeral });
        } catch (error) {
            console.error("Error enviando drop:", error);
            await interaction.reply({ content: "Error al generar el drop.", flags: MessageFlags.Ephemeral });
        }
    },
    execute: async (client, message, args) => {
        if (!message.guild) {
            return message.channel.send("Este comando solo funciona en un servidor.");
        }

        // Verificar si hay un drop activo en el canal
        if (client.activeDrops.has(message.channel.id)) {
            return message.channel.send("Ya hay un drop activo en este canal.");
        }

        // Generar cantidad aleatoria
        let amount;
        if (Math.random() < 0.85) {
            // 85% de chance: Drop normal (50-300 BTC)
            amount = Math.floor(Math.random() * 250) + 50;
        } else {
            // 15% de chance: Drop raro (300-1000 BTC)
            amount = Math.floor(Math.random() * 700) + 300;
        }

        const embed = new EmbedBuilder()
            .setTitle("💰 Drop de BTC!")
            .setDescription("Un drop de BTC ha aparecido! Escribe `bc claim` para reclamarlo.")
            .setColor(0xffff00)
            .setImage('https://c.tenor.com/IAd79sYP2JIAAAAC/tenor.gif') // URL del GIF para el drop
            .setTimestamp();

        try {
            const dropMessage = await message.channel.send({ embeds: [embed] });
            client.activeDrops.set(message.channel.id, {
                messageId: dropMessage.id,
                message: dropMessage,
                amount,
                claimed: false,
                claimer: null
            });

            setTimeout(() => {
                const drop = client.activeDrops.get(message.channel.id);
                if (drop && !drop.claimed) {
                    drop.claimed = true;
                    client.activeDrops.delete(message.channel.id);
                    dropMessage.edit({ embeds: [new EmbedBuilder()
                        .setTitle("💰 Drop Expirado")
                        .setDescription("El drop de BTC ha expirado sin ser reclamado.")
                        .setColor(0xff0000)
                        .setTimestamp()] }).catch(console.error);
                    setTimeout(() => dropMessage.delete().catch(console.error), 30000);
                }
            }, 30 * 1000); // 30 segundos
        } catch (error) {
            console.error("Error enviando drop:", error);
            message.channel.send("Error al generar el drop.");
        }
    }
};