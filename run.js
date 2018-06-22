const fs = require('fs');

const SalienScript = require('./src/index.js');

let token;

try {
  token = fs.readFileSync('./token.txt').toString().trim();
} catch (e) {
  console.log("\nYou probably haven't created a token file...");
  console.log('Please read the README.md\n');
  console.log(e);
}

if (token) {
  const salien = new SalienScript({ token });

  salien.run();
}
