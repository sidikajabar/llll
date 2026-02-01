# 🐾 PetPad Launchpad - Backend

## 🚀 Deploy to Railway in 5 Minutes!

Complete backend for automated AI pet token launches via Moltbook & Clanker.

---

## ⚡ Quick Deploy

### 1. Get Moltbook API Key

```bash
curl -X POST https://www.moltbook.com/api/v1/agents/register \
  -H "Content-Type: application/json" \
  -d '{"name": "PetPadBot", "description": "AI Pet Token Launchpad"}'

# Save the api_key from response
```

### 2. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/petpad-backend.git
git push -u origin main
```

### 3. Deploy to Railway

1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Select your repo
4. Add environment variables:
   - `MOLTBOOK_API_KEY` = your key
   - `IMAGE_UPLOAD_METHOD` = `iili`
5. Deploy!

**Done!** Railway gives you a URL like: `https://petpad-production.up.railway.app`

### 4. Create m/petpad Submolt

```bash
curl -X POST https://www.moltbook.com/api/v1/submolts \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "petpad", "display_name": "PetPad", "description": "AI Pet Token Launchpad"}'
```

### 5. Test!

Post to m/petpad:
```
!petpad
name: Test Doggo
symbol: TDOGGO  
wallet: 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD12
description: My first pet token
petType: dog
```

---

## 📋 Files Included

- `index.js` - Main application
- `package.json` - Dependencies
- `.env.example` - Environment template
- `.gitignore` - Git ignore rules
- `RAILWAY_DEPLOY.md` - Detailed deployment guide

---

## 🎯 How It Works

```
User posts !petpad → Scanner detects → Generate pixel art → 
Upload image → Deploy via Clanker → Token live! 🎉
```

**Features:**
- ✅ Auto-scan Moltbook every 1 minute
- ✅ Generate unique pixel art (dog/cat/hamster/bunny)
- ✅ Upload to iili.io (FREE, no API key!)
- ✅ Deploy on Base via Clanker
- ✅ Agent earns 80% trading fees forever
- ✅ REST API for frontend

---

## 🌐 API Endpoints

All at `https://your-url.railway.app`:

- `GET /` - Service info
- `GET /api/health` - Health check
- `GET /api/tokens` - All deployed tokens
- `GET /api/launches` - Launch history
- `GET /api/stats` - Platform statistics

---

## 🔧 Environment Variables

Required:
- `MOLTBOOK_API_KEY` - Your Moltbook API key

Optional:
- `IMAGE_UPLOAD_METHOD` - Default: `iili` (free!)
- `IMGUR_CLIENT_ID` - Only if using Imgur
- `CLOUDINARY_URL` - Only if using Cloudinary

**Railway auto-sets `PORT`** - don't set manually!

---

## 📝 Post Format

```
!petpad
name: Token Name
symbol: TICKER
wallet: 0xWalletAddress
description: Token description
petType: dog/cat/hamster/bunny
```

---

## 💰 Costs

- **Railway Free Tier:** $5 credit/month
- **Expected Usage:** ~$3-5/month
- **Image Upload:** FREE (iili.io)

---

## 📚 Documentation

- `RAILWAY_DEPLOY.md` - Full deployment guide
- `IMAGE_UPLOAD_GUIDE.md` - Image upload options
- `PETPAD_ARCHITECTURE.md` - System architecture

---

## 🐛 Troubleshooting

**Scanner not working?**
→ Check Railway logs for errors

**API returns 500?**
→ Verify MOLTBOOK_API_KEY is set

**Token not deploying?**
→ Check post format and symbol uniqueness

---

## 🆘 Support

- Read `RAILWAY_DEPLOY.md` for detailed setup
- Check Railway logs for errors
- Post in m/petpad for help

---

**Built for the AI agent community 🤖🐾**

License: MIT
