const fs = require('fs');
const path = require('path');

console.log('🎭 PGPoetry Setup');
console.log('==================\n');

// Check if .env file exists
const envPath = path.join(__dirname, 'server', '.env');
const envExamplePath = path.join(__dirname, 'server', 'env.example');

if (!fs.existsSync(envPath)) {
    console.log('📝 Creating .env file from template...');
    
    try {
        const envExample = fs.readFileSync(envExamplePath, 'utf8');
        fs.writeFileSync(envPath, envExample);
        console.log('✅ .env file created successfully!');
        console.log('⚠️  Please edit server/.env with your configuration before starting the server.\n');
    } catch (error) {
        console.error('❌ Error creating .env file:', error.message);
        console.log('📝 Please manually copy server/env.example to server/.env and configure it.\n');
    }
} else {
    console.log('✅ .env file already exists.\n');
}

console.log('🚀 Next steps:');
console.log('1. Make sure MongoDB is running');
console.log('2. Edit server/.env with your configuration');
console.log('3. Run: npm start');
console.log('4. Visit: http://localhost:3000');
console.log('5. Admin portal: http://localhost:3000/admin');
console.log('   Default credentials: admin / admin123\n');

console.log('📚 For more information, see README.md'); 