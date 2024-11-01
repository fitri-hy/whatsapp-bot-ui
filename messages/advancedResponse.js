const { downloadMediaMessage } = require('fhy-wabot');
const { exec } = require('child_process');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const gTTS = require('gtts');
const QRCode = require('qrcode');
const { Octokit } = require('@octokit/rest');
const Tesseract = require('tesseract.js');
const configPath = path.join(__dirname, '../settings/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const { GeminiMessage, GeminiImage } = require('./utils/Gemini');
const { Country } = require('./utils/Country');
const { YoutubeVideo, YoutubeAudio, FacebookVideo, FacebookAudio, TwitterVideo, TwitterAudio, InstagramVideo, InstagramAudio, TikTokVideo, TikTokAudio, VimeoVideo, VimeoAudio } = require('./utils/Downloader');
const { Translate } = require('./utils/Translates');
const { Weather } = require('./utils/Weather');
const { CheckSEO } = require('./utils/SEO');
const { WikipediaAI, WikipediaSearch, WikipediaImage } = require('./utils/Wikipedia');
const { Surah, SurahDetails } = require('./utils/Quran');
const { AesEncryption, AesDecryption, CamelliaEncryption, CamelliaDecryption, ShaEncryption, Md5Encryption, RipemdEncryption, BcryptEncryption } = require('./utils/Encrypts.js');

async function AdvancedResponse(messageContent, sender, sock, message) {
    
	if (config.settings.ANTI_BADWORDS) {
		try {
			const regex = new RegExp(`\\b(${config.badwords.join('|')})\\b`, 'i');
			if (regex.test(messageContent)) {
				await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
				await new Promise(resolve => setTimeout(resolve, 3000));
				await sock.sendMessage(sender, { delete: message.key });
				return true;
			}
		} catch (error) {
			console.error('Error deleting message:', error);
		}
	}
	
	if (messageContent.startsWith(`${config.cmd.CMD_AES_ENC} `)) {
		const text = messageContent.replace(`${config.cmd.CMD_AES_ENC} `, '').trim();
		const getkey = "b14ca5898a4e4133bbce2ea2315a1916";
		await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
		try {
			const encryptedText = await AesEncryption(text, getkey);
			await sock.sendMessage(sender, { text: `Result AES Encryption: *${encryptedText}*` }, { quoted: message });
			await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
		} catch (error) {
			console.log(error)
			await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
		}
	}

	if (messageContent.startsWith(`${config.cmd.CMD_AES_DEC} `)) {
		const encryptedText = messageContent.replace(`${config.cmd.CMD_AES_DEC} `, '').trim();
		const getkey = "b14ca5898a4e4133bbce2ea2315a1916";
		await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
		try {
			const decryptedText = await AesDecryption(encryptedText, getkey);
			await sock.sendMessage(sender, { text: `Result AES Decryption: *${decryptedText}*` }, { quoted: message });
			await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
		} catch (error) {
			console.log(error)
			await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
		}
	}
		
	if (messageContent.startsWith(`${config.cmd.CMD_CAMELIA_ENC} `)) {
		const text = messageContent.replace(`${config.cmd.CMD_CAMELIA_ENC} `, '').trim();
		const getkey = "0123456789abcdeffedcba9876543210";
		await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
		try {
			const encryptedText = await CamelliaEncryption(text, getkey);
			await sock.sendMessage(sender, { text: `Result Camellia Encryption: *${encryptedText}*` }, { quoted: message });
			await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
		} catch (error) {
			console.log(error)
			await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
		}
	}

	if (messageContent.startsWith(`${config.cmd.CMD_CAMELIA_DES} `)) {
		const encryptedText = messageContent.replace(`${config.cmd.CMD_CAMELIA_DES} `, '').trim();
		const getkey = "0123456789abcdeffedcba9876543210";
		await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
		try {
			const decryptedText = await CamelliaDecryption(encryptedText, getkey);
			await sock.sendMessage(sender, { text: `Result Camellia Decryption: *${decryptedText}*` }, { quoted: message });
			await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
		} catch (error) {
			console.log(error)
			await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
		}
	}

	if (messageContent.startsWith(`${config.cmd.CMD_SHA} `)) {
		const text = messageContent.replace(`${config.cmd.CMD_SHA} `, '').trim();
		await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
		try {
			const hashedText = await ShaEncryption(text);
			await sock.sendMessage(sender, { text: `Result SHA Hashing: *${hashedText}*` }, { quoted: message });
			await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
		} catch (error) {
			console.log(error)
			await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
		}
	}

	if (messageContent.startsWith(`${config.cmd.CMD_MD5} `)) {
		const text = messageContent.replace(`${config.cmd.CMD_MD5} `, '').trim();
		await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
		try {
			const hashedText = await Md5Encryption(text);
			await sock.sendMessage(sender, { text: `Result MD5 Hashing: *${hashedText}*` }, { quoted: message });
			await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
		} catch (error) {
			console.log(error)
			await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
		}
	}

	if (messageContent.startsWith(`${config.cmd.CMD_RIPEMD} `)) {
		const text = messageContent.replace(`${config.cmd.CMD_RIPEMD} `, '').trim();
		await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
		try {
			const hashedText = await RipemdEncryption(text);
			await sock.sendMessage(sender, { text: `Result RIPEMD Hashing: *${hashedText}*` }, { quoted: message });
			await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
		} catch (error) {
			console.log(error)
			await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
		}
	}

	if (messageContent.startsWith(`${config.cmd.CMD_BCRYPT} `)) {
		const text = messageContent.replace(`${config.cmd.CMD_BCRYPT} `, '').trim();
		await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
		try {
			const hashedText = await BcryptEncryption(text);
			await sock.sendMessage(sender, { text: `Result Bcrypt Hashing: *${hashedText}*` }, { quoted: message });
			await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
		} catch (error) {
			console.log(error)
			await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
		}
	}
		
	if (messageContent.startsWith(`${config.cmd.CMD_SSWEB} `)) {
		const domain = messageContent.replace(`${config.cmd.CMD_SSWEB} `, '').trim();
		await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
		try {
			const browser = await puppeteer.launch();
			const page = await browser.newPage();
			await page.goto(`https://${domain}`, { waitUntil: 'networkidle2' });
			const screenshotPath = path.join(__dirname, '../public/media/ssweb.jpg');
			await page.screenshot({ path: screenshotPath, fullPage: false });
			await browser.close();
			const caption = `Screenshot of ${domain}`;
			await new Promise(resolve => setTimeout(resolve, 2000));
			await sock.sendMessage(sender, { image: { url: screenshotPath }, caption: caption }, { quoted: message });
			fs.unlinkSync(screenshotPath);
			await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
		} catch (error) {
			console.error('Error taking screenshot or sending message:', error);
			await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
		}
	}
	
	if (messageContent.startsWith(`${config.cmd.CMD_SSMOBILE} `)) {
		const domain = messageContent.replace(`${config.cmd.CMD_SSMOBILE} `, '').trim();
		await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
		try {
			const browser = await puppeteer.launch();
			const page = await browser.newPage();
			await page.setViewport({ width: 375, height: 667 });
			await page.goto(`https://${domain}`, { waitUntil: 'networkidle2' });
			const screenshotPath = path.join(__dirname, '../public/media/ssmobile.jpg');
			await page.screenshot({ path: screenshotPath, fullPage: false });
			await browser.close();
			const caption = `Mobile screenshot of ${domain}`;
			await new Promise(resolve => setTimeout(resolve, 2000));
			await sock.sendMessage(sender, { image: { url: screenshotPath }, caption: caption }, { quoted: message });
			fs.unlinkSync(screenshotPath);
			await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
		} catch (error) {
			console.error('Error taking mobile screenshot or sending message:', error);
			await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
		}
	}
		
	if (messageContent.startsWith(`${config.cmd.CMD_GITHUB} `)) {
		const username = messageContent.replace(`${config.cmd.CMD_GITHUB} `, '').trim();
		await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
		try {
			const octokit = new Octokit();
			const { data } = await octokit.rest.users.getByUsername({ username });
			const responseProfile = `${data.avatar_url}`;
			const responseMessage = `*User Github Info for ${data.login}:*\n\n` +
				`- Name: ${data.name || 'No name available'}\n` +
				`- Bio: ${data.bio || 'No bio available'}\n` +
				`- Location: ${data.location || 'No location available'}\n` +
				`- Company: ${data.company || 'No company available'}\n` +
				`- Followers: ${data.followers}\n` +
				`- Following: ${data.following}\n` +
				`- Repositories: ${data.public_repos}\n` +
				`- Public Gists: ${data.public_gists}\n` +
				`- Blog: ${data.blog ? `${data.blog}` : 'No blog available'}\n` +
				`- Created At: ${new Date(data.created_at).toLocaleDateString()}`;
			await sock.sendMessage(sender, { image: { url: responseProfile }, caption: responseMessage }, { quoted: message });
			await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
		} catch (error) {
			console.error('Error sending message:', error);
			await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
		}
	}
		
	if (messageContent === `${config.cmd.CMD_OCR}`) {
		const quotedMessage = message.message.extendedTextMessage?.contextInfo?.quotedMessage;
		if (quotedMessage?.imageMessage) {
			await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
			const inputFilePath = path.join(__dirname, '../public/media/ocr.jpg');
			try {
				const buffer = await downloadMediaMessage({ message: quotedMessage }, 'buffer');
				fs.writeFileSync(inputFilePath, buffer);
				const { data: { text } } = await Tesseract.recognize(inputFilePath, 'eng');
				await sock.sendMessage(sender, { text: text || "Tidak ada teks yang dikenali." }, { quoted: message });
			} catch (error) {
				console.error('Error during OCR or processing image:', error);
				await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
			} finally {
				if (fs.existsSync(inputFilePath)) {
					fs.unlinkSync(inputFilePath);
				}
			}
		} else {
			console.error('Quoted message does not contain an image.');
			await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
		}
	}
		
	if (messageContent.startsWith(`${config.cmd.CMD_QRCODE} `)) {
		const text = messageContent.replace(`${config.cmd.CMD_QRCODE} `, '').trim();
		await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
		try {
			const qrCodeFilePath = path.join(__dirname, '../public/media/qrcode.jpg');
			await QRCode.toFile(qrCodeFilePath, text);
			const caption = `Here is your QR code for: "${text}"`;
			await sock.sendMessage(sender, { image: { url: qrCodeFilePath }, caption: caption }, { quoted: message });
			fs.unlink(qrCodeFilePath, (err) => {
				if (err) {
					console.error('Error deleting QR code file:', err);
				} else {
					console.log('QR code file deleted successfully');
				}
			});
			await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
		} catch (error) {
			console.error('Error generating or sending QR code:', error);
			await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
		}
	}

	if (messageContent.startsWith(`${config.cmd.CMD_COUNT_WORDS} `)) {
		const text = messageContent.replace(`${config.cmd.CMD_COUNT_WORDS} `, '').trim();
		await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
		try {
			const wordCount = text ? text.split(/\s+/).length : 0;
			const characterCount = text.length;
			const spaceCount = (text.match(/\s/g) || []).length;
			const symbolCount = (text.match(/[^\w\s]/g) || []).length;
			const paragraphCount = text.split(/\n+/).length;
			const numberCount = (text.match(/\d+/g) || []).length;
			const responseMessage = 
				'*Text Analysis* \n\n' +
				`- Word Count: ${wordCount}\n` +
				`- Character Count: ${characterCount}\n` +
				`- Space Count: ${spaceCount}\n` +
				`- Symbol Count: ${symbolCount}\n` +
				`- Paragraph Count: ${paragraphCount}\n` +
				`- Number Count: ${numberCount}`;
			await sock.sendMessage(sender, { text: responseMessage }, { quoted: message });
			await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
		} catch (error) {
			console.error('Error sending message:', error);
			await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
		}
	}
		
	if (messageContent.startsWith(`${config.cmd.CMD_SURAH} `)) {
		const surahId = parseInt(messageContent.split(' ')[1]);
		await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });	
		try {
			const responseMessage = await Surah(surahId); 
			await sock.sendMessage(sender, { text: responseMessage }, { quoted: message });
			await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
		} catch (error) {
			console.error('Error sending message:', error);
			await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
		}
	}
	
	if (messageContent.startsWith(`${config.cmd.CMD_SURAH_DETAIL} `)) {
		const [surahPart, ayahPart] = messageContent.split(' ')[1].split(':');
		const surahId = parseInt(surahPart);
		const ayahId = ayahPart ? parseInt(ayahPart) : null;
		await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
		try {
			if (ayahId) {
				const responseMessage = await SurahDetails(surahId, ayahId);
				await sock.sendMessage(sender, { text: responseMessage }, { quoted: message });
			} else {
				const responseMessage = await getSurahDetails(surahId);
				await sock.sendMessage(sender, { text: responseMessage }, { quoted: message });
			}
			await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
		} catch (error) {
			console.error('Error sending message:', error);
			await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
		}
	}
		
	if (messageContent.startsWith(`${config.cmd.CMD_TO_VOICE} `)) {
		const textToConvert = messageContent.replace(`${config.cmd.CMD_TO_VOICE} `, '');
		await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
		try {
			const audioFilePath = path.join(__dirname, '../public/media/to-voice.mp3');
			const gtts = new gTTS(textToConvert, `${config.settings.TO_VOICE}`);
			gtts.save(audioFilePath, async function (err) {
				if (err) {
					console.error('Error saving audio:', err);
					await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
					return;
				}
				await sock.sendMessage(sender, {
					audio: { url: audioFilePath },
					mimetype: 'audio/mp4',
					ptt: true,
				}, { quoted: message });
				fs.unlink(audioFilePath, (unlinkErr) => {
					if (unlinkErr) {
						console.error('Error deleting audio file:', unlinkErr);
					}
				});
				await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
			});
		} catch (error) {
			await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
		}
	}
		
	if (messageContent === `${config.cmd.CMD_STICKER}`) {
		const quotedMessage = message.message.extendedTextMessage?.contextInfo?.quotedMessage;
		if (quotedMessage?.imageMessage) {
			await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
			const buffer = await downloadMediaMessage({ message: quotedMessage }, 'buffer');
			const inputFilePath = path.join(__dirname, '../public/media/sticker-image.jpg');
			const outputStickerPath = path.join(__dirname, '../public/media/sticker.webp');
			const ffmpegPath = path.join(__dirname, '../plugin/ffmpeg.exe');
			fs.writeFileSync(inputFilePath, buffer);
			const ffmpegCommand = `"${ffmpegPath}" -i "${inputFilePath}" -vf "scale=512:512" -vcodec libwebp -lossless 1 -qscale 80 -loop 0 -an -vsync 0 -preset default -t 5 "${outputStickerPath}"`;
			exec(ffmpegCommand, async (error, stdout, stderr) => {
				if (error) {
					await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
					return;
				}
				const stickerBuffer = fs.readFileSync(outputStickerPath);
				await sock.sendMessage(sender, { sticker: stickerBuffer }, { quoted: message });
				fs.unlinkSync(inputFilePath);
				fs.unlinkSync(outputStickerPath);
				await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
			});
		} else {
			await sock.sendMessage(sender, { text: "Tidak ada gambar yang di-quote untuk dibuat sticker." }, { quoted: message });
			await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
		}
	}
		
	if (messageContent.startsWith(`${config.cmd.CMD_WIKIPEDIA_AI} `)) {
		const searchQuery = messageContent.replace(`${config.cmd.CMD_WIKIPEDIA_AI} `, '').trim();
		await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
		try {
			const responseMessage = await WikipediaAI(searchQuery, sock, sender, message);
			if (responseMessage) {
				await sock.sendMessage(sender, { text: responseMessage, quoted: message });
			}
			await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
		} catch (error) {
			console.error('Error sending message:', error);
			await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
		}
	}

	if (messageContent.startsWith(`${config.cmd.CMD_WIKIPEDIA_SEARCH} `)) {
		const searchQuery = messageContent.replace(`${config.cmd.CMD_WIKIPEDIA_SEARCH} `, '').trim();
		await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
		try {
			const responseMessage = await WikipediaSearch(searchQuery, sock, sender, message);
			if (responseMessage) {
				await sock.sendMessage(sender, { text: responseMessage, quoted: message });
			}
			await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
		} catch (error) {
			console.error('Error sending message:', error);
			await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
		}
	}
		
	if (messageContent.startsWith(`${config.cmd.CMD_WIKIPEDIA_IMG} `)) {
		const userQuery = messageContent.replace(`${config.cmd.CMD_WIKIPEDIA_IMG} `, '').trim();
		await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
		try {
			const { url, caption } = await WikipediaImage(userQuery);
			await sock.sendMessage(sender, {image: {url: url}, caption: caption}, { quoted: message });
			await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
		} catch (error) {
			console.error('Error sending message:', error);
			await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
		}
	}
		
	if (messageContent.startsWith(`${config.cmd.CMD_SEO} `)) {
		const domain = messageContent.replace(`${config.cmd.CMD_SEO} `, '').trim();
		await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });

		try {
			const responseMessage = await CheckSEO(domain); 
			const formattedMessage = 
				'- SEO Success Rate: ' + responseMessage.seoSuccessRate + '\n' +
				'- Title: ' + responseMessage.title + '\n' +
				'- Meta Description: ' + responseMessage.metaDescription + '\n' +
				'- Meta Keywords: ' + responseMessage.metaKeywords + '\n' +
				'- Open Graph Title: ' + responseMessage.ogTitle + '\n' +
				'- Open Graph Description: ' + responseMessage.ogDescription + '\n' +
				'- Open Graph Image: ' + responseMessage.ogImage + '\n' +
				'- Canonical URL: ' + responseMessage.canonicalUrl + '\n' +
				'- Is Indexable: ' + (responseMessage.isIndexable ? 'Yes' : 'No');
			await sock.sendMessage(sender, { text: formattedMessage.trim() }, { quoted: message });
			await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
		} catch (error) {
			console.error('Error sending message:', error);
			await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
		}
	}
		
	if (messageContent.startsWith(`${config.cmd.CMD_WEATHER} `)) {
		const cityName = messageContent.replace(`${config.cmd.CMD_WEATHER} `, '').trim();
		await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
		try {
			const weatherJson = await Weather(cityName);
			const responseMessage = `*Weather in ${cityName}*\n\nTemperature: ${weatherJson.temperature}\nCondition: ${weatherJson.condition}\nWind: ${weatherJson.wind}\nHumidity: ${weatherJson.humidity}`;
			await sock.sendMessage(sender, { text: responseMessage }, { quoted: message });
			await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
		} catch (error) {
			console.error('Error sending message:', error);
			await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
		}
	}
	if (messageContent.startsWith(`${config.cmd.CMD_TRANSLATE}`)) {
		const parts = messageContent.split(' ');
		const langId = parts[0].split('-')[1];
		const query = parts.slice(1).join(' ');

		await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
		try {
			const translateText = await Translate(query, langId);
			await sock.sendMessage(sender, { text: translateText }, { quoted: message });
			await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
		} catch (error) {
			console.error('Error sending message:', error);
			await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
		}
	}


    if (messageContent.startsWith(`${config.cmd.CMD_GEMINI} `)) {
        const question = messageContent.replace(`${config.cmd.CMD_GEMINI} `, '').trim();
        await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
        try {
            const responseMessage = await GeminiMessage(question);
            await sock.sendMessage(sender, { text: responseMessage }, { quoted: message });
            await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
        } catch (error) {
            console.error('Error sending message:', error);
            await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
        }
    }

    if (messageContent.startsWith(`${config.cmd.CMD_GEMINI_IMG} `)) {
        const quotedMessage = message.message.extendedTextMessage?.contextInfo?.quotedMessage;
        const getPrompt = messageContent.replace(`${config.cmd.CMD_GEMINI_IMG} `, '').trim();

        if (quotedMessage?.imageMessage) {
            await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
            const buffer = await downloadMediaMessage({ message: quotedMessage }, 'buffer');
            const inputFilePath = path.join(__dirname, '../public/media/gemini-image.jpg');
            fs.writeFileSync(inputFilePath, buffer);
            try {
                const analysisResult = await GeminiImage(inputFilePath, getPrompt);
                await sock.sendMessage(sender, { text: analysisResult }, { quoted: message });
                await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
            } catch (error) {
                console.error('Error processing image:', error);
                await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
            } finally {
                deleteFile(inputFilePath);
            }
        } else {
            await sock.sendMessage(sender, { text: "Tidak ada gambar yang di-quote untuk dianalisis." }, { quoted: message });
            await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
        }
    }

    if (messageContent.startsWith(`${config.cmd.CMD_COUNTRY} `)) {
        const countryName = messageContent.replace(`${config.cmd.CMD_COUNTRY} `, '').trim();
        await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
        
        try {
            const responseMessage = await Country(countryName); 
            await sock.sendMessage(sender, { text: responseMessage }, { quoted: message });
            await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
        } catch (error) {
            console.error('Error sending message:', error);
            await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
        }
    }

    const mediaCommands = [
        { cmd: `${config.cmd.CMD_TWDLMP4} `, platform: 'twitter', mediaType: 'mp4' },
        { cmd: `${config.cmd.CMD_TWDLMP2} `, platform: 'twitter', mediaType: 'mp3' },
        { cmd: `${config.cmd.CMD_IGDLMP4} `, platform: 'instagram', mediaType: 'mp4' },
        { cmd: `${config.cmd.CMD_IGDLMP3} `, platform: 'instagram', mediaType: 'mp3' },
        { cmd: `${config.cmd.CMD_TKDLMP4} `, platform: 'tiktok', mediaType: 'mp4' },
        { cmd: `${config.cmd.CMD_TKDLMP3} `, platform: 'tiktok', mediaType: 'mp3' },
        { cmd: `${config.cmd.CMD_VMDLMP4} `, platform: 'vimeo', mediaType: 'mp4' },
        { cmd: `${config.cmd.CMD_VMDLMP3} `, platform: 'vimeo', mediaType: 'mp3' },
        { cmd: `${config.cmd.CMD_FBDLMP4} `, platform: 'facebook', mediaType: 'mp4' },
        { cmd: `${config.cmd.CMD_FBDLMP3} `, platform: 'facebook', mediaType: 'mp3' },
        { cmd: `${config.cmd.CMD_YTDLMP4} `, platform: 'youtube', mediaType: 'mp4' },
        { cmd: `${config.cmd.CMD_YTDLMP3} `, platform: 'youtube', mediaType: 'mp3' },
    ];

    for (const { cmd, platform, mediaType } of mediaCommands) {
        if (messageContent.startsWith(cmd)) {
            const url = messageContent.split(' ')[1];
            await handleMediaDownload(platform, mediaType, url, sender, message, sock);
            break;
        }
    }
}

