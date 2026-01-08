const User = require("../../models/User");
const Giveaway = require("../../models/Giveaway");
const { MessageFlags, EmbedBuilder } = require("discord.js");

module.exports = async (client, interaction) => {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith("giveaway_join_")) return;

    const giveawayId = interaction.customId.replace("giveaway_join_", "");
    const giveaway = await Giveaway.findOne({ giveawayId });

    if (!giveaway || giveaway.estado !== 'activo') {
        return interaction.reply({ content: "Este sorteo ya terminó.", flags: MessageFlags.Ephemeral });
    }

    if (giveaway.participantes.includes(interaction.user.id)) {
        return interaction.reply({ content: "Ya participas en este sorteo.", flags: MessageFlags.Ephemeral });
    }

    // Verificar si el usuario tiene suficientes BTC
    let user = await User.findOne({ userId: interaction.user.id, guildId: interaction.guild.id });
    if (!user) {
        user = new User({ userId: interaction.user.id, guildId: interaction.guild.id });
        await user.save();
    }

    if (user.balance < giveaway.costo) {
        return interaction.reply({
            content: `No tienes suficientes BTC. Necesitas **${giveaway.costo} BTC** y tienes **${user.balance} BTC**.`,
            flags: MessageFlags.Ephemeral,
        });
    }

    // Restar BTC
    user.balance -= giveaway.costo;
    await user.save();

    // Agregar a participantes
    giveaway.participantes.push(interaction.user.id);
    await giveaway.save();

    // Actualizar embed
    const embed = new EmbedBuilder()
        .setColor(0x7289DA)
        .setTitle("🎁 SORTEO")
        .addFields(
            { name: "Premio", value: giveaway.premio, inline: true },
            { name: "Costo", value: `${giveaway.costo} BTC`, inline: true },
            { name: "Ganadores", value: `${giveaway.ganadores}`, inline: true },
            { name: "Termina en", value: `<t:${Math.floor(giveaway.fechaFin.getTime() / 1000)}:R>`, inline: false }
        )
        .setFooter({ text: `Participantes: ${giveaway.participantes.length}` });

    try {
        const msg = await interaction.channel.messages.fetch(giveaway.messageId);
        await msg.edit({ embeds: [embed] });
    } catch (e) {
        console.error("Error actualizando embed:", e);
    }

    await interaction.reply({
        content: `✅ ¡Participando! Se te descontaron **${giveaway.costo} BTC**. Te quedan **${user.balance} BTC**.`,
        flags: MessageFlags.Ephemeral,
    });
};

