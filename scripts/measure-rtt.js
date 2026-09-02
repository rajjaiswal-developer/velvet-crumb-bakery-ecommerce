const net = require('net');

async function measureTcpRtt(host, port = 5432, samples = 5) {
  console.log(`Measuring TCP RTT to ${host}:${port}...`);
  const rtts = [];

  for (let i = 0; i < samples; i++) {
    const start = Date.now();
    await new Promise((resolve, reject) => {
      const socket = net.createConnection({ host, port, timeout: 5000 }, () => {
        const rtt = Date.now() - start;
        rtts.push(rtt);
        socket.destroy();
        resolve();
      });
      socket.on('error', (err) => {
        socket.destroy();
        reject(err);
      });
      socket.on('timeout', () => {
        socket.destroy();
        reject(new Error('Connection timeout'));
      });
    });
    await new Promise((r) => setTimeout(r, 200));
  }

  const avg = (rtts.reduce((a, b) => a + b, 0) / rtts.length).toFixed(1);
  console.log(`TCP RTT Samples: ${rtts.join(' ms, ')} ms`);
  console.log(`Average Network Round-Trip Time (RTT): ${avg} ms\n`);
  return parseFloat(avg);
}

measureTcpRtt('ep-gentle-shadow-awarbba6-pooler.c-12.us-east-1.aws.neon.tech', 5432)
  .catch(console.error);