const deleteFile = (filePath) => {
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error(`Error deleting file: ${err.message}`);
        }
    });
};

const handleMediaDownload = async (platform, mediaType, url, sender, message, sock) => {
    const fileExtensions = {
        mp4: `${platform}-video.mp4`,
        mp3: `${platform}-audio.mp3`,
    };
    const outputFilePath = path.join(__dirname, "../public/media", fileExtensions[mediaType]);

    await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });

    try {
        if (mediaType === 'mp4') {
            await (platform === 'twitter' ? TwitterVideo(url, outputFilePath) :
                platform === 'instagram' ? InstagramVideo(url, outputFilePath) :
                platform === 'tiktok' ? TikTokVideo(url, outputFilePath) :
                platform === 'vimeo' ? VimeoVideo(url, outputFilePath) :
                platform === 'facebook' ? FacebookVideo(url, outputFilePath) :
                YoutubeVideo(url, outputFilePath));
        } else {
            await (platform === 'twitter' ? TwitterAudio(url, outputFilePath) :
                platform === 'instagram' ? InstagramAudio(url, outputFilePath) :
                platform === 'tiktok' ? TikTokAudio(url, outputFilePath) :
                platform === 'vimeo' ? VimeoAudio(url, outputFilePath) :
                FacebookAudio(url, outputFilePath));
        }

        const mediaMessage = mediaType === 'mp4' 
            ? { video: { url: outputFilePath }, caption: "This is the video you asked for!" } 
            : { audio: { url: outputFilePath }, mimetype: 'audio/mp4' };

        await sock.sendMessage(sender, mediaMessage, { quoted: message });
        await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });

        deleteFile(outputFilePath);
    } catch (error) {
        await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
    }
};

module.exports = AdvancedResponse;
