const mongoose = require('mongoose');
require('dotenv').config({path: './.env'});

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const db = mongoose.connection.collection('orders');
  const result = await db.updateMany({ isPaid: false }, { $set: { isPaid: true, paidAt: new Date() } });
  console.log('Updated orders:', result.modifiedCount);
  process.exit(0);
}).catch(console.error);
