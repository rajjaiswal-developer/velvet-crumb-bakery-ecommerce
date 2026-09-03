async function testLogin() {
  const res = await fetch('http://localhost:3000/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.ADMIN_EMAIL || 'admin@velvetcrumbdemo.com',
      password: process.env.ADMIN_PASSWORD || ''
    })
  });
  const data = await res.json();
  console.log('STATUS:', res.status);
  console.log('RESPONSE:', data);
}

testLogin();
