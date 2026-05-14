const axios = require('axios');

async function checkOrders() {
    try {
        const response = await axios.get('http://localhost:5000/api/orders');
        console.log('Success:', response.data.success);
        console.log('Order Details:');
        response.data.data.forEach(o => {
            console.log(`- ${o.orderNumber}: type=${o.orderType}, status=${o.orderStatus}, payment=${o.paymentStatus}`);
        });
    } catch (error) {
        console.error('Error:', error.message);
    }
}

checkOrders();
