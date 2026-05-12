import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/yared_engineer';

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI);
};

let Product: any;
try {
  Product = mongoose.model('Product');
} catch {
  const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    date: { type: Date, default: Date.now }
  });
  Product = mongoose.model('Product', productSchema);
}

export default async function handler(req: any, res: any) {
  try {
    await connectDB();

    if (req.method === 'GET') {
      const products = await Product.find().sort({ date: -1 });
      return res.status(200).json(products);
    }

    if (req.method === 'POST') {
      const product = new Product({
        name: req.body.name,
        price: Number(req.body.price)
      });
      await product.save();
      return res.status(201).json({ message: 'Product added successfully!', product });
    }

    if (req.method === 'PUT') {
      const { id } = req.query;
      const updated = await Product.findByIdAndUpdate(id, { price: Number(req.body.price) }, { new: true });
      return res.status(200).json(updated);
    }

    if (req.method === 'DELETE') {
      if (req.query.id) {
        await Product.findByIdAndDelete(req.query.id);
        return res.status(200).json({ message: 'Product deleted' });
      }
      await Product.deleteMany({});
      return res.status(200).json({ message: 'All products deleted' });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Products API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
