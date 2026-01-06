const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../../models/User');
const Level = require('../../models/Level');

module.exports = {
    name: 'leaderboard',
    description: 'Muestra el top 10 de usuarios por Nivel o BTC en todos los servidores!',
    testOnly: true,
    options: [
        {
            name: 'type',
            description: '¿Ver top por Nivel o BTC?',
            type: 3,
            choices: [
                { name: 'Nivel', value: 'level' },
                { name: 'BTC', value: 'balance' },
            ],
            required: false,
        },
    ],
    callback: async (client, interaction) => {
        await interaction.deferReply();

        console.log('Iniciando /leaderboard para', interaction.user.id);
        try {
            const type = interaction.options.getString('type') || 'level';
            const leaderboard = await generateLeaderboard(client, interaction.guildId, type);
            const embed = createLeaderboardEmbed(client, leaderboard, type, interaction.user.id);
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error en leaderboard:', error.stack);
            await interaction.editReply({ content: 'Oh no, no pude generar el leaderboard...' });
        }
    },
    execute: async (client, message, args) => {
        console.log('Iniciando leaderboard para', message.author.id);
        try {
            const type = args[0] && ['level', 'balance'].includes(args[0].toLowerCase()) ? args[0].toLowerCase() : 'level';
            const leaderboard = await generateLeaderboard(client, message.guildId, type);
            const embed = createLeaderboardEmbed(client, leaderboard, type, message.author.id);
            await message.channel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Error en leaderboard:', error.stack);
            await message.channel.send('Ay, algo salió mal con el leaderboard...').catch(console.error);
        }
    },
};

async function generateLeaderboard(client, currentGuildId, type) {
    console.log(`Generando leaderboard por ${type}...`);
    const users = await User.find().lean();
    const levels = await Level.find({ guildId: currentGuildId }).lean();
    const userMap = new Map();

    users.forEach(user => {
        const key = user.userId;
        const userLevel = levels.find(level => level.userId === key);
        const existing = userMap.get(key) || { balance: 0, level: 0 };
        userMap.set(key, {
            balance: user.balance,
            level: userLevel ? userLevel.level : 0,
            userId: key,
        });
    });

    // Ordenar según el tipo seleccionado
    const leaderboard = Array.from(userMap.entries()).map(([userId, data]) => ({
        userId,
        balance: data.balance,
        level: data.level,
    })).sort((a, b) => type === 'level' ? b.level - a.level : b.balance - a.balance);

    return leaderboard.slice(0, 10);
}

function createLeaderboardEmbed(client, leaderboard, type, creatorId) {
    const medals = ['🥇', '🥈', '🥉'];
    
    const isLevel = type === 'level';
    const embed = new EmbedBuilder()
        .setTitle(isLevel ? '📊 TOP 10 USUARIOS POR NIVEL 📊' : '💰 TOP 10 USUARIOS POR BTC 💰')
        .setColor(isLevel ? 0x9D4EDD : 0xFFD700)
        .setDescription(isLevel ? 'Ranking de los usuarios con mayor nivel en el servidor. ¡Sube de nivel escribiendo mensajes!' : 'Ranking de los usuarios más ricos del servidor. ¡Sube de posición acumulando BTC!')
        .setThumbnail(isLevel ? 'https://www.svgrepo.com/show/349375/achievement.svg' : 'https://s2.coinmarketcap.com/static/img/coins/200x200/1.png')
        .setFooter({ text: 'Actualizado en tiempo real', iconURL: client.user.displayAvatarURL() })
        .setTimestamp();

    if (leaderboard.length === 0) {
        embed.setDescription('Oh, no hay datos para mostrar aún...');
        return embed;
    }

    leaderboard.forEach((entry, index) => {
        const user = client.users.cache.get(entry.userId);
        const displayName = user ? (user.displayName || user.username) : `Usuario Desconocido`;
        
        // Agregar medalla para los top 3
        const medal = index < 3 ? medals[index] : `${index + 1}.`;
        const fieldName = `${medal} ${displayName}`;
        
        // Formatear el valor según el tipo
        const value = isLevel 
            ? `📊 **Nivel ${entry.level}** | 💵 ${entry.balance.toLocaleString()} BTC`
            : `💵 **${entry.balance.toLocaleString()} BTC** | 📊 Nivel ${entry.level}`;
        
        embed.addFields({
            name: fieldName,
            value: value,
            inline: false,
        });
    });

    return embed;
}