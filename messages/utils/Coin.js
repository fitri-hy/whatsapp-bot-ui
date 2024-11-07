const puppeteer = require('puppeteer');

async function bitCoin() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto('https://indodax.com/market/BTCIDR');
  await page.waitForSelector('td.market-price-box');
  const data = await page.evaluate(() => {
    const lastPrice = document.querySelector('.price_btcidr_val').innerText;
    const change24h = document.querySelector('.price_change_btcidr').innerText;
    const low24h = document.querySelector('.low_val').innerText;
    const high24h = document.querySelector('.high_val').innerText;
    const volumeBTC = document.querySelector('.vol_val').innerText;
    const volumeIDR = document.querySelector('.vol_val_idr').innerText;
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${
      String(now.getMonth() + 1).padStart(2, '0')
    }/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${
      String(now.getMinutes()).padStart(2, '0')
    }:${String(now.getSeconds()).padStart(2, '0')}`;
    return {
      lastPrice,
      change24h,
      low24h,
      high24h,
      volumeBTC,
      volumeIDR,
      date: formattedDate
    };
  });
  await browser.close();
  return data;
}

module.exports = { bitCoin };
