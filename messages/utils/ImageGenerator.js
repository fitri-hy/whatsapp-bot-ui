const puppeteer = require('puppeteer');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');

async function Wallpaper(title, page = '1') {
	try {
		const { data } = await axios.get(`https://www.besthdwallpaper.com/search?CurrentPage=${page}&q=${title}`);
		const $ = cheerio.load(data);
		const results = [];
		$('div.grid-item').each((index, element) => {
			const title = $(element).find('div.info > a > h3').text().trim();
			const type = $(element).find('div.info > a:nth-child(2)').text().trim();
			const source = 'https://www.besthdwallpaper.com/' + $(element).find('div > a:nth-child(3)').attr('href');
			const image = [
				$(element).find('picture > img').attr('data-src') || $(element).find('picture > img').attr('src'),
				$(element).find('picture > source:nth-child(1)').attr('srcset'),
				$(element).find('picture > source:nth-child(2)').attr('srcset')
			];
			results.push({ title, type, source, image });
		});
		return results;
	} catch (error) {
		throw new Error(`Error fetching data: ${error.message}`);
	}
}

async function Certificate(name) {
    const htmlContent = `
    <html>
        <head>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="flex justify-center items-center h-screen w-full">
            <img src="http://localhost:3000/certi.png" class="-z-50 fixed top-0 w-full h-screen object-cover" />
            <div class="relative w-full flex justify-center items-center">
                <h1 class="absolute text-center z-50 -mt-20 text-4xl font-bold max-w-lg overflow-hidden line-clamp-1">
                    ${name}
                </h1>
                <p class="absolute text-center z-50 mt-14 font-italic max-w-sm">
                    In recognition of achievements and dedication in Programming in
                    <span class="font-bold"> Happy Coding &lt;/&gt;</span>
                </p>
            </div>
            <img src="http://localhost:3000/logo.png" class="z-50 absolute bottom-[143px] -ml-[3px] h-10 w-10" />
        </body>
    </html>
    `;
    
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const screenshotPath = path.join(__dirname, './../../public/media/certificate_generator.jpg');
    await page.screenshot({
        path: screenshotPath,
        type: 'jpeg',
        quality: 90,
        fullPage: false
    });
    await browser.close();
    return screenshotPath;
}

async function FreePik(query) {
    const url = `https://www.freepik.com/search?format=search&last_filter=selection&last_value=1&query=${query}&selection=1`;
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    await page.goto(url, { waitUntil: 'networkidle2' });
    try {
        await page.waitForSelector('a._1286nb1h img._1286nb17');
        const firstImageUrl = await page.$eval('a._1286nb1h img._1286nb17', img => img.getAttribute('src'));
        await browser.close();
        return { firstImageUrl };
    } catch (error) {
        console.error("Failed to retrieve image:", error);
        await browser.close();
        return null;
    }
}

module.exports = { Certificate, Wallpaper, FreePik };
