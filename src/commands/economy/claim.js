const User = require("../../models/User");
const { EmbedBuilder, MessageFlags } = require("discord.js");

module.exports = {
    name: "claim",
    description: "Reclama un drop de BTC en el canal.",
    testOnly: true,
    callback: async (client, interaction) => {
        if (!interaction.inGuild()) {
            return interaction.reply({ content: "Solo puedes usar este comando en un servidor.", flags: MessageFlags.Ephemeral });
        }

        const dropChannelId = client.dropChannels.get(interaction.guild.id);
        const drop = client.activeDrops.get(dropChannelId);

        if (!drop || drop.claimed) {
            return interaction.reply({ content: "No hay ningún drop activo en este canal para reclamar.", flags: MessageFlags.Ephemeral });
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
            if (dropChannel) {
                const message = await dropChannel.messages.fetch(drop.messageId);
                await message.delete();
            }
        } catch (error) {
            console.error("Error eliminando el mensaje del drop:", error);
        }

        client.activeDrops.delete(dropChannelId);

        await interaction.reply(`¡Felicidades! ${interaction.user.username} ha reclamado el drop de **${drop.amount.toLocaleString()} BTC**.`);
        const replyMsg = await interaction.fetchReply();
        setTimeout(() => replyMsg.delete().catch(console.error), 5000);
    },
};