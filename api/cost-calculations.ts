import mongoose from 'mongoose';
import multer from 'multer';
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
  const message = `🔔 አዲስ ትዕዛዝ ተለያል ቦታዊ!\n\n👤 ስም: ${orderData.customerName || orderData.clientName}\n📞 ስፖት: ${orderData.phoneNumber}\n🛠️ አገልግሎት: ${orderData.serviceType || 'Cost Calculation'}\n📄 ፋይል: ${orderData.planFile || 'N/A'}`;
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
      pass: 'adki kdwx quqc uqro' // App Password
    }
  });

  const mailOptions = {
    from: 'hagezomfurtuna@gmail.com',
    to: 'hagezomfurtuna@gmail.com',
    subject: `New service request: ${orderData.serviceType || 'Cost Calculation'}`,
    text: `New service request details:\n\nCustomer Name: ${orderData.clientName}\nPhone: ${orderData.phoneNumber}\nEmail: ${orderData.email}\nService: ${orderData.serviceType}\nPlan file: ${orderData.planFile || 'N/A'}`
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("Email error:", err);
    throw err;
  }
};

// CostCalculation Schema
let CostCalculation: any;
try {
  CostCalculation = mongoose.model('CostCalculation');
} catch {
  const costCalculationSchema = new mongoose.Schema({
    clientName: String,
    phoneNumber: String,
    email: String,
    serviceType: String,
    planFile: String,
    estimateFile: String,
    status: { type: String, default: 'pending' },
    date: { type: Date, default: Date.now }
  });
  CostCalculation = mongoose.model('CostCalculation', costCalculationSchema);
}

// Multer setup for Vercel (use /tmp for temporary storage)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/tmp'); // Vercel temporary directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

export default async function handler(req: any, res: any) {
  try {
    await connectDB();

    if (req.method === 'GET') {
      const data = await CostCalculation.find().sort({ date: -1 });
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      // Handle file upload
      upload.single('planFile')(req, res, async (err) => {
        if (err) {
          console.error('Upload error:', err);
          return res.status(500).json({ error: 'File upload failed' });
        }

        const calcData = {
          clientName: req.body.clientName,
          phoneNumber: req.body.phoneNumber,
          email: req.body.email,
          serviceType: req.body.serviceType,
          planFile: req.file ? req.file.filename : null,
          status: 'pending'
        };

        const calc = new CostCalculation(calcData);
        await calc.save();

        // Send notifications
        await sendTelegram(calcData).catch(err => console.log("Telegram Error (Cost Calc)", err));
        await sendEmail(calcData).catch(err => console.log("Email Error (Cost Calc)", err));

        return res.status(201).json({ message: 'Cost calculation submitted successfully', calc });
      });
      return; // Don't return here, multer handles the response
    }

    if (req.method === 'PUT') {
      const { id } = req.query;
      upload.single('estimateFile')(req, res, async (err) => {
        if (err) {
          console.error('Upload error:', err);
          return res.status(500).json({ error: 'File upload failed' });
        }

        const update: any = { status: req.body.status };
        if (req.file) update.estimateFile = req.file.filename;

        const updated = await CostCalculation.findByIdAndUpdate(id, update, { new: true });
        return res.status(200).json(updated);
      });
      return;
    }

    if (req.method === 'DELETE') {
      if (req.query.id) {
        await CostCalculation.findByIdAndDelete(req.query.id);
        return res.status(200).json({ message: 'Cost calculation deleted' });
      } else {
        await CostCalculation.deleteMany({});
        return res.status(200).json({ message: 'All cost calculations deleted' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export const config = {
  api: {
    bodyParser: false, // Disable body parser for multer
  },
};