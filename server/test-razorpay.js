import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: 'rzp_test_TGToISw86jbfcr',
  key_secret: 'jPp7wUJEy1XGsalPUyYIhGjn'
});

async function test() {
  try {
    const order = await razorpay.orders.create({
      amount: 15000, // 150 INR
      currency: 'INR',
      receipt: 'test_receipt_123'
    });
    console.log('Success:', order);
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
