import mongoose from 'mongoose';

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/yared_engineer';

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI);
};

// Inquiry Schema - Check if model exists to avoid redefinition
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