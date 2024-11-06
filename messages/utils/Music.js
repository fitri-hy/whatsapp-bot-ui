const axios = require('axios');
const cheerio = require('cheerio');

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

module.exports = { Ringtone };
