import mongoose from 'mongoose';
import axios from 'axios';
import nodemailer from 'nodemailer';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/yared_engineer';

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI);
};

const TELEGRAM_TOKEN = '8541210751:AAEWbQsQYSfD4_OhKPQzaX6ccWzq6zBQSqs';
const CHAT_ID = '5983528814';

const sendTelegram = async (orderData: any) => {
  const message = `🔔 New order placed!\n\nCustomer: ${orderData.customerName}\nPhone: ${orderData.phoneNumber}\nProduct: ${orderData.product}\nQuantity: ${orderData.quantity}`;
  await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    chat_id: CHAT_ID,
    text: message
  });
};

const sendEmail = async (orderData: any) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'hagezomfurtuna@gmail.com',
      pass: 'adki kdwx quqc uqro'
    }
  });

  const mailOptions = {
    from: 'hagezomfurtuna@gmail.com',
    to: 'hagezomfurtuna@gmail.com',
    subject: `New order placed: ${orderData.product}`,
    text: `New order details:\n\nCustomer Name: ${orderData.customerName}\nPhone: ${orderData.phoneNumber}\nProduct: ${orderData.product}\nQuantity: ${orderData.quantity}`
  };

  await transporter.sendMail(mailOptions);
};

let Order: any;
try {
  Order = mongoose.model('Order');
} catch {
  const orderSchema = new mongoose.Schema({
    customerName: String,
    phoneNumber: String,
    product: String,
    quantity: Number,
    status: { type: String, default: 'pending' },
    date: { type: Date, default: Date.now }
  });
  Order = mongoose.model('Order', orderSchema);
}

export default async function handler(req: any, res: any) {
  try {
    await connectDB();

    if (req.method === 'GET') {
      const orders = await Order.find().sort({ date: -1 });
      return res.status(200).json(orders);
    }

    if (req.method === 'POST') {
      const order = new Order({
        customerName: req.body.customerName,
        phoneNumber: req.body.phoneNumber,
        product: req.body.product,
        quantity: Number(req.body.quantity)
      });
      await order.save();

      await sendTelegram({
        customerName: order.customerName,
        phoneNumber: order.phoneNumber,
        product: order.product,
        quantity: order.quantity
      }).catch(err => console.error('Telegram Error (Order):', err));

      await sendEmail({
        customerName: order.customerName,
        phoneNumber: order.phoneNumber,
        product: order.product,
        quantity: order.quantity
      }).catch(err => console.error('Email Error (Order):', err));

      return res.status(201).json({ message: 'Order placed successfully!', order });
    }

    if (req.method === 'PUT') {
      const { id } = req.query;
      const updated = await Order.findByIdAndUpdate(id, { status: req.body.status }, { new: true });
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      if (req.query.id) {
        await Order.findByIdAndDelete(req.query.id);
        return res.status(200).json({ message: 'Order deleted' });
      }
      await Order.deleteMany({});
      return res.status(200).json({ message: 'All orders deleted' });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Orders API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
