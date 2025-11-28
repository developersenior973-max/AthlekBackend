import mongoose from 'mongoose';
import Bundle from './models/Bundle.js';

async function checkBundles() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/athelik');

    console.log('🔍 Checking bundle data...\n');

    // Get all bundles
    const allBundles = await Bundle.find({}).populate('products');
    console.log(`📦 Total bundles found: ${allBundles.length}\n`);

    allBundles.forEach((bundle, index) => {
      console.log(`Bundle ${index + 1}:`);
      console.log(`  Name: ${bundle.name}`);
      console.log(`  isActive: ${bundle.isActive}`);
      console.log(`  startDate: ${bundle.startDate}`);
      console.log(`  endDate: ${bundle.endDate}`);
      console.log(`  category: ${bundle.category}`);
      console.log(`  products: ${bundle.products.length}`);
      console.log('');
    });

    // Check active bundles with date filtering
    const now = new Date();
    console.log(`🕐 Current time: ${now.toISOString()}\n`);

    const activeBundles = await Bundle.find({
      isActive: true,
      $and: [
        {
          $or: [
            { startDate: { $exists: false } },
            { startDate: { $lte: now } }
          ]
        },
        {
          $or: [
            { endDate: { $exists: false } },
            { endDate: { $gte: now } }
          ]
        }
      ]
    }).populate('products');

    console.log(`✅ Active bundles found: ${activeBundles.length}\n`);

    activeBundles.forEach((bundle, index) => {
      console.log(`Active Bundle ${index + 1}:`);
      console.log(`  Name: ${bundle.name}`);
      console.log(`  startDate: ${bundle.startDate}`);
      console.log(`  endDate: ${bundle.endDate}`);
      console.log(`  category: ${bundle.category}`);
      console.log('');
    });

    await mongoose.disconnect();
    console.log('✅ Database connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkBundles();
