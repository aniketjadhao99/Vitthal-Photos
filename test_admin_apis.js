const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const email = 'admin@vitthal.com';
const password = 'admin123';

async function testAdminAPIs() {
    try {
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_URL}/users/login`, { email, password });
        const token = loginRes.data.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        console.log('✅ Login successful');

        const endpoints = ['products', 'orders', 'users', 'reviews', 'settings'];
        for (const ep of endpoints) {
            try {
                const res = await axios.get(`${API_URL}/${ep}`, config);
                console.log(`✅ GET /api/${ep}: ${Array.isArray(res.data) ? res.data.length + ' items' : 'Object returned'}`);
            } catch (e) {
                console.error(`❌ GET /api/${ep} failed:`, e.response ? e.response.status : e.message);
            }
        }
    } catch (error) {
        console.error('❌ Test failed:', error.response ? error.response.data : error.message);
    }
}

testAdminAPIs();
