// index.js
// PetPad Scanner Service - Production Ready
// Auto-detects !petpad posts on Moltbook and deploys tokens via Clanker

require('dotenv').config();
const axios = require('axios');
const cron = require('node-cron');
const { createCanvas } = require('canvas');
const FormData = require('form-data');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// ===== CONFIGURATION =====
const MOLTBOOK_API_BASE = 'https://www.moltbook.com/api/v1';
const MOLTBOOK_API_KEY = process.env.MOLTBOOK_API_KEY;
const IMAGE_UPLOAD_METHOD = process.env.IMAGE_UPLOAD_METHOD || 'iili';
const IMGUR_CLIENT_ID = process.env.IMGUR_CLIENT_ID;
const CLOUDINARY_URL = process.env.CLOUDINARY_URL;
const SELF_HOSTED_URL = process.env.SELF_HOSTED_URL;
const PORT = process.env.PORT || 3000;

// ===== STATE MANAGEMENT =====
let processedPosts = new Set();
let launchedTokens = new Map();
let lastScanTime = null;
let scanCount = 0;

// ===== PIXEL ART PATTERNS =====
const PIXEL_PATTERNS = {
    dog: [
        '  ####  ',
        '  #@@#  ',
        ' #@..@# ',
        ' #@**@# ',
        '  ####  ',
        ' #@@@@# ',
        '  #  #  '
    ],
    cat: [
        ' ## ## ',
        '#@@#@@#',
        ' #@@@@# ',
        ' #@..@# ',
        '  #**#  ',
        '  ####  ',
        '  #  #  '
    ],
    hamster: [
        '  ####  ',
        ' #@@@@# ',
        '#@....@#',
        '#@@**@@#',
        ' #@@@@# ',
        '  ####  '
    ],
    bunny: [
        ' ##  ## ',
        ' #@##@# ',
        ' #@@@@# ',
        '#@....@#',
        ' #@**@# ',
        '  ####  ',
        '  #  #  '
    ]
};

const PIXEL_COLORS = {
    dog: { primary: '#D4A574', secondary: '#8B6914', accent: '#FF6B9D', eye: '#2D2D2D' },
    cat: { primary: '#9B8AA5', secondary: '#6B5B7A', accent: '#7C4DFF', eye: '#4CAF50' },
    hamster: { primary: '#FFD93D', secondary: '#E5A620', accent: '#FF6B9D', eye: '#2D2D2D' },
    bunny: { primary: '#F5F5F5', secondary: '#E0E0E0', accent: '#FFB6C1', eye: '#E91E63' }
};

// ===== LOGGING =====
function log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message, ...data };
    console.log(JSON.stringify(logEntry));
}

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== PIXEL ART GENERATOR =====
function generatePixelArt(petType, size = 256) {
    const pattern = PIXEL_PATTERNS[petType];
    const colors = PIXEL_COLORS[petType];
    
    if (!pattern || !colors) {
        throw new Error(`Invalid petType: ${petType}`);
    }
    
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    const pixelSize = Math.floor(size / 8);
    
    ctx.fillStyle = '#FFF8F0';
    ctx.fillRect(0, 0, size, size);
    
    for (let y = 0; y < pattern.length; y++) {
        for (let x = 0; x < pattern[y].length; x++) {
            const char = pattern[y][x];
            let color = null;
            
            if (char === '#') color = colors.secondary;
            else if (char === '@') color = colors.primary;
            else if (char === '.') color = colors.eye;
            else if (char === '*') color = colors.accent;
            
            if (color) {
                ctx.fillStyle = color;
                ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
            }
        }
    }
    
    return canvas.toBuffer('image/png');
}

// ===== IMAGE UPLOAD: iili.io (NO API KEY!) =====
async function uploadToIili(imageBuffer) {
    try {
        const formData = new FormData();
        formData.append('image', imageBuffer, {
            filename: `petpad-${Date.now()}.png`,
            contentType: 'image/png'
        });
        
        const response = await axios.post(
            'https://iili.io/uploadimage.php',
            formData,
            { headers: formData.getHeaders() }
        );
        
        const html = response.data;
        const match = html.match(/https:\/\/iili\.io\/[A-Za-z0-9]+\.png/);
        
        if (match) return match[0];
        throw new Error('Failed to parse iili.io response');
    } catch (error) {
        log('error', 'iili.io upload failed', { error: error.message });
        throw error;
    }
}

// ===== IMAGE UPLOAD: Imgur =====
async function uploadToImgur(imageBuffer) {
    if (!IMGUR_CLIENT_ID) {
        throw new Error('IMGUR_CLIENT_ID not configured');
    }
    
    try {
        const response = await axios.post(
            'https://api.imgur.com/3/image',
            { image: imageBuffer.toString('base64'), type: 'base64' },
            { headers: { 'Authorization': `Client-ID ${IMGUR_CLIENT_ID}` }}
        );
        return response.data.data.link;
    } catch (error) {
        log('error', 'Imgur upload failed', { error: error.message });
        throw error;
    }
}

