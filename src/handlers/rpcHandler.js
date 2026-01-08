const config = require('../../config.json');
const { ActivityType } = require('discord.js');
const axios = require('axios');
const User = require('../models/User');

let currentRpcIndex = 0;
let bitcoinPrice = 'Cargando...';
let totalMembers = 0;

// Obtener precio del Bitcoin cada 5 minutos
const fetchBitcoinPrice = async () => {
    try {
        const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
        bitcoinPrice = `${response.data.bitcoin.usd.toLocaleString('en-US', { maximumFractionDigits: 2 })} USD`;
    } catch (error) {
        console.error('Error obteniendo precio de Bitcoin:', error.message);
        bitcoinPrice = 'No disponible';
    }
};

// Obtener cantidad de miembros ayudados (usuarios únicos)
const fetchTotalMembers = async () => {
    try {
        const count = await User.distinct('userId');
        totalMembers = count.length;
    } catch (error) {
        console.error('Error contando miembros:', error.message);
        totalMembers = 0;
    }
};

const setupRPC = (client) => {
    if (!client || !client.user) {
        console.error('Error: El cliente no esta listo para configurar RPC');
        return;
    }

    // Obtener datos al iniciar
    fetchBitcoinPrice();
    fetchTotalMembers();
    
    // Actualizar Bitcoin cada 5 minutos
    setInterval(fetchBitcoinPrice, 5 * 60 * 1000);
    // Actualizar miembros cada 2 minutos (antes era 10)
    setInterval(fetchTotalMembers, 2 * 60 * 1000);

    const updateRPC = () => {
        try {
            // Crear mensajes dinámicos sin emojis
            const dynamicMessages = [
                {
                    name: `En ${client.guilds.cache.size} servidores`,
                    type: ActivityType.Streaming,
                    url: `https://discord.gg/JMzfmyf5KN`
                },
                {
                    name: `Bitcoin: ${bitcoinPrice}`,
                    type: ActivityType.Streaming,
                    url: `https://discord.gg/JMzfmyf5KN`
                },
                {
                    name: `Ayudando a ${totalMembers} miembros`,
                    type: ActivityType.Streaming,
                    url: `https://discord.gg/JMzfmyf5KN`
                }
            ];

            const rpc = dynamicMessages[currentRpcIndex % dynamicMessages.length];
            
            client.user.setPresence({
                activities: [
                    {
                        name: rpc.name,
                        type: rpc.type,
                        url: rpc.url
                    }
                ],
                status: 'online'
            });

            currentRpcIndex = (currentRpcIndex + 1) % dynamicMessages.length;
        } catch (error) {
            console.error('Error actualizando RPC:', error.message);
        }
    };

    // Actualizar el RPC inmediatamente y luego cada 30 segundos
    updateRPC();
    setInterval(updateRPC, 30000);
};

module.exports = setupRPC;
