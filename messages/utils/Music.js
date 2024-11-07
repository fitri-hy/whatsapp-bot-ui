const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const { exec } = require('youtube-dl-exec');
const fs = require('fs');
const path = require('path');

function Ringtone(title) {
    return new Promise((resolve, reject) => {
        axios.get(`https://meloboom.com/en/search/${encodeURIComponent(title)}`)
            .then((response) => {
                const $ = cheerio.load(response.data);
                const results = [];
                
                $('#__next > main > section > div.jsx-2244708474.container > div > div > div > div:nth-child(4) > div > div > div > ul > li').each((index, element) => {
                    const audio = $(element).find('audio').attr('src');
                    if (audio) {
                        results.push(audio);
                    }
                });

                resolve(results);
            })
            .catch(error => {
                console.error("Error fetching data:", error.message);
                reject(error);
            });
    });
}

async function YouTube(query, outputFilePath) {
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    await page.goto(youtubeUrl, { waitUntil: 'networkidle2' });
    const videoUrl = await page.evaluate(() => {
      const videoElement = document.querySelector('a#video-title');
      return videoElement ? 'https://www.youtube.com' + videoElement.getAttribute('href') : null;
    });
    await browser.close();
    if (!videoUrl) {
      throw new Error('Video tidak ditemukan');
    }
    const outputDir = path.dirname(outputFilePath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    await exec(videoUrl, {
      output: outputFilePath,
      format: 'mp4',
    });
    return { videoUrl, outputFilePath };
  } catch (error) {
    console.error('Terjadi kesalahan:', error.message);
    return null;
  }
}

module.exports = { Ringtone, YouTube };
