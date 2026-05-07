import Razorpay from 'razorpay';
console.log('Razorpay package loaded successfully');
try {
    const instance = new Razorpay({
        key_id: 'test',
        key_secret: 'test'
    });
    console.log('Razorpay instance created successfully');
} catch (error) {
    console.error('Error creating Razorpay instance:', error);
}
