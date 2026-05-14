import mongoose from 'mongoose';
import dotenv from 'dotenv';
import StoreConfig from './models/StoreConfig.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('Connected to MongoDB');
  await StoreConfig.updateOne({}, { $set: { 'hero.image': '' } });
  console.log('Fixed hero image in db');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
