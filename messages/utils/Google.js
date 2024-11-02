const axios = require('axios');
const cheerio = require('cheerio');

const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

const ProductPrices = async (query) => {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=shop`;
    try {
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36'
            }
        });
        
        const $ = cheerio.load(data);
        const results = [];

        $('.sh-dgr__grid-result').each((index, element) => {
            const title = $(element).find('h3.tAxDx').text().trim();
            const price = $(element).find('.a8Pemb').text().trim();
            const siteNameNode = $(element).find('.aULzUe.IuHnof').contents().filter(function() {
                return this.nodeType === 3;
            });
            const siteName = siteNameNode.text().trim();
            if (title && price && siteName) {
                results.push({
                    site: siteName || 'Unknown',
                    title,
                    price
                });
            }
        });

        return shuffleArray(results).slice(0, 10);
    } catch (error) {
        console.error('Error fetching data:', error);
        throw new Error('Error fetching data');
    }
};

module.exports = { ProductPrices };
