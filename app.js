const express = require('express');
const { WebSocketServer } = require('ws');
const { WaBot } = require('fhy-wabot');
const QRCode = require('qrcode');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { exec, spawn } = require('child_process');
const AdvancedResponse = require('./messages/advancedResponse');
const AutoResponse = require('./settings/auto_response.json');
const configPath = path.join(__dirname, './settings/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const configAutoResponsePath = path.join(__dirname, './settings/auto_response.json');
const configEntertainPath = path.join(__dirname, './settings/entertain.json');

const app = express();
const PORT = process.env.PORT || 3000;

let qrCodeUrl;
let messages = [];
let sock;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

const QRCustom = async (qr) => {
    try {
        qrCodeUrl = await QRCode.toDataURL(qr);
        console.log('Custom QRCode URL:', qrCodeUrl);
        if (wss) {
            wss.clients.forEach(client => {
                if (client.readyState === client.OPEN) {
                    client.send(JSON.stringify({ qrCodeUrl }));
                }
            });
        }
    } catch (err) {
        console.error('Failed to generate QR URL:', err);
    }
};

const ManualResponse = {};

(async () => {
    sock = await WaBot(QRUrl = config.settings.QR_URL, QRCustom, AutoResponse, ManualResponse, self = config.settings.SELF);

    sock.ev.on('messages.upsert', async (messageUpdate) => {
        const message = messageUpdate.messages[0];
        const sender = message.key.remoteJid;
        const messageContent = message.message && (message.message.conversation || message.message.extendedTextMessage?.text) || 'Not detected!';
		const key = message.key;
		
        let jsonResponse;

        if (message.key.fromMe) {
            jsonResponse = {
                sender: 'Bot',
                senderId: sender,
                message: messageContent,
            };
        } else if (message.key.remoteJid.endsWith('@g.us')) {
            const groupMetadata = await sock.groupMetadata(sender);
            const groupTitle = groupMetadata.subject;
            const participantId = message.key.participant;

            const participantInfo = groupMetadata.participants.find(p => p.id === participantId);
            const participantName = participantInfo ? participantInfo.notify || participantId.split('@')[0] : participantId.split('@')[0];

            jsonResponse = {
                group: groupTitle,
                groupId: sender,
                participant: participantName,
                participantId: participantId,
                message: messageContent,
            };
        } else {
            jsonResponse = {
                sender: sender.split('@')[0],
                senderId: sender,
                message: messageContent,
            };
        }

        console.log(JSON.stringify(jsonResponse, null, 2));
		
		if (messageContent !== 'Not detected!') {
			messages.push(jsonResponse);

			if (wss) {
				wss.clients.forEach(client => {
					if (client.readyState === client.OPEN) {
						client.send(JSON.stringify({ messageData: jsonResponse }));
					}
				});
			}
		}

        await AdvancedResponse(messageContent, sender, sock, message, key );
		
    });
})();

const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws) => {
    console.log('New client connected');
    if (qrCodeUrl) {
        ws.send(JSON.stringify({ qrCodeUrl }));
    }

    messages.forEach(message => {
        ws.send(JSON.stringify({ messageData: message }));
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
    });
});

const saveMessageToHistory = (messageData, filePath, res) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading history file:', err);
            return res.status(500).json({ success: false, message: 'Internal Server Error' });
        }

        let history = [];
        if (data) {
            try {
                history = JSON.parse(data);
            } catch (parseErr) {
                console.error('Error parsing history JSON:', parseErr);
                return res.status(500).json({ success: false, message: 'Internal Server Error' });
            }
        }

        history.push(messageData);

        fs.writeFile(filePath, JSON.stringify(history, null, 2), (writeErr) => {
            if (writeErr) {
                console.error('Error writing history file:', writeErr);
                return res.status(500).json({ success: false, message: 'Internal Server Error' });
            }

            res.json({ success: true, message: 'Message history saved' });
        });
    });
};

app.get('/', (req, res) => {
    const sessionPath = path.join(__dirname, 'auth_info', 'session-');
    fs.readdir(path.join(__dirname, 'auth_info'), (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return res.status(500).send('Internal Server Error');
        }
        const sessionExists = files.some(file => file.startsWith('session-'));
        if (sessionExists) {
            return res.redirect('/dashboard');
        }
        res.render('qr');
    });
});

