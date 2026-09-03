const http = require('http');

http.get('http://localhost:3000/api/products/public', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('HTTP Status:', res.statusCode);
    try {
      const parsed = JSON.parse(data);
      console.log('Success:', parsed.success);
      console.log('Products Count:', parsed.data ? parsed.data.length : 0);
      if (parsed.data && parsed.data.length > 0) {
        console.log('Sample Product:', parsed.data[0].name);
      }
    } catch (e) {
      console.log('Raw output:', data);
    }
  });
}).on('error', (err) => {
  console.error('Error fetching API:', err.message);
});
