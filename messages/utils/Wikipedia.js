const axios = require('axios');
const fs = require('fs');
const path = require('path');
const configPath = path.join(__dirname, '../../settings/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

async function WikipediaAI(query, sock, sender, message) {
    await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });

    try {
        const wikiApiUrl = `https://${config.settings.WIKI_LANG}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&utf8=1&origin=*`;
        const response = await axios.get(wikiApiUrl);
        const searchResults = response.data.query.search;

        if (searchResults.length > 0) {
            const result = searchResults[0];
           const responseMessage = `*${result.title}*\n\n${result.snippet.replace(/<[^>]+>/g, '')}...\n\nBaca lebih lanjut di: https://${config.settings.WIKI_LANG}.wikipedia.org/wiki/${encodeURIComponent(result.title)}`;
            console.log(`Response: ${responseMessage}`);
            return responseMessage;
        } else {
            const responseMessage = "No results found.";
            console.log(`Response: ${responseMessage}`);
            return responseMessage;
        }
    } catch (error) {
        await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
    }
}

async function WikipediaSearch(query, sock, sender, message) {
    await sock.sendMessage(sender, { react: { text: "⌛", key: message.key } });

    try {
        const wikiApiUrl = `https://${config.settings.WIKI_LANG}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=10&format=json&utf8=1&origin=*`;
        const response = await axios.get(wikiApiUrl);
        const searchResults = response.data.query.search;

        if (searchResults.length > 0) {
            let responseMessage = "Search results:\n\n";
            
            for (const result of searchResults) {
                const title = result.title;
                const snippet = result.snippet.replace(/<[^>]+>/g, '');
                responseMessage += `*${title}*\n${snippet}...\nRead more at: https://${config.settings.WIKI_LANG}.wikipedia.org/wiki/${encodeURIComponent(title)}\n\n`;
            }

            console.log(`Response: ${responseMessage}`);
            return responseMessage;
        } else {
            const responseMessage = "No results found.";
            console.log(`Response: ${responseMessage}`);
            return responseMessage;
        }
    } catch (error) {
        await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
    }
}

async function WikipediaImage(query) {
    try {
        const searchResponse = await axios.get(`https://${config.settings.WIKI_LANG}.wikipedia.org/w/api.php`, {
            params: {
                action: 'query',
                format: 'json',
                list: 'search',
                srsearch: query,
                utf8: 1,
                srlimit: 1
            }
        });
        const pageId = searchResponse.data.query.search[0]?.pageid;
        if (!pageId) {
            await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
            return;
        }
        const imageResponse = await axios.get(`https://${config.settings.WIKI_LANG}.wikipedia.org/w/api.php`, {
            params: {
                action: 'query',
                format: 'json',
                prop: 'pageimages',
                pageids: pageId,
                pilimit: 'max',
                pithumbsize: 500
            }
        });
        const imageUrl = imageResponse.data.query.pages[pageId]?.thumbnail?.source;
        const originalImageUrl = imageResponse.data.query.pages[pageId]?.imageinfo?.[0]?.url;
        const finalImageUrl = originalImageUrl || imageUrl;
        if (!finalImageUrl) {
            await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
            return;
        }
        return { url: finalImageUrl, caption: `Image search results for: ${query}` };
    } catch (error) {
        console.error("Error fetching Wikipedia image:", error);
        await sock.sendMessage(sender, { react: { text: "❌", key: message.key } });
    }
}

module.exports = { WikipediaAI, WikipediaSearch, WikipediaImage };