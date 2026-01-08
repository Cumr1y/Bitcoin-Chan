const User = require("../../models/User");
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");

module.exports = {
    name: "giveaway",
    description: "Crea un sorteo de BTC",
    options: [
        {
            name: "premio",
            description: "Cantidad de BTC del premio",
            type: 4,
            required: true,
        },
        {
            name: "costo",
            description: "Costo en BTC para entrar al sorteo",
            type: 4,
            required: true,
        },
        {
            name: "ganadores",
            description: "Cantidad de ganadores",
            type: 4,
            required: false,
        },
        {
            name: "duracion",
            description: "Duración en minutos (default: 10)",
            type: 4,
            required: false,
        },
    ],
    callback: async (client, interaction) => {
        if (!interaction.inGuild()) {
            return interaction.reply({ content: "Solo en servidores.", flags: MessageFlags.Ephemeral });
        }

        const premio = interaction.options.getInteger("premio");
        const costo = interaction.options.getInteger("costo");
        const ganadores = interaction.options.getInteger("ganadores") || 1;
        const duracionMinutos = interaction.options.getInteger("duracion") || 10;

        if (premio <= 0 || costo <= 0 || ganadores <= 0) {
            return interaction.reply({ content: "Los valores deben ser mayores a 0.", flags: MessageFlags.Ephemeral });
        }

        const giveawayId = `${interaction.guild.id}-${Date.now()}`;
        const finTime = Date.now() + duracionMinutos * 60 * 1000;

        // Guardar sorteo en memoria del bot
        if (!client.giveaways) client.giveaways = new Map();
        client.giveaways.set(giveawayId, {
            guildId: interaction.guild.id,
            creatorId: interaction.user.id,
            premio,
            costo,
            ganadores: Math.min(ganadores, 10), // Máximo 10 ganadores
            participantes: [],
            finTime,
            messageId: null,
            ended: false,
        });

        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle("🎁 SORTEO DE BTC")
            .addFields(
                { name: "Premio", value: `${premio} BTC`, inline: true },
                { name: "Costo", value: `${costo} BTC`, inline: true },
                { name: "Ganadores", value: `${Math.min(ganadores, 10)}`, inline: true },
                { name: "Creador", value: `${interaction.user}`, inline: false },
                { name: "Termina en", value: `<t:${Math.floor(finTime / 1000)}:R>`, inline: false }
            )
            .setFooter({ text: `Participantes: 0` });

        const button = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`giveaway_join_${giveawayId}`)
                .setLabel(`Participar (${costo} BTC)`)
                .setStyle(ButtonStyle.Success)
        );

        const msg = await interaction.reply({ embeds: [embed], components: [button], fetchReply: true });
        
        // Guardar ID del mensaje
        const giveaway = client.giveaways.get(giveawayId);
        giveaway.messageId = msg.id;

        // Auto-finalizar el sorteo
        setTimeout(() => finalizarSorteo(client, giveawayId, interaction.channel), duracionMinutos * 60 * 1000);
    },
};

async function finalizarSorteo(client, giveawayId, channel) {
    if (!client.giveaways) return;
    
    const giveaway = client.giveaways.get(giveawayId);
    if (!giveaway || giveaway.ended) return;

    giveaway.ended = true;

    if (giveaway.participantes.length === 0) {
        const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle("❌ Sorteo Cancelado")
            .setDescription("No hay participantes en el sorteo.");
        
        try {
            const msg = await channel.messages.fetch(giveaway.messageId);
            await msg.edit({ embeds: [embed], components: [] });
        } catch (e) {
            console.error("Error editando mensaje de sorteo:", e);
        }
        return;
    }

    // Seleccionar ganadores
    const ganadores = [];
    const participantesTemp = [...giveaway.participantes];
    
    for (let i = 0; i < giveaway.ganadores && participantesTemp.length > 0; i++) {
        const indice = Math.floor(Math.random() * participantesTemp.length);
        ganadores.push(participantesTemp[indice]);
        participantesTemp.splice(indice, 1);
    }

    // Dar premio a ganadores
    for (const userId of ganadores) {
        try {
            let user = await User.findOne({ userId, guildId: giveaway.guildId });
            if (!user) {
                user = new User({ userId, guildId: giveaway.guildId });
            }
            user.balance += giveaway.premio;
            await user.save();
        } catch (e) {
            console.error("Error dando premio:", e);
        }
    }

    const embed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle("🏆 Sorteo Finalizado")
        .addFields(
            { name: "Ganadores", value: ganadores.map(id => `<@${id}>`).join("\n") || "Ninguno", inline: false },
            { name: "Premio", value: `${giveaway.premio} BTC cada uno`, inline: true },
            { name: "Participantes", value: `${giveaway.participantes.length}`, inline: true }
        );

    try {
        const msg = await channel.messages.fetch(giveaway.messageId);
        await msg.edit({ embeds: [embed], components: [] });
    } catch (e) {
        console.error("Error editando mensaje final:", e);
    }

    client.giveaways.delete(giveawayId);
}