// ===== IMAGE UPLOAD: Self-hosted =====
async function uploadToSelfHosted(imageBuffer, filename) {
    if (!SELF_HOSTED_URL) {
        throw new Error('SELF_HOSTED_URL not configured');
    }
    
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const imagePath = path.join(uploadsDir, filename);
    fs.writeFileSync(imagePath, imageBuffer);
    
    return `${SELF_HOSTED_URL}/images/${filename}`;
}

// ===== SMART IMAGE UPLOADER WITH FALLBACK =====
async function uploadImage(imageBuffer, tokenSymbol) {
    const filename = `${tokenSymbol.toLowerCase()}-${Date.now()}.png`;
    
    log('info', `Uploading image via ${IMAGE_UPLOAD_METHOD}`);
    
    try {
        switch (IMAGE_UPLOAD_METHOD) {
            case 'imgur':
                return await uploadToImgur(imageBuffer);
            case 'self-hosted':
                return await uploadToSelfHosted(imageBuffer, filename);
            case 'iili':
            default:
                return await uploadToIili(imageBuffer);
        }
    } catch (error) {
        if (IMAGE_UPLOAD_METHOD !== 'iili') {
            log('warn', 'Primary upload failed, trying iili.io fallback');
            return await uploadToIili(imageBuffer);
        }
        throw error;
    }
}

// ===== MOLTBOOK API =====
async function getMoltbookPosts(submolt = 'petpad', limit = 50) {
    try {
        const response = await axios.get(`${MOLTBOOK_API_BASE}/posts`, {
            params: { submolt, sort: 'new', limit },
            headers: { 'Authorization': `Bearer ${MOLTBOOK_API_KEY}` }
        });
        return response.data.data?.posts || [];
    } catch (error) {
        log('error', 'Failed to fetch posts', { error: error.message });
        return [];
    }
}

async function createMoltbookPost(submolt, title, content) {
    const response = await axios.post(
        `${MOLTBOOK_API_BASE}/posts`,
        { submolt, title, content },
        { headers: { 
            'Authorization': `Bearer ${MOLTBOOK_API_KEY}`,
            'Content-Type': 'application/json'
        }}
    );
    return response.data.data;
}

// ===== POST PARSER =====
function parseTokenDetails(content) {
    const lines = content.split('\n').map(l => l.trim());
    
    if (!lines.some(l => l.includes('!petpad'))) return null;
    
    const details = {};
    for (const line of lines) {
        if (line.includes(':')) {
            const [key, ...valueParts] = line.split(':');
            const value = valueParts.join(':').trim();
            const cleanKey = key.trim().toLowerCase();
            if (cleanKey && value) details[cleanKey] = value;
        }
    }
    
    const required = ['name', 'symbol', 'wallet', 'description', 'pettype'];
    const missing = required.filter(field => !details[field]);
    if (missing.length > 0) return null;
    
    const petType = details.pettype.toLowerCase();
    if (!['dog', 'cat', 'hamster', 'bunny'].includes(petType)) return null;
    if (!/^0x[a-fA-F0-9]{40}$/.test(details.wallet)) return null;
    
    return {
        name: details.name,
        symbol: details.symbol.toUpperCase(),
        wallet: details.wallet,
        description: details.description,
        petType: petType,
        website: details.website || null,
        twitter: details.twitter || null
    };
}

// ===== CLANKER DEPLOYMENT =====
async function deployTokenViaClanker(tokenDetails, imageUrl) {
    const clankerPost = `!clawnch
\`\`\`json
{
  "name": "${tokenDetails.name}",
  "symbol": "${tokenDetails.symbol}",
  "wallet": "${tokenDetails.wallet}",
  "description": "${tokenDetails.description}\\n\\n🐾 ${tokenDetails.petType.toUpperCase()} | Launched via PetPad",
  "image": "${imageUrl}"${tokenDetails.website ? `,\n  "website": "${tokenDetails.website}"` : ''}${tokenDetails.twitter ? `,\n  "twitter": "${tokenDetails.twitter}"` : ''}
}
\`\`\``;

    log('info', 'Creating Clanker post', { symbol: tokenDetails.symbol });
    
    const post = await createMoltbookPost(
        'petpad',
        `🐾 Launching ${tokenDetails.symbol}`,
        clankerPost
    );
    
    const clawnchResponse = await axios.post(
        'https://clawn.ch/api/launch',
        { moltbook_key: MOLTBOOK_API_KEY, post_id: post.id },
        { headers: { 'Content-Type': 'application/json' }}
    );
    
    return {
        success: true,
        contractAddress: clawnchResponse.data.token_address,
        txHash: clawnchResponse.data.tx_hash,
        clankerUrl: clawnchResponse.data.clanker_url,
        postId: post.id,
        postUrl: `https://www.moltbook.com/post/${post.id}`
    };
}

