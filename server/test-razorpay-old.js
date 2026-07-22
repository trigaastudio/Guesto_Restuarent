import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: 'rzp_test_SmMeIwLPbQ5lKQ',
  key_secret: 'BLhkFN8i18f7kl7ssqtfQrqy'
});

async function test() {
  try {
    const order = await razorpay.orders.create({
      amount: 15000, 
      currency: 'INR',
      receipt: 'test_receipt_123'
    });
    console.log('Success:', order);
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
