require('dotenv').config();
const mongoose = require('mongoose');
const Vendor = require('./models/vendor.model');
const RFP = require('./models/rfp.model');
const Proposal = require('./models/proposal.model');

const mongoUrl = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/ai_rfp_mvp';

async function main(){
  console.log('Connecting to Mongo at', mongoUrl);
  await mongoose.connect(mongoUrl);
  console.log('Connected to Mongo for seeding...');

  // Clear existing data (idempotent)
  await Vendor.deleteMany({});
  await RFP.deleteMany({});
  await Proposal.deleteMany({});

  const v1 = await Vendor.create({
    name: 'Vendor One Pvt Ltd',
    email: 'vendor1@example.com',
    contactPerson: 'Alice',
    metadata: { region: 'IN', rating: 4.2 }
  });

  const v2 = await Vendor.create({
    name: 'Vendor Two Solutions',
    email: 'vendor2@example.com',
    contactPerson: 'Bob',
    metadata: { region: 'IN', rating: 3.9 }
  });

  const rfp = await RFP.create({
    title: 'Office laptops and monitors',
    description: 'Need 20 laptops (16GB RAM) and 15 monitors (27-inch). Budget $50,000, delivery 30 days, payment net 30, warranty 12 months.',
    structured: {
      title: 'Office laptops and monitors',
      items: [
        { name: 'Laptop', qty: 20, spec: '16GB RAM, 512GB SSD' },
        { name: 'Monitor', qty: 15, spec: '27-inch' }
      ],
      budget_total: 50000,
      delivery_days: 30,
      payment_terms: 'net 30',
      warranty_months: 12
    }
  });

  console.log('Seeded: ', { vendor1: v1.email, vendor2: v2.email, rfpId: rfp._id.toString() });

  await mongoose.disconnect();
  console.log('Disconnected from Mongo. Seed complete.');
}

main().catch(err => {
  console.error('SEED ERROR:', err);
  process.exit(1);
});