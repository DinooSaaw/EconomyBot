const timestamp = new Date().toLocaleString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
});

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        client.user.setActivity('All the gold in the bank', { type: 'WATCHING' });

        console.log(`[${timestamp}] ✅ ${client.user.tag} is online!`);
    }
};
