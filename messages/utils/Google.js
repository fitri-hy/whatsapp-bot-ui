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

async function FileSearch(query, searchType = 'pdf') {
    const fileTypes = {
        pdf: 'filetype:pdf',
        doc: 'filetype:doc',
        docx: 'filetype:docx',
        xls: 'filetype:xls',
        xlsx: 'filetype:xlsx',
        ppt: 'filetype:ppt',
        pptx: 'filetype:pptx',
        txt: 'filetype:txt',
        html: 'filetype:html',
        htm: 'filetype:htm',
        csv: 'filetype:csv',
        rtf: 'filetype:rtf',
        odt: 'filetype:odt',
        ods: 'filetype:ods',
        odp: 'filetype:odp',
        epub: 'filetype:epub',
        zip: 'filetype:zip',
        gz: 'filetype:gz'
    };

    const filetypeQuery = fileTypes[searchType] || '';
    const url = filetypeQuery
        ? `https://www.google.com/search?q=${filetypeQuery}+${encodeURIComponent(query)}`
        : `https://www.google.com/search?q=${encodeURIComponent(query)}`;

    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        const results = [];
        
        if (filetypeQuery) {
            $('a').each((i, el) => {
                let href = $(el).attr('href');
                let title = $(el).find('h3').text().trim();

                if (href && href.includes(`.${searchType}`)) {
                    href = href.startsWith('http') ? href : `https://www.google.com${href}`;
                    results.push({
                        url: href,
                        title: title || 'No Title'
                    });
                }
            });
        }

        if (results.length > 0) {
            results.shift();
        }

        return results.length > 0 
            ? results.map(result => `${result.title || 'No Title'}: ${result.url}`).join('\n\n') 
            : 'No results found.';
    } catch (error) {
        console.error(error);
        throw new Error('Error occurred while scraping');
    }
}

async function PlayStore(query) {
  try {
    const url = `https://play.google.com/store/search?q=${query}`;
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const results = [];
    let count = 0;
    $('div.VfPpkd-aGsRMb').each((index, element) => {
      if (count < 15) {
        const title = $(element).find('span.DdYX5').text().trim();
        const developer = $(element).find('span.wMUdtb').text().trim();
        const link = $(element).find('a').attr('href');
        const images = $(element).find('img.T75of').attr('src');
        if (title && developer && link && images) {
          results.push({
            title,
            developer,
            link: `https://play.google.com${link}`,
            images
          });
          count++;
        }
      }
    });
    return results;
  } catch (error) {
    console.error("Error fetching Play Store data:", error);
    throw new Error("Failed to fetch Play Store data.");
  }
}

module.exports = { ProductPrices, FileSearch, PlayStore };