// ===== MAIN SCANNER =====
async function scanForPetPadPosts() {
    log('info', 'Starting scan', { scanNumber: ++scanCount });
    
    try {
        const posts = await getMoltbookPosts('petpad', 50);
        log('info', `Fetched ${posts.length} posts`);
        
        for (const post of posts) {
            if (processedPosts.has(post.id)) continue;
            
            const tokenDetails = parseTokenDetails(post.content);
            if (!tokenDetails) {
                processedPosts.add(post.id);
                continue;
            }
            
            if (launchedTokens.has(tokenDetails.symbol)) {
                log('warn', 'Symbol already exists', { symbol: tokenDetails.symbol });
                processedPosts.add(post.id);
                continue;
            }
            
            log('info', '🐾 Valid !petpad detected!', {
                author: post.author.name,
                symbol: tokenDetails.symbol
            });
            
            try {
                const pixelArt = generatePixelArt(tokenDetails.petType);
                const imageUrl = await uploadImage(pixelArt, tokenDetails.symbol);
                log('info', 'Image uploaded', { url: imageUrl });
                
                const deployment = await deployTokenViaClanker(tokenDetails, imageUrl);
                
                launchedTokens.set(tokenDetails.symbol, {
                    ...tokenDetails,
                    imageUrl,
                    contractAddress: deployment.contractAddress,
                    txHash: deployment.txHash,
                    clankerUrl: deployment.clankerUrl,
                    moltbookPostId: post.id,
                    moltbookPostUrl: deployment.postUrl,
                    agentName: post.author.name,
                    launchedAt: new Date().toISOString()
                });
                
                log('info', '🎉 TOKEN LAUNCHED!', {
                    symbol: tokenDetails.symbol,
                    contract: deployment.contractAddress,
                    agent: post.author.name
                });
                
            } catch (error) {
                log('error', 'Launch failed', {
                    symbol: tokenDetails.symbol,
                    error: error.message
                });
            }
            
            processedPosts.add(post.id);
            await sleep(5000);
        }
        
        lastScanTime = new Date().toISOString();
        log('info', 'Scan complete', { tokensLaunched: launchedTokens.size });
        
    } catch (error) {
        log('error', 'Scan error', { error: error.message });
    }
}

// ===== EXPRESS API =====
const app = express();
app.use(cors());
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/', (req, res) => {
    res.json({
        service: 'PetPad Launchpad',
        status: 'running',
        uptime: process.uptime(),
        tokensLaunched: launchedTokens.size,
        lastScan: lastScanTime,
        uploadMethod: IMAGE_UPLOAD_METHOD
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        uptime: process.uptime(),
        lastScan: lastScanTime,
        tokensLaunched: launchedTokens.size,
        uploadMethod: IMAGE_UPLOAD_METHOD,
        scanCount
    });
});

app.get('/api/tokens', async (req, res) => {
    try {
        const tokens = Array.from(launchedTokens.values()).map(token => ({
            name: token.name,
            symbol: token.symbol,
            description: token.description,
            petType: token.petType,
            contractAddress: token.contractAddress,
            imageUrl: token.imageUrl,
            chartUrl: `https://dexscreener.com/base/${token.contractAddress}`,
            tradeUrl: `https://app.uniswap.org/swap?outputCurrency=${token.contractAddress}&chain=base`,
            clankerUrl: token.clankerUrl,
            launchedAt: token.launchedAt
        }));
        res.json({ success: true, tokens });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/launches', async (req, res) => {
    try {
        const { limit = 50, offset = 0, agent, petType } = req.query;
        let launches = Array.from(launchedTokens.values());
        
        if (agent) launches = launches.filter(l => l.agentName === agent);
        if (petType) launches = launches.filter(l => l.petType === petType);
        
        launches.sort((a, b) => new Date(b.launchedAt) - new Date(a.launchedAt));
        
        const total = launches.length;
        const paginatedLaunches = launches.slice(parseInt(offset), parseInt(offset) + parseInt(limit));
        
        res.json({
            success: true,
            launches: paginatedLaunches,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total,
                hasMore: parseInt(offset) + parseInt(limit) < total
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.get('/api/stats', async (req, res) => {
    try {
        const tokens = Array.from(launchedTokens.values());
        const petTypeCounts = tokens.reduce((acc, token) => {
            acc[token.petType] = (acc[token.petType] || 0) + 1;
            return acc;
        }, {});
        
        res.json({
            success: true,
            totalLaunches: tokens.length,
            petTypeCounts,
            lastScan: lastScanTime,
            uploadMethod: IMAGE_UPLOAD_METHOD
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// ===== START SERVER =====
app.listen(PORT, () => {
    log('info', '🐾 PetPad API running', { port: PORT });
});

// ===== START SCANNER =====
if (!MOLTBOOK_API_KEY) {
    log('error', 'MOLTBOOK_API_KEY not set! Service will not work.');
} else {
    scanForPetPadPosts();
    cron.schedule('* * * * *', scanForPetPadPosts);
    log('info', '🤖 Scanner started', { 
        uploadMethod: IMAGE_UPLOAD_METHOD,
        interval: '1 minute' 
    });
}
