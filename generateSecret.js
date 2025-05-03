const crypto = require('crypto');

const secret = crypto.randomBytes(64).toString('hex'); // Generates a random 64-byte string

console.log('Generated JWT_SECRET:', secret);
