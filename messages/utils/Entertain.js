const fs = require('fs').promises;
const path = require('path');
const entertainPath = path.join(__dirname, '../../settings/entertain.json');

async function readEntertainFile() {
    try {
        const data = await fs.readFile(entertainPath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error('Failed to read file:', err);
        throw err; 
    }
}

async function kataKataRandom() {
    const jsonData = await readEntertainFile();
    const dataGet = jsonData.kataKata;
    const randomIndex = Math.floor(Math.random() * dataGet.length);
    return dataGet[randomIndex];
}

async function heckerRandom() {
    const jsonData = await readEntertainFile();
    const dataGet = jsonData.hecker;
    const randomIndex = Math.floor(Math.random() * dataGet.length);
    return dataGet[randomIndex];
}

async function dilanRandom() {
    const jsonData = await readEntertainFile();
    const dataGet = jsonData.dilan;
    const randomIndex = Math.floor(Math.random() * dataGet.length);
    return dataGet[randomIndex];
}

async function bucinRandom() {
    const jsonData = await readEntertainFile();
    const dataGet = jsonData.bucin;
    const randomIndex = Math.floor(Math.random() * dataGet.length);
    return dataGet[randomIndex];
}

async function quoteRandom() {
    const jsonData = await readEntertainFile();
    const dataGet = jsonData.quote;
    const randomIndex = Math.floor(Math.random() * dataGet.length);
    return dataGet[randomIndex];
}

module.exports = { kataKataRandom, heckerRandom, dilanRandom, bucinRandom, quoteRandom };
