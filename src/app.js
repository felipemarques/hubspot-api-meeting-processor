const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const packageJson = require('../package.json');

dotenv.config({ path: path.join(__dirname, '../.env') });
process.env.VERSION = packageJson.version;

async function connectToDatabase() {
  try {
    const { MONGO_URI } = process.env;
    mongoose.set('strictQuery', false);
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

function initializeWorkers() {
  console.log('🚀 Initializing workers...');
  require('./domain/entities/Domain');
  require('./workers/hubspotWorker')();
}

function initializeServer() {
  console.log('🖥️  Starting server...');
  require('./infra/server'); 
}

async function main() {
  process.env.instance = 'app';
  await connectToDatabase();
  initializeWorkers();
  initializeServer();
}

main();
