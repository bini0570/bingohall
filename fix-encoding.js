const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'backend', 'src', 'telegramBot.js');
const buffer = fs.readFileSync(file);

// Check if it starts with UTF-16 LE BOM (FF FE)
if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
    const str = buffer.toString('utf16le');
    fs.writeFileSync(file, str, 'utf8');
    console.log('Converted from UTF-16 LE to UTF-8');
} else {
    console.log('File does not have a UTF-16 LE BOM. Trying to read as UTF-8 directly.');
    fs.writeFileSync(file, buffer.toString('utf8'), 'utf8');
}

