const User = require("../../models/User");
const { EmbedBuilder, MessageFlags } = require("discord.js");

module.exports = {
    name: "claim",
    description: "Reclama un drop de BTC en el canal.",
    testOnly: true,
    callback: async (client, interaction) => {
        // Defer reply para evitar timeout en operaciones largas
        await interaction.deferReply();

        if (!interaction.inGuild()) {
            return interaction.editReply({ content: "Solo puedes usar este comando en un servidor." });
        }

        const dropChannelId = client.dropChannels.get(interaction.guild.id);
        const drop = client.activeDrops.get(dropChannelId);

        if (!drop || drop.claimed) {
            return interaction.editReply({ content: "No hay ningún drop activo en este canal para reclamar." });
        }

        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        let user = await User.findOne({ userId, guildId });
        if (!user) {
            user = new User({ userId, guildId });
            await user.save();
        }

        user.balance += drop.amount;
        await user.save();

        drop.claimed = true;
        drop.claimer = interaction.user.username;

        try {
            const dropChannel = interaction.guild.channels.cache.get(dropChannelId);
            if (dropChannel && drop.messageId) {
                try {
                    const message = await dropChannel.messages.fetch(drop.messageId).catch(() => null);
                    if (message) {
                        await message.delete().catch(() => null);
                    }
                } catch (fetchError) {
                    // El mensaje ya no existe, ignorar silenciosamente
                }
            }
        } catch (error) {
            console.error("Error eliminando el mensaje del drop:", error.message);
        }

        client.activeDrops.delete(dropChannelId);

        const embed = new EmbedBuilder()
            .setTitle("✅ Drop Reclamado")
            .setDescription(`**${interaction.user.username}** ha reclamado el drop de **${drop.amount.toLocaleString()} BTC**.`)
            .setColor(0x00FF00)
            .setTimestamp();

        const response = await interaction.editReply({ embeds: [embed] });
        setTimeout(() => response.delete().catch(() => null), 5000);
    },
};