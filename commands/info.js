const { SlashCommandBuilder } = require('discord.js');
const os = require('os');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Displays bot information and statistics.'),
    async execute(interaction) {
        const client = interaction.client;
        const uptime = process.uptime();
        const uptimeString = new Date(uptime * 1000).toISOString().substr(11, 8);
        const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const latency = client.ws.ping >= 0 ? Math.round(client.ws.ping) : "N/A";  // Ensuring valid latency value
        const nodeVersion = process.version;
        const platform = os.platform();
        const arch = os.arch();
        const cpus = os.cpus().length;  // Number of CPU cores

        const embed = {
            color: 0xFFD700,
            title: '🤖 Bot Information',
            fields: [
                { name: '📌 Bot Name', value: client.user.tag, inline: true },
                { name: '🕰️ Uptime', value: `${uptimeString}`, inline: true },
                { name: '💾 Memory Usage', value: `${memoryUsage} MB`, inline: true },
                { name: '📡 Servers', value: `${client.guilds.cache.size}`, inline: true },
                { name: '👥 Users', value: `${client.users.cache.size}`, inline: true },
                { name: '⚡ Latency', value: `${latency} ms`, inline: true },
                { name: '🔧 Developer', value: '<@247163579424309268>', inline: true },
                // { name: '💻 Node.js Version', value: `${nodeVersion}`, inline: true },
                // { name: '🖥️ Platform', value: `${platform}`, inline: true },
                // { name: '🏋️‍♂️ CPU Cores', value: `${cpus}`, inline: true },
                // { name: '💻 Architecture', value: `${arch}`, inline: true },
            ],
            footer: { text: `Requested by ${interaction.user.tag}`, icon_url: interaction.user.displayAvatarURL() },
            timestamp: new Date(),
        };

        await interaction.reply({ embeds: [embed] });
    }
};