app.get('/dashboard', (req, res) => {
    const authInfoPath = path.join(__dirname, 'auth_info');
    const sessionPath = path.join(authInfoPath, 'session-');
    if (!fs.existsSync(authInfoPath)) {
        return res.redirect('/');
    }
    const sessionFiles = fs.readdirSync(authInfoPath).filter(file => file.startsWith('session-'));
    if (sessionFiles.length === 0) {
        return res.redirect('/');
    }
    res.render('dashboard');
});

app.get('/settings', (req, res) => {
    const authInfoPath = path.join(__dirname, 'auth_info');
    const sessionPath = path.join(authInfoPath, 'session-');
    if (!fs.existsSync(authInfoPath)) {
        return res.redirect('/');
    }
    const sessionFiles = fs.readdirSync(authInfoPath).filter(file => file.startsWith('session-'));
    if (sessionFiles.length === 0) {
        return res.redirect('/');
    }
    fs.readFile(configPath, 'utf8', (err, configData) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read config file' });
        }

        fs.readFile(configAutoResponsePath, 'utf8', (err, autoResponseData) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to read auto response file' });
            }

            fs.readFile(configEntertainPath, 'utf8', (err, entertainData) => {
                if (err) {
                    return res.status(500).json({ error: 'Failed to read entertain file' });
                }

                const config = JSON.parse(configData);
                const autoResponse = JSON.parse(autoResponseData);
                const entertain = JSON.parse(entertainData);

                res.render('settings', { config, autoResponse, entertain });
            });
        });
    });
});

app.post('/settings/update', (req, res) => {
    const updatedAutoResponse = req.body.autoCommand;
    fs.writeFile(configAutoResponsePath, updatedAutoResponse, 'utf8', (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to save auto response file' });
        }
        res.redirect('/settings');
    });
});

app.post('/settings/katakata', (req, res) => {
    fs.readFile(configEntertainPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed to read auto response file' });

        let currentData;
        try {
            currentData = JSON.parse(data);
        } catch {
            return res.status(400).json({ error: 'Invalid JSON format' });
        }
        let updatedKataKata;
        try {
            updatedKataKata = JSON.parse(req.body.kataKata);
        } catch {
            return res.status(400).json({ error: 'Invalid JSON format for kataKata' });
        }
        currentData.kataKata = updatedKataKata;
        fs.writeFile(configEntertainPath, JSON.stringify(currentData, null, 2), 'utf8', (err) => {
            if (err) return res.status(500).json({ error: 'Failed to save auto response file' });
            res.redirect('/settings');
        });
    });
});

app.post('/settings/hecker', (req, res) => {
    fs.readFile(configEntertainPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed to read auto response file' });

        let currentData;
        try {
            currentData = JSON.parse(data);
        } catch {
            return res.status(400).json({ error: 'Invalid JSON format' });
        }
        let updatedKataKata;
        try {
            updatedKataKata = JSON.parse(req.body.hecker);
        } catch {
            return res.status(400).json({ error: 'Invalid JSON format for hecker' });
        }
        currentData.hecker = updatedKataKata;
        fs.writeFile(configEntertainPath, JSON.stringify(currentData, null, 2), 'utf8', (err) => {
            if (err) return res.status(500).json({ error: 'Failed to save auto response file' });
            res.redirect('/settings');
        });
    });
});

app.post('/settings/bucin', (req, res) => {
    fs.readFile(configEntertainPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed to read auto response file' });

        let currentData;
        try {
            currentData = JSON.parse(data);
        } catch {
            return res.status(400).json({ error: 'Invalid JSON format' });
        }
        let updatedKataKata;
        try {
            updatedKataKata = JSON.parse(req.body.bucin);
        } catch {
            return res.status(400).json({ error: 'Invalid JSON format for bucin' });
        }
        currentData.bucin = updatedKataKata;
        fs.writeFile(configEntertainPath, JSON.stringify(currentData, null, 2), 'utf8', (err) => {
            if (err) return res.status(500).json({ error: 'Failed to save auto response file' });
            res.redirect('/settings');
        });
    });
});

app.post('/settings/dilan', (req, res) => {
    fs.readFile(configEntertainPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed to read auto response file' });

        let currentData;
        try {
            currentData = JSON.parse(data);
        } catch {
            return res.status(400).json({ error: 'Invalid JSON format' });
        }
        let updatedKataKata;
        try {
            updatedKataKata = JSON.parse(req.body.dilan);
        } catch {
            return res.status(400).json({ error: 'Invalid JSON format for dilan' });
        }
        currentData.dilan = updatedKataKata;
        fs.writeFile(configEntertainPath, JSON.stringify(currentData, null, 2), 'utf8', (err) => {
            if (err) return res.status(500).json({ error: 'Failed to save auto response file' });
            res.redirect('/settings');
        });
    });
});

