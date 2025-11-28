import mongoose from 'mongoose';
import Product from './models/Product.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/ecommerce_admin";

async function migrateProductFields() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all products
    const products = await Product.find({});
    console.log(`\n📦 Found ${products.length} products`);

    let updatedCount = 0;
    
    for (const product of products) {
      let needsUpdate = false;
      const updates = {};

      // Check and add missing fields
      if (product.description === undefined || product.description === null) {
        updates.description = "";
        needsUpdate = true;
      }
      if (product.purpose === undefined || product.purpose === null) {
        updates.purpose = "";
        needsUpdate = true;
      }
      if (product.features === undefined || product.features === null) {
        updates.features = "";
        needsUpdate = true;
      }
      if (product.materials === undefined || product.materials === null) {
        updates.materials = "";
        needsUpdate = true;
      }
      if (product.care === undefined || product.care === null) {
        updates.care = "";
        needsUpdate = true;
      }
      if (product.isProductHighlight === undefined || product.isProductHighlight === null) {
        updates.isProductHighlight = false;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await Product.updateOne({ _id: product._id }, { $set: updates });
        updatedCount++;
        console.log(`✅ Updated product: ${product.title}`);
      }
    }

    console.log(`\n✅ Migration complete! Updated ${updatedCount} products`);
    
    // Verify one product
    const testProduct = await Product.findOne().sort({ createdAt: -1 });
    if (testProduct) {
      console.log('\n📝 Sample product after migration:');
      console.log('Title:', testProduct.title);
      console.log('Description:', testProduct.description);
      console.log('Purpose:', testProduct.purpose);
      console.log('Features:', testProduct.features);
      console.log('Materials:', testProduct.materials);
      console.log('Care:', testProduct.care);
    }

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrateProductFields();

