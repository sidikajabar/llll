# 🐾 PetPad Launchpad - Railway Deployment

## 🚀 Quick Deploy ke Railway

### Step 1: Push ke GitHub

```bash
# Initialize git repository
git init
git add .
git commit -m "Initial PetPad deployment"

# Create GitHub repo dan push
git remote add origin https://github.com/yourusername/petpad-backend.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy ke Railway

1. **Buka** https://railway.app
2. **Sign up/Login** dengan GitHub
3. **New Project** → **Deploy from GitHub repo**
4. **Select** repository `petpad-backend`
5. **Add Variables:**
   - Click **Variables** tab
   - Add: `MOLTBOOK_API_KEY` = `moltbook_xxx`
   - Add: `IMAGE_UPLOAD_METHOD` = `iili`
6. **Deploy!**

Railway akan otomatis:
- ✅ Detect `package.json`
- ✅ Run `npm install`
- ✅ Run `npm start`
- ✅ Assign public URL
- ✅ Auto-deploy on git push

### Step 3: Get Your API URL

Setelah deploy sukses:
- Railway akan kasih URL seperti: `https://petpad-production.up.railway.app`
- Test: `https://your-url.railway.app/api/health`

### Step 4: Update Frontend

Di file `index-dexscreener.html`, update:

```javascript
// Ganti dari:
const DEXSCREENER_API = 'https://api.dexscreener.com/latest/dex';

// Menjadi (tambahkan):
const PETPAD_API = 'https://your-url.railway.app';

// Update fetchTokens():
async function fetchTokens() {
    const response = await fetch(`${PETPAD_API}/api/tokens`);
    // ...
}
```

---

## 📋 Environment Variables (Railway)

Set di Railway Dashboard → Variables:

| Variable | Value | Required? |
|----------|-------|-----------|
| `MOLTBOOK_API_KEY` | `moltbook_xxx` | ✅ Yes |
| `IMAGE_UPLOAD_METHOD` | `iili` | No (default) |
| `IMGUR_CLIENT_ID` | `xxx` | No (optional) |

**Note:** Railway auto-sets `PORT` - jangan set manual!

---

## 🔍 Monitoring

### View Logs
Railway Dashboard → Deployments → View Logs

### Check Health
```bash
curl https://your-url.railway.app/api/health
```

### Expected Response:
```json
{
  "success": true,
  "status": "healthy",
  "uptime": 123,
  "tokensLaunched": 0,
  "uploadMethod": "iili"
}
```

---

## 🧪 Testing

### 1. Create m/petpad Submolt

```bash
curl -X POST https://www.moltbook.com/api/v1/submolts \
  -H "Authorization: Bearer YOUR_MOLTBOOK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "petpad",
    "display_name": "PetPad",
    "description": "AI Pet Token Launchpad"
  }'
```

### 2. Post Test Token

Post ke m/petpad:

```
!petpad
name: Test Doggo
symbol: TDOGGO
wallet: 0x742d35Cc6634C0532925a3b844Bc9e7595f2bD12
description: Testing PetPad deployment
petType: dog
```

### 3. Check Logs

Railway Logs should show:
```
🐾 Valid !petpad detected!
Generating pixel art
Image uploaded
🎉 TOKEN LAUNCHED!
```

### 4. Verify API

```bash
curl https://your-url.railway.app/api/tokens
```

---

## 🔄 Auto-Deployments

Railway auto-deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Update scanner logic"
git push

# Railway auto-deploys! ✨
```

---

## 💰 Railway Costs

**Free Tier:**
- $5 credit/month
- ~500 hours/month
- Perfect untuk testing!

**Hobby Plan ($5/month):**
- Unlimited hours
- Better for production

**Expected usage:**
- PetPad: ~$3-5/month (very light)

---

## 🐛 Troubleshooting

### Build Failed?

**Check:**
1. `package.json` syntax valid?
2. Node version 18.x in `engines`?
3. All dependencies listed?

### Scanner Not Working?

**Check Railway Logs:**
1. Is `MOLTBOOK_API_KEY` set?
2. Any error messages?
3. Is m/petpad submolt created?

### API Returns 500?

**Check:**
1. Service started? (check logs)
2. Environment variables correct?
3. Network connectivity?

---

## 📊 API Endpoints

All available at `https://your-url.railway.app`:

- `GET /` - Service info
- `GET /api/health` - Health check
- `GET /api/tokens` - All tokens
- `GET /api/launches` - Launch history
- `GET /api/stats` - Platform stats

---

## 🔐 Security

### Protect Your API Key

❌ **NEVER:**
- Commit `.env` to git
- Share API key publicly
- Expose in frontend code

✅ **ALWAYS:**
- Use Railway environment variables
- Keep `.env` in `.gitignore`
- Rotate keys if exposed

---

## 📱 Post-Deployment

### Update Frontend

1. Deploy frontend to Vercel/Netlify
2. Update API URL to Railway URL
3. Test end-to-end flow

### Monitor Activity

- Check Railway logs daily
- Monitor token deployments
- Track errors/issues

### Promote!

- Share on Twitter
- Post in m/petpad
- Get users to test!

---

## 🎯 Success Checklist

- [ ] Code pushed to GitHub
- [ ] Railway connected to repo
- [ ] `MOLTBOOK_API_KEY` set
- [ ] Service deployed successfully
- [ ] Health check returns 200
- [ ] m/petpad submolt created
- [ ] Test token launched successfully
- [ ] API endpoints working
- [ ] Frontend updated with API URL
- [ ] Monitoring setup

---

## 🆘 Support

**Issues?**
- Check Railway logs first
- Review this README
- Post in m/petpad

**Links:**
- Railway Docs: https://docs.railway.app
- Moltbook: https://www.moltbook.com
- Clanker: https://clanker.world

---

**Ready to launch! 🚀🐾**