app.post('/settings/quote', (req, res) => {
    fs.readFile(configEntertainPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed to read auto response file' });

        let currentData;
        try {
            currentData = JSON.parse(data);
        } catch {
            return res.status(400).json({ error: 'Invalid JSON format' });
        }
        let updatedKataKata;
        try {
            updatedKataKata = JSON.parse(req.body.quote);
        } catch {
            return res.status(400).json({ error: 'Invalid JSON format for quote' });
        }
        currentData.quote = updatedKataKata;
        fs.writeFile(configEntertainPath, JSON.stringify(currentData, null, 2), 'utf8', (err) => {
            if (err) return res.status(500).json({ error: 'Failed to save auto response file' });
            res.redirect('/settings');
        });
    });
});

app.post('/update-badwords', (req, res) => {
    try {
        const badwordsArray = req.body.badwords.split(',').map(word => word.trim()).filter(word => word);
        config.badwords = badwordsArray;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
        res.redirect('/settings');
    } catch (err) {
        console.error('Failed to save badwords:', err);
        return res.status(500).json({ error: 'Failed to save badwords' });
    }
});

app.post('/update-link', (req, res) => {
    try {
        const linkArray = req.body.linkExcluded.split(',').map(word => word.trim()).filter(word => word);
        config.excludeLinks = linkArray;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
        res.redirect('/settings');
    } catch (err) {
        console.error('Failed to save exclude links:', err);
        return res.status(500).json({ error: 'Failed to save exclude links' });
    }
});

