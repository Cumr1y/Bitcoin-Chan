const User = require("../../models/User");
const { MessageFlags } = require("discord.js");

module.exports = {
    name: "daily",
    description: "Obtén tu recompensa diaria de BTC.",
    testOnly: true,
    callback: async (client, interaction) => {
        if (!interaction.inGuild()) {
            return interaction.reply({ content: "Solo puedes usar este comando en un servidor.", flags: MessageFlags.Ephemeral });
        }

        await interaction.deferReply();

        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        console.log(`[Daily] Verificando usuario: ${userId}, guild: ${guildId}`);
        let user = await User.findOne({ userId, guildId }).catch(err => {
            console.error('[Daily] Error al buscar usuario:', err.stack);
            return null;
        });

        if (!user) {
            console.log(`[Daily] No se encontró usuario para ${userId} en guild ${guildId}, creando uno...`);
            user = new User({ userId, guildId, balance: 0, bankBalance: 0 });
            await user.save().catch(err => console.error('[Daily] Error al crear usuario:', err.stack));
            console.log(`[Daily] Nuevo usuario creado: ${userId} con balance ${user.balance}`);
        }

        const now = new Date();
        const lastDaily = user.lastDaily ? new Date(user.lastDaily) : null;
        const oneDay = 24 * 60 * 60 * 1000;

        if (lastDaily && now - lastDaily < oneDay) {
            const timeLeft = oneDay - (now - lastDaily);
            const hours = Math.floor(timeLeft / (60 * 60 * 1000));
            const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
            return interaction.editReply(`Ya reclamaste tu recompensa diaria. Vuelve en **${hours}h ${minutes}m**.`);
        }

        // Antes: const dailyReward = Math.floor(Math.random() * 451) + 50; // 50-500 BTC
        // Ahora: rango más bajo (10-50)
        const dailyReward = Math.floor(Math.random() * 41) + 10; // 10-50 BTC
        user.balance += dailyReward;
        user.lastDaily = now;
        await user.save().catch(err => console.error('[Daily] Error al guardar usuario:', err.stack));

        await interaction.editReply(`¡Reclamaste tu recompensa diaria! Obtuviste **${dailyReward.toLocaleString()} BTC**. Ahora tienes **${user.balance.toLocaleString()} BTC** en tu billetera. <a:coin:1388984040820052218>`);
    },
};