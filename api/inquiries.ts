import mongoose from 'mongoose';
import axios from 'axios';
import nodemailer from 'nodemailer';

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/yared_engineer';

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI);
};

// Telegram Config
const TELEGRAM_TOKEN = '8541210751:AAEWbQsQYSfD4_OhKPQzaX6ccWzq6zBQSqs';
const CHAT_ID = '5983528814';

const sendTelegram = async (orderData: any) => {
  const message = `🔔 አዲስ ትዕዛዝ ተለያል ቦታዊ!\n\n👤 ስም: ${orderData.customerName || orderData.fullName}\n📞 ስፖት: ${orderData.phoneNumber}\n🛠️ አገልግሎት: ${orderData.serviceType || 'Inquiry'}\n📄 ፋይል: N/A`;
  try {
    await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      chat_id: CHAT_ID,
      text: message
    });
  } catch (err) {
    console.error("Telegram error:", err);
  }
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
    subject: `New request: ${orderData.serviceType || 'Inquiry'}`,
    text: `New request details:\n\nCustomer Name: ${orderData.clientName || orderData.fullName}\nPhone: ${orderData.phoneNumber}\nEmail: ${orderData.email || 'N/A'}\nService: ${orderData.serviceType || 'Inquiry'}\nMessage: ${orderData.message || 'N/A'}`
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('Email error:', err);
    throw err;
  }
};

// Inquiry Schema
let Inquiry: any;
try {
  Inquiry = mongoose.model('Inquiry');
} catch {
  const inquirySchema = new mongoose.Schema({
    fullName: String,
    phoneNumber: String,
    message: String,
    date: { type: Date, default: Date.now }
  });
  Inquiry = mongoose.model('Inquiry', inquirySchema);
}

export default async function handler(req: any, res: any) {
  try {
    await connectDB();

    if (req.method === 'GET') {
      const data = await Inquiry.find().sort({ date: -1 });
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const inquiry = new Inquiry(req.body);
      await inquiry.save();

      // Send Telegram notification
      await sendTelegram({
        customerName: inquiry.fullName,
        phoneNumber: inquiry.phoneNumber,
        serviceType: 'Inquiry',
        message: inquiry.message
      }).catch(err => console.log("Telegram Error (Inquiry)", err));

      // Send email notification
      await sendEmail({
        clientName: inquiry.fullName,
        phoneNumber: inquiry.phoneNumber,
        email: '',
        serviceType: 'Inquiry',
        message: inquiry.message
      }).catch(err => console.log("Email Error (Inquiry)", err));

      return res.status(201).json({ message: 'ለተላለፈ ተመለሰ! ✅', inquiry });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      await Inquiry.findByIdAndDelete(id);
      return res.status(200).json({ message: 'Inquiry deleted' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}