app.post('/settings', (req, res) => {
    const newCommands = {
        CMD_WALLPAPER: req.body.CMD_WALLPAPER,
        CMD_CERTIFICATE: req.body.CMD_CERTIFICATE,
        CMD_VULNERABILITY: req.body.CMD_VULNERABILITY,
        CMD_HTTP_LOCKUP: req.body.CMD_HTTP_LOCKUP,
        CMD_SSL_LOCKUP: req.body.CMD_SSL_LOCKUP,
        CMD_DSN_LOCKUP: req.body.CMD_DSN_LOCKUP,
        CMD_GEMINI: req.body.CMD_GEMINI,
        CMD_GEMINI_IMG: req.body.CMD_GEMINI_IMG,
        CMD_STICKER: req.body.CMD_STICKER,
        CMD_TO_VOICE: req.body.CMD_TO_VOICE,
        CMD_COUNTRY: req.body.CMD_COUNTRY,
        CMD_TRANSLATE: req.body.CMD_TRANSLATE,
        CMD_WEATHER: req.body.CMD_WEATHER,
        CMD_SSWEB: req.body.CMD_SSWEB,
        CMD_SSMOBILE: req.body.CMD_SSMOBILE,
        CMD_SEO: req.body.CMD_SEO,
        CMD_GITHUB: req.body.CMD_GITHUB,
        CMD_OCR: req.body.CMD_OCR,
        CMD_COUNT_WORDS: req.body.CMD_COUNT_WORDS,
        CMD_QRCODE: req.body.CMD_QRCODE,
        CMD_SURAH: req.body.CMD_SURAH,
        CMD_SURAH_DETAIL: req.body.CMD_SURAH_DETAIL,
        CMD_WIKIPEDIA_SEARCH: req.body.CMD_WIKIPEDIA_SEARCH,
        CMD_WIKIPEDIA_IMG: req.body.CMD_WIKIPEDIA_IMG,
        CMD_WIKIPEDIA_AI: req.body.CMD_WIKIPEDIA_AI,
        CMD_TWDLMP4: req.body.CMD_TWDLMP4,
        CMD_TWDLMP3: req.body.CMD_TWDLMP3,
        CMD_IGDLMP4: req.body.CMD_IGDLMP4,
        CMD_IGDLMP3: req.body.CMD_IGDLMP3,
        CMD_TKDLMP4: req.body.CMD_TKDLMP4,
        CMD_TKDLMP3: req.body.CMD_TKDLMP3,
        CMD_VMDLMP4: req.body.CMD_VMDLMP4,
        CMD_VMDLMP3: req.body.CMD_VMDLMP3,
        CMD_FBDLMP4: req.body.CMD_FBDLMP4,
        CMD_FBDLMP3: req.body.CMD_FBDLMP3,
        CMD_YTDLMP4: req.body.CMD_YTDLMP4,
        CMD_YTDLMP3: req.body.CMD_YTDLMP3,
        CMD_AES_ENC: req.body.CMD_AES_ENC,
        CMD_AES_DEC: req.body.CMD_AES_DEC,
        CMD_CAMELIA_ENC: req.body.CMD_CAMELIA_ENC,
        CMD_CAMELIA_DES: req.body.CMD_CAMELIA_DES,
        CMD_SHA: req.body.CMD_SHA,
        CMD_MD5: req.body.CMD_MD5,
        CMD_RIPEMD: req.body.CMD_RIPEMD,
        CMD_BCRYPT: req.body.CMD_BCRYPT,
        CMD_QUOTE: req.body.CMD_QUOTE,
        CMD_BUCIN: req.body.CMD_BUCIN,
        CMD_DILAN: req.body.CMD_DILAN,
        CMD_KECKER: req.body.CMD_KECKER,
        CMD_KATA: req.body.CMD_KATA,
        CMD_GOOGLE_PRODUCT: req.body.CMD_GOOGLE_PRODUCT,
        CMD_PDF: req.body.CMD_PDF,
        CMD_DOC: req.body.CMD_DOC,
        CMD_DOCX: req.body.CMD_DOCX,
        CMD_XLS: req.body.CMD_XLS,
        CMD_XLSX: req.body.CMD_XLSX,
        CMD_PPT: req.body.CMD_PPT,
        CMD_PPTX: req.body.CMD_PPTX,
        CMD_TXT: req.body.CMD_TXT,
        CMD_HTML: req.body.CMD_HTML,
        CMD_HTM: req.body.CMD_HTM,
        CMD_CSV: req.body.CMD_CSV,
        CMD_RTF: req.body.CMD_RTF,
        CMD_ODT: req.body.CMD_ODT,
        CMD_ODS: req.body.CMD_ODS,
        CMD_ODP: req.body.CMD_ODP,
        CMD_EPUB: req.body.CMD_EPUB,
        CMD_ZIP: req.body.CMD_ZIP,
        CMD_GZ: req.body.CMD_GZ,
        CMD_UNLOCK_CHAT: req.body.CMD_UNLOCK_CHAT,
        CMD_LOCK_CHAT: req.body.CMD_LOCK_CHAT,
        CMD_TITLE: req.body.CMD_TITLE,
        CMD_DESC: req.body.CMD_DESC,
        CMD_PROMOTE: req.body.CMD_PROMOTE,
        CMD_DEMOTE: req.body.CMD_DEMOTE,
        CMD_ADD: req.body.CMD_ADD,
        CMD_KICK: req.body.CMD_KICK,
    };

    fs.readFile(configPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read config file' });
        }
        const config = JSON.parse(data);
        config.cmd = { ...config.cmd, ...newCommands };
        fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8', (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to write config file' });
            }
            res.redirect('/settings');
        });
    });
});

app.post('/settings-group', (req, res) => {
    const newCommands = {
        CMD_UNLOCK_CHAT: req.body.CMD_UNLOCK_CHAT,
        CMD_LOCK_CHAT: req.body.CMD_LOCK_CHAT,
        CMD_TITLE: req.body.CMD_TITLE,
        CMD_DESC: req.body.CMD_DESC,
        CMD_PROMOTE: req.body.CMD_PROMOTE,
        CMD_DEMOTE: req.body.CMD_DEMOTE,
        CMD_ADD: req.body.CMD_ADD,
        CMD_KICK: req.body.CMD_KICK,
    };

    fs.readFile(configPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read config file' });
        }
        const config = JSON.parse(data);
        config.cmdGroup = { ...config.cmdGroup, ...newCommands };
        fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8', (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to write config file' });
            }
            res.redirect('/settings');
        });
    });
});

app.post('/settings-utl', (req, res) => {
    const newCommands = {
        QR_URL: req.body.QR_URL === 'true',
        SELF: req.body.SELF === 'true',
        SELF_GROUP: req.body.SELF_GROUP === 'true',
        ANTI_BADWORDS: req.body.ANTI_BADWORDS === 'true',
        ANTI_LINK: req.body.ANTI_LINK === 'true',
        GEMINI_API: req.body.GEMINI_API,
        GEMINI_PROMPT: req.body.GEMINI_PROMPT,
        TO_VOICE: req.body.TO_VOICE,
        WIKI_LANG: req.body.WIKI_LANG,
    };

    fs.readFile(configPath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read config file' });
        }
        const config = JSON.parse(data);
        config.settings = { ...config.settings, ...newCommands };
        fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8', (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to write config file' });
            }
            res.redirect('/settings');
        });
    });
});

app.post('/restart-server', (req, res) => {
    res.json({ success: true, message: 'Server is restarting...' });
    setTimeout(() => {
        process.exit(0);
    }, 1000);
});

app.delete('/delete-auth-info', (req, res) => {
    const authInfoPath = path.join(__dirname, 'auth_info');
    fs.rm(authInfoPath, { recursive: true, force: true }, (err) => {
        if (err) {
            console.error('Failed to delete Auth:', err);
            return res.status(500).json({ success: false, message: 'Failed to delete Auth' });
        }
        console.log('Auth deleted successfully');
        
        res.json({ success: true, message: 'Auth deleted, restarting server...' });
        setTimeout(() => {
            process.exit(0);
        }, 1000);
    });
});

app.get('/message', (req, res) => {
    const authInfoPath = path.join(__dirname, 'auth_info');
    const sessionPath = path.join(authInfoPath, 'session-');
    if (!fs.existsSync(authInfoPath)) {
        return res.redirect('/');
    }
    const sessionFiles = fs.readdirSync(authInfoPath).filter(file => file.startsWith('session-'));
    if (sessionFiles.length === 0) {
        return res.redirect('/');
    }
    res.render('message');
});

app.post('/send-message', async (req, res) => {
    const {
        text,
        image,
        video,
        audio,
        mention,
        location,
        polling,
        vcard
    } = req.body;
    const promises = [];
    if (text) {
        text.forEach(item => {
            if (item.id && item.messageText) {
                promises.push(sock.sendMessage(`${item.id}@s.whatsapp.net`, { text: item.messageText }));
            }
        });
    }
	if (image) {
        image.forEach(item => {
            if (item.id && item.url) {
                promises.push(sock.sendMessage(`${item.id}@s.whatsapp.net`, { image: { url: item.url, caption: item.caption || '' } }));
            }
        });
    }
    if (video) {
        video.forEach(item => {
            if (item.id && item.url) {
                promises.push(sock.sendMessage(`${item.id}@s.whatsapp.net`, { video: { url: item.url, caption: item.caption || '' } }));
            }
        });
    }
    if (audio) {
        audio.forEach(item => {
            if (item.id && item.url) {
                promises.push(sock.sendMessage(`${item.id}@s.whatsapp.net`, { audio: { url: item.url, caption: item.caption || '' } }));
            }
        });
    }
    if (mention) {
        mention.forEach(item => {
            if (item.id && item.messageText && item.mention) {
                promises.push(sock.sendMessage(`${item.id}@s.whatsapp.net`, { text: item.messageText, mentions: [item.mention] }));
            }
        });
    }
    if (location) {
        location.forEach(item => {
            if (item.id && item.latitude && item.longitude) {
                promises.push(sock.sendMessage(`${item.id}@s.whatsapp.net`, { location: { latitude: item.latitude, longitude: item.longitude } }));
            }
        });
    }
    if (polling) {
        polling.forEach(item => {
            if (item.id && item.name && item.values) {
                promises.push(sock.sendMessage(`${item.id}@s.whatsapp.net`, {
                    poll: {
                        name: item.name,
                        options: item.values,
                        selectableCount: item.selectableCount,
                    }
                }));
            }
        });
    }
    if (vcard) {
        vcard.forEach(item => {
            if (item.id && item.fullName && item.phoneId) {
                promises.push(sock.sendMessage(`${item.id}@s.whatsapp.net`, {
                    contacts: [{
                        displayName: item.fullName,
                        org: item.organization,
                        phones: [{ phone: item.phoneId }],
                        vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${item.fullName}\nORG:${item.organization}\nTEL;TYPE=CELL:${item.phoneId}\nEND:VCARD`
                    }]
                }));
            }
        });
    }
    try {
        await Promise.all(promises);
        res.json({ message: 'Messages sent successfully.' });
    } catch (error) {
        console.error('Failed to send messages:', error);
        res.status(500).json({ error: 'Failed to send messages.' });
    }
});
