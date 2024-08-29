const dgram = require('node:dgram');
const dnsPacket = require('dns-packet');

const server = dgram.createSocket('udp4');

const db = {
    'www.thecurfewjunction.com': '76.76.21.93',
    'helloayush.com': '142.250.193.238'
};

server.on('message', (msg, rinfo) => {
    try {
        const incomingReq = dnsPacket.decode(msg);
        const domainName = incomingReq.questions[0]?.name;
        const ipFromdb = db[domainName];

        // Check if the domain exists in the database
        if (!ipFromdb) {
            console.log(`Domain not found: ${domainName}`);
            return;
        }

        const ans = dnsPacket.encode({
            id: incomingReq.id,
            type: 'response',
            flags: dnsPacket.AUTHORITATIVE_ANSWER,
            questions: incomingReq.questions,
            answers: [{
                type: 'A',
                class: 'IN',
                name: domainName,
                ttl: 300, // Time to live for the DNS response
                data: ipFromdb
            }]
        });

        // Send response back to the client
        server.send(ans, rinfo.port, rinfo.address, (error) => {
            if (error) {
                console.error('Error sending response:', error);
            } else {
                console.log(`Responded to ${domainName} with IP ${ipFromdb}`);
            }
        });
    } catch (error) {
        console.error('Error processing message:', error);
    }
});

server.bind(53, () => {
    console.log('DNS server running on Port 53');
});
