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
const axios = require('axios');
const { WikipediaAI, WikipediaSearch, WikipediaImage } = require('./utils/Wikipedia');
const { Surah, SurahDetails } = require('./utils/Quran');
const { AesEncryption, AesDecryption, CamelliaEncryption, CamelliaDecryption, ShaEncryption, Md5Encryption, RipemdEncryption, BcryptEncryption } = require('./utils/Encrypts.js');
const { kataKataRandom, heckerRandom, dilanRandom, bucinRandom, quoteRandom } = require('./utils/Entertain.js');
const { ProductPrices, FileSearch, PlayStore } = require('./utils/Google');
const { dnsLookup, sslLookup, httpHeadersLookup, CheckVulnerability } = require('./utils/Tools');
const { Certificate, Wallpaper, FreePik } = require('./utils/ImageGenerator');
const { Ringtone, YouTube } = require('./utils/Music');
const { bitCoin } = require('./utils/Coin');

async function AdvancedResponse(messageContent, sender, sock, message) {
	if ((config.settings.SELF && message.key.fromMe) || !config.settings.SELF) {
		
		if (messageContent.startsWith(`${config.cmd.CMD_FREEPIK} `)) {
			const query = messageContent.replace(`${config.cmd.CMD_FREEPIK} `, '').trim();
			await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
			try {
				const FreePikData = await FreePik(query);
				if (FreePikData && FreePikData.firstImageUrl) {
					const caption = `Results from ${query}`;
					await sock.sendMessage(sender, { image: { url: FreePikData.firstImageUrl }, caption }, { quoted: message });
					await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
				} else {
					await sock.sendMessage(sender, { text: "No FreePik Data found for your search query."}, { quoted: message });
					await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
				}
			} catch (error) {
				console.error(`Failed to get data:`, error);
				await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
			}
		}

		if (messageContent.startsWith(`${config.cmd.CMD_YOUTUBE} `)) {
		  const query = messageContent.replace(`${config.cmd.CMD_YOUTUBE} `, '').trim();
		  await sock.sendMessage(sender, { react: { text: '⌛', key: message.key } });
		  try {
			const outputFilePath = path.join(__dirname, '../public/media/youtube.mp4');
			const YoutubeData = await YouTube(query, outputFilePath);
			if (YoutubeData) {
			  await sock.sendMessage(sender, { video: { url: outputFilePath }, caption: `Youtube URL: ${YoutubeData.videoUrl}` }, { quoted: message });
			  await sock.sendMessage(sender, { react: { text: '✅', key: message.key } });
			  fs.unlinkSync(outputFilePath);
			} else {
			  await sock.sendMessage(sender, { text: 'Video not found.' }, { quoted: message });
			  await sock.sendMessage(sender, { react: { text: '❌', key: message.key } });
			}
		  } catch (error) {
			console.log('Failed to get video data:', error);
			await sock.sendMessage(sender, { react: { text: '❌', key: message.key } });
		  }
		}
				
		if (messageContent === `${config.cmd.CMD_BITCOIN}`) {
		  await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
		  try {
			const data = await bitCoin();
			const responseMessage = `*BitCoin Data*\n\n` +
									`Final Price:\n> ${data.lastPrice}\n` +
									`Change 24h:\n> ${data.change24h}\n` +
									`Lowest Price 24h:\n> ${data.low24h}\n` +
									`Highest price 24h:\n> ${data.high24h}\n` +
									`Volume 24h (BTC):\n> ${data.volumeBTC}\n` +
									`Volume 24h (IDR):\n> ${data.volumeIDR}\n` +
									`Date:\n> ${data.date}`;
			await sock.sendMessage(sender, { text: responseMessage }, { quoted: message });
						await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
		  } catch (error) {
			console.error('Error sending message:', error);
			await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
		  }
		}
		
		if (messageContent.trim() === `${config.cmdGroup.CMD_TAG_ALL}` && sender.endsWith('@g.us')) {
			await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
			try {
				const groupMeta = await sock.groupMetadata(sender);
				const participants = groupMeta.participants;
				const mentionText = participants.map(participant => `@${participant.id.split('@')[0]}`).join(' ');
				await sock.sendMessage(sender, { text: `🔔 *Mention All Participants* 🔔\n\n${mentionText}`, mentions: participants.map(p => p.id) }, { quoted: message });
				await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
			} catch (err) {
				console.error('Failed to get group info:', err);
				await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
			}
		}

		if (messageContent.trim() === `${config.cmdGroup.CMD_GROUP_META}` && sender.endsWith('@g.us')) {
		  await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
		  try {
			const groupInviteLink = await sock.groupInviteCode(sender);
			const groupUrl = `https://chat.whatsapp.com/${groupInviteLink}`;
			const groupMeta = await sock.groupMetadata(sender);
			const response = `✨ ${groupMeta.subject}\n` +
							 `👥 ${groupMeta.participants.length}\n` +
							 `📅 ${new Date(groupMeta.creation * 1000).toLocaleDateString()}\n` +
							 `🌐 ${groupUrl}\n` +
							 `📝 ${groupMeta.desc || 'No description available'}`;

			await sock.sendMessage(sender, { text: response }, { quoted: message });
			await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
		  } catch (err) {
			console.error('Failed to get group info:', err);
			await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
		  }
		}
		
		if (messageContent.startsWith(`${config.cmd.CMD_PLAYSTORE} `)) {
		  const query = messageContent.replace(`${config.cmd.CMD_PLAYSTORE} `, '').trim();
		  await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
		  try {
			const playStoreData = await PlayStore(query);
			if (playStoreData && playStoreData.length > 0) {
			  const formattedData = playStoreData.map(app => {
				return `*${app.title}*\nDeveloper: ${app.developer}\nLink: ${app.link}\n\n`;
			  }).join('');
			  await sock.sendMessage(sender, { text: formattedData }, { quoted: message });
			  await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
			} else {
			  await sock.sendMessage(sender, { text: "No apps found." }, { quoted: message });
			  await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
			}
		  } catch (error) {
			console.log("Failed to get Play Store data:", error);
			await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
		  }
		}
		
		if (messageContent.startsWith(`${config.cmd.CMD_RINGTONE} `)) {
			const query = messageContent.replace(`${config.cmd.CMD_RINGTONE} `, '').trim();
			await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
			try {
				const RingtoneData = await Ringtone(query);
				if (RingtoneData.length > 0) {
					await sock.sendMessage(sender, { audio: { url: RingtoneData[0] }, mimetype: 'audio/mp4' }, { quoted: message });
					await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
				} else {
					await sock.sendMessage(sender, { text: "No ringtones found." }, { quoted: message });
					await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
				}
			} catch (error) {
				console.log("Failed to get ringtone data:", error);
				await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
			}
		}

		if (messageContent.startsWith(`${config.cmd.CMD_WALLPAPER} `)) {
			const name = messageContent.replace(`${config.cmd.CMD_WALLPAPER} `, '').trim();
			await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
			try {
				const wallpapers = await Wallpaper(name);
				if (wallpapers.length > 0) {
					const { title, image, source } = wallpapers[0];
					const imagePath = image[0];
					const caption = `Results from ${name}`;
					await sock.sendMessage(sender, { image: { url: imagePath }, caption }, { quoted: message });
					await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
				} else {
					await sock.sendMessage(sender, { text: "No wallpapers found for your search query."}, { quoted: message });
					await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
				}
			} catch (error) {
				console.error(`Failed to get data:`, error);
				await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
			}
		}
		
		if (messageContent.startsWith(`${config.cmd.CMD_GITHUB_REPO} `)) {
			const query = messageContent.replace(`${config.cmd.CMD_GITHUB_REPO} `, '').trim();
			await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
			try {
				const response = await axios.get(`https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc&per_page=30`);
				const data = response.data.items;
				if (data.length === 0) {
					await sock.sendMessage(sender, { text: 'No repositories found matching your query.' }, { quoted: message });
				} else {
					const shuffledData = data.sort(() => 0.5 - Math.random()).slice(0, 10);
					let caption = `🔍 Top 10 random repositories for: *${query}*\n\n`;
					shuffledData.forEach((repo, index) => {
						const updatedDate = new Date(repo.updated_at);
						const day = String(updatedDate.getDate()).padStart(2, '0');
						const month = String(updatedDate.getMonth() + 1).padStart(2, '0');
						const year = updatedDate.getFullYear();
						const hours = String(updatedDate.getHours()).padStart(2, '0');
						const minutes = String(updatedDate.getMinutes()).padStart(2, '0');
						const formattedDate = `${day}/${month}/${year} ${hours}:${minutes}`;

						caption += `${index + 1}. *${repo.name}*\n` +
							`⭐ Stars: ${repo.stargazers_count}\n` +
							`🍴 Forks: ${repo.forks_count}\n` +
							`👀 Watchers: ${repo.watchers_count}\n` +
							`🛠️ Open Issues: ${repo.open_issues_count}\n` +
							`⏰ Last Updated: ${formattedDate}\n` +
							`🔗 Git URL: ${repo.clone_url}\n\n`;
					});
					await sock.sendMessage(sender, { text: caption }, { quoted: message });
				}
				await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
			} catch (error) {
				console.log('Failed to get data', error);
				await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
			}
		}
	
		if (messageContent === '.source') {
			await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
			try {
				const imagePath = path.join(__dirname, '../public/ss.png');
				const response = await axios.get('https://api.github.com/repos/fitri-hy/whatsapp-bot-ui');
				const data = response.data;
				const caption = `🤖️ Name: ${data.name}\n` +
					`⭐ Start: ${data.stargazers_count}\n` +
					`📺️ Watchers: ${data.watchers_count}\n` +
					`💥 Forks: ${data.forks_count}\n` +
					`⚠️ Issues: ${data.open_issues_count}\n` +
					`🕓 Last Update: ${data.updated_at}\n` +
					`🔗 Url: ${data.clone_url}\n`;
				await sock.sendMessage(sender, { image: { url: imagePath }, caption: caption }, { quoted: message });
				await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
			} catch (error) {
				console.log(`Failed to get data`, error);
				await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
			}
		}
		
		if (messageContent.startsWith(`${config.cmd.CMD_CERTIFICATE} `)) {
			const name = messageContent.replace(`${config.cmd.CMD_CERTIFICATE} `, '').trim();
			await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
			try {
				const imagePath = await Certificate(name);
				const caption = `Certificate for ${name} has been created!`;
				await sock.sendMessage(sender, { image: { url: imagePath }, caption: caption }, { quoted: message });
				await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
				fs.unlinkSync(imagePath);
			} catch (error) {
				console.log(`Failed to create certificate for ${name}:`, error);
				await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
			}
		}

		if (messageContent.startsWith(`${config.cmd.CMD_VULNERABILITY} `)) {
			const domain = messageContent.replace(`${config.cmd.CMD_VULNERABILITY} `, '').trim();
			await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
			try {
				const ResultVulnerability = await CheckVulnerability(domain);
				await sock.sendMessage(sender, { text: ResultVulnerability }, { quoted: message });
				await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
			} catch (error) {
				console.log(`Failed to lookup HTTP headers or vulnerabilities for ${domain}:`, error);
				await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
			}
		}
		if (messageContent.startsWith(`${config.cmd.CMD_SSL_LOCKUP} `)) {
			const domain = messageContent.replace(`${config.cmd.CMD_SSL_LOCKUP} `, '').trim();
			await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
			try {
				const sslResult = await sslLookup(domain);
				await sock.sendMessage(sender, { text: sslResult }, { quoted: message });
				await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
			} catch (error) {
				console.log(`Failed to lookup SSL for ${domain}:`, error);
				await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
			}
		}
		if (messageContent.startsWith(`${config.cmd.CMD_HTTP_LOCKUP} `)) {
			const domain = messageContent.replace(`${config.cmd.CMD_HTTP_LOCKUP} `, '').trim();
			await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
			try {
				const httpResult = await httpHeadersLookup(domain);
				await sock.sendMessage(sender, { text: httpResult }, { quoted: message });
				await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
			} catch (error) {
				console.log(`Failed to lookup SSL for ${domain}:`, error);
				await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
			}
		}

		if (messageContent.startsWith(`${config.cmd.CMD_DSN_LOCKUP} `)) {
			const domain = messageContent.replace(`${config.cmd.CMD_DSN_LOCKUP} `, '').trim();
			await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
			try {
				const getData = await dnsLookup(domain);
				const formattedResult = `*Result DNS Lookup*\n\n` +
					`- Domain\n> ${domain}\n` +
					`- A Records\n> ${getData.aRecords ? getData.aRecords.join(', ') : 'N/A'}\n` +
					`- AAAA Records\n> ${getData.aaaaRecords ? getData.aaaaRecords.join(', ') : 'N/A'}\n` +
					`- NS Records\n> ${getData.nsRecords ? getData.nsRecords.join(', ') : 'N/A'}\n` +
					`- SOA Record\n> ${getData.soaRecord ? JSON.stringify(getData.soaRecord) : 'N/A'}\n` +
					`- MX Records\n> ${getData.mxRecords ? getData.mxRecords.map(mx => JSON.stringify(mx)).join(', ') : 'N/A'}\n` +
					`- CAA Records\n> ${getData.caaRecords ? getData.caaRecords.map(caa => JSON.stringify(caa)).join(', ') : 'N/A'}\n` +
					`- TXT Records\n> ${getData.txtRecords ? getData.txtRecords.map(txt => JSON.stringify(txt)).join(', ') : 'N/A'}`;

				await sock.sendMessage(sender, { text: formattedResult }, { quoted: message });
				await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
			} catch (error) {
				console.log(`Failed to lookup DNS for ${domain}:`, error);
				await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
			}
		}

		const validFileTypes = [config.cmd.CMD_PDF, config.cmd.CMD_DOC, config.cmd.CMD_DOCX, config.cmd.CMD_XLS, config.cmd.CMD_XLSX, config.cmd.CMD_PPT, config.cmd.CMD_PPTX, config.cmd.CMD_TXT, config.cmd.CMD_HTML, config.cmd.CMD_HTM, config.cmd.CMD_CSV, config.cmd.CMD_RTF, config.cmd.CMD_ODT, config.cmd.CMD_ODS, config.cmd.CMD_ODP, config.cmd.CMD_EPUB, config.cmd.CMD_ZIP, config.cmd.CMD_GZ];
		if (validFileTypes.some(type => messageContent.startsWith(`${type}`))) {
			const parts = messageContent.split(' ');
			const fileType = parts[0].substring(1);
			const query = parts.slice(1).join(' ').trim();
			await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
			try {
				const responseMessage = await FileSearch(query, fileType);
				await sock.sendMessage(sender, { text: responseMessage }, { quoted: message });
				console.log(`Response: ${responseMessage}`);
				await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
			} catch (error) {
				console.error('Error sending message:', error);
				await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
			}
		}
		
		if (messageContent.startsWith(`${config.cmd.CMD_GOOGLE_PRODUCT} `)) {
			const query = messageContent.replace(`${config.cmd.CMD_GOOGLE_PRODUCT} `, '').trim();
			await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
			try {
				const results = await ProductPrices(query);
				if (results.length === 0) {
					await sock.sendMessage(sender, { text: 'No results found for: ' + query}, { quoted: message });
					await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
					return;
				}
				const header = `*Price Compare: ${query}*\n\n`;
				const responseText = results.map(result => {
					return `Site: *${result.site}*\n- ${result.title}\n- ${result.price}\n\n`;
				}).join('');
				await sock.sendMessage(sender, { text: header + responseText, quoted: message });
				await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
			} catch (error) {
				console.error('Error fetching data:', error);
				await sock.sendMessage(sender, { text: 'Error fetching data: ' + error.message, quoted: message });
				await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
			}
		}

		if (messageContent === `${config.cmd.CMD_QUOTE}`) {
			await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });

			try {
				const responseMessage = await quoteRandom();
				const quoteData = `${responseMessage.quotes}\n\n*~${responseMessage.author}*`;
				await sock.sendMessage(sender, { text: quoteData }, { quoted: message });
				await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
			} catch (error) {
				console.error('Error sending message:', error);
				await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
			}
		}
		
		if (messageContent === `${config.cmd.CMD_BUCIN}`) {
			await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });

			try {
				const responseMessage = await bucinRandom();
				await sock.sendMessage(sender, { text: responseMessage }, { quoted: message });
				await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
			} catch (error) {
				console.error('Error sending message:', error);
				await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
			}
		}
		
		if (messageContent === `${config.cmd.CMD_DILAN}`) {
			await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });

			try {
				const responseMessage = await dilanRandom();
				await sock.sendMessage(sender, { text: responseMessage }, { quoted: message });
				await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
			} catch (error) {
				console.error('Error sending message:', error);
				await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
			}
		}
		
		if (messageContent === `${config.cmd.CMD_KECKER}`) {
			await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });

			try {
				const responseMessage = await heckerRandom();
				await sock.sendMessage(sender, { text: responseMessage }, { quoted: message });
				await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
			} catch (error) {
				console.error('Error sending message:', error);
				await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
			}
		}

		if (messageContent === `${config.cmd.CMD_KATA}`) {
			await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });

			try {
				const responseMessage = await kataKataRandom();
				await sock.sendMessage(sender, { text: responseMessage }, { quoted: message });
				await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
			} catch (error) {
				console.error('Error sending message:', error);
				await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
			}
		}

		if (config.settings.ANTI_LINK) {
			try {
				const regexLinks = /https?:\/\/([^\/]+)|\b([a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})\b/g;
				const foundLinks = messageContent.match(regexLinks);
				if (foundLinks) {
					const domains = foundLinks.map(link => {
						if (link.startsWith('http')) {
							try {
								return new URL(link).hostname;
							} catch (error) {
								console.error('Error creating URL:', error);
								return null;
							}
						} else {
							return link;
						}
					}).filter(domain => domain);
					const excludedDomains = config.excludeLinks.map(link => new URL(link).hostname).join('|');
					const regexExcludedDomains = new RegExp(`^(${excludedDomains})$`, 'i');
					const isExcluded = domains.some(domain => regexExcludedDomains.test(domain));
					if (!isExcluded) {
						await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
						await new Promise(resolve => setTimeout(resolve, 3000));
						await sock.sendMessage(sender, { delete: message.key });
						return true;
					}
				}
			} catch (error) {
				console.error('Error processing links:', error);
			}
		}

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

		const deleteFile = (filePath) => {
			fs.unlink(filePath, (err) => {
				if (err) {
					console.error(`Error deleting file: ${err.message}`);
				}
			});
		};

		// Define handleMediaDownload function above its usage
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

		for (const { cmd, platform, mediaType } of mediaCommands) {
			if (messageContent.startsWith(cmd)) {
				const url = messageContent.split(' ')[1];
				await handleMediaDownload(platform, mediaType, url, sender, message, sock);
				break;
			}
		}
	}
	
	if ((config.settings.SELF_GROUP && message.key.fromMe) || !config.settings.SELF_GROUP) {
		
		if (messageContent.startsWith(`${config.cmdGroup.CMD_ADD}`)) {
            const phoneNumber = messageContent.split(' ')[1];
            await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
            if (phoneNumber) {
                const userJid = `${phoneNumber}@s.whatsapp.net`;
                try {
                    await sock.groupParticipantsUpdate(sender, [userJid], "add");
                    await sock.sendMessage(sender, { text: "User added!" }, { quoted: message });
                    await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
                } catch (error) {
                    console.error('Error adding user:', error);
                    await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
                }
            } else {
                await sock.sendMessage(sender, { text: "Please provide a phone number to add." }, { quoted: message });
                await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
            }
        }
		
		if (messageContent.startsWith(`${config.cmdGroup.CMD_KICK}`)) {
            const mentionedJid = message.message.extendedTextMessage.contextInfo.mentionedJid;
            await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
            if (mentionedJid && mentionedJid.length > 0) {
                try {
                    await sock.groupParticipantsUpdate(sender, mentionedJid, "remove");
                    await sock.sendMessage(sender, { text: "User(s) Kicked!" }, { quoted: message });
                    await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
                } catch (error) {
                    console.error('Error demoting user:', error);
                    await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
                }
            } else {
                await sock.sendMessage(sender, { text: "Please mention a user to Kick." }, { quoted: message });
                await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
            }
        }
		
		if (messageContent.startsWith(`${config.cmdGroup.CMD_TITLE}`)) {
            const newName = messageContent.split(' ').slice(1).join(' ');
            await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
            if (newName) {
                try {
                    await sock.groupUpdateSubject(sender, newName);
                    await sock.sendMessage(sender, { text: "Group name changed!" }, { quoted: message });
                    await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
                } catch (error) {
                    console.error('Error changing group name:', error);
                    await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
                }
            } else {
                await sock.sendMessage(sender, { text: "Please enter a new group name." }, { quoted: message });
                await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
            }
        }

        if (messageContent.startsWith(`${config.cmdGroup.CMD_DESC}`)) {
            const newDesc = messageContent.split(' ').slice(1).join(' ');
            await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
            if (newDesc) {
                try {
                    await sock.groupUpdateDescription(sender, newDesc);
                    await sock.sendMessage(sender, { text: "Group description changed!" }, { quoted: message });
                    await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
                } catch (error) {
                    console.error('Error changing group description:', error);
                    await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
                }
            } else {
                await sock.sendMessage(sender, { text: "Please enter a new group description." }, { quoted: message });
                await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
            }
        }
		
		if (messageContent.startsWith(`${config.cmdGroup.CMD_PROMOTE}`)) {
            const mentionedJid = message.message.extendedTextMessage.contextInfo.mentionedJid;
            await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
            if (mentionedJid && mentionedJid.length > 0) {
                try {
                    await sock.groupParticipantsUpdate(sender, mentionedJid, "promote");
                    await sock.sendMessage(sender, { text: "User(s) Promoted!" }, { quoted: message });
                    await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
                } catch (error) {
                    console.error('Error promoting user:', error);
                    await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
                }
            } else {
                await sock.sendMessage(sender, { text: "Please mention a user to Promote." }, { quoted: message });
                await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
            }
        }
		
		if (messageContent.startsWith(`${config.cmdGroup.CMD_DEMOTE}`)) {
            const mentionedJid = message.message.extendedTextMessage.contextInfo.mentionedJid;
            await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
            if (mentionedJid && mentionedJid.length > 0) {
                try {
                    await sock.groupParticipantsUpdate(sender, mentionedJid, "demote");
                    await sock.sendMessage(sender, { text: "User(s) Demoted!" }, { quoted: message });
                    await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
                } catch (error) {
                    console.error('Error demoting user:', error);
                    await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
                }
            } else {
                await sock.sendMessage(sender, { text: "Please mention a user to Demote." }, { quoted: message });
                await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
            }
        }
		
		if (messageContent === `${config.cmdGroup.CMD_LOCK_CHAT}`) {
            await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
            try {
                await sock.groupSettingUpdate(sender, "announcement");
                await sock.sendMessage(sender, { text: "Chat locked! Only admins can send messages." }, { quoted: message });
                await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
            } catch (error) {
                console.error('Error closing chat:', error);
                await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
            }
        }

        if (messageContent === `${config.cmdGroup.CMD_UNLOCK_CHAT}`) {
            await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });
            try {
                await sock.groupSettingUpdate(sender, "not_announcement");
                await sock.sendMessage(sender, { text: "Chat unlocked! Everyone can send messages." }, { quoted: message });
                await sock.sendMessage(sender, { react: { text: "✅", key: message.key } });
            } catch (error) {
                console.error('Error opening chat:', error);
                await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
            }
        }
		
	}

};

module.exports = AdvancedResponse;
