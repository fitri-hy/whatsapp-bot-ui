const puppeteer = require('puppeteer');
const path = require('path');

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
    const screenshotPath = path.join(__dirname, './../../public/media/certificate_generator.jpg'); // Adjust path as needed
    await page.screenshot({
        path: screenshotPath,
        type: 'jpeg',
        quality: 90,
        fullPage: false
    });
    await browser.close();
    return screenshotPath;
}

module.exports = { Certificate };
