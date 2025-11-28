# 🚀 Deployment Guide - Ontario LTC Home Comparison

## Quick Deploy with Vercel (Recommended)

### Prerequisites
- GitHub account
- Vercel account (free at https://vercel.com)

### Steps:

1. **Install Vercel CLI** (optional, or use web dashboard)
   ```bash
   npm install -g vercel
   ```

2. **Initialize Git Repository** (if not already done)
   ```bash
   cd /Users/david.mori/Desktop/Bach
   git init
   git add .
   git commit -m "Initial commit - Ontario LTC App"
   ```

3. **Create GitHub Repository**
   - Go to https://github.com/new
   - Create a new repository (e.g., "ontario-ltc-comparison")
   - Push your code:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/ontario-ltc-comparison.git
   git branch -M main
   git push -u origin main
   ```

4. **Deploy to Vercel**
   
   **Option A: Using Vercel Dashboard (Easier)**
   - Go to https://vercel.com
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel auto-detects settings
   - Click "Deploy"
   - Done! Your app will be live at `your-project.vercel.app`

   **Option B: Using CLI**
   ```bash
   vercel
   # Follow prompts, it will deploy automatically
   ```

---

## Alternative: Deploy to Render.com

Render is great for full-stack Node.js apps with persistent servers.

### Steps:

1. **Create Render Account** at https://render.com

2. **Create New Web Service**
   - Connect your GitHub repository
   - Configure:
     - **Build Command:** `npm install && npm run build`
     - **Start Command:** `node server/index.js`
     - **Environment:** Node
   
3. **Set Environment Variables** (if needed)
   - Add any API keys or configs

4. **Deploy**
   - Render will build and deploy automatically
   - Your app will be live at `your-app.onrender.com`

---

## Alternative: Netlify

Good for static sites + serverless functions.

### Steps:

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Build Your App**
   ```bash
   npm run build
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod
   ```

---

## Alternative: VPS (DigitalOcean, AWS, etc.)

For full control and custom domain.

### Steps:

1. **Get a VPS** (Ubuntu recommended)

2. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

3. **Upload Your Code**
   ```bash
   scp -r /Users/david.mori/Desktop/Bach user@your-server-ip:/var/www/ltc-app
   ```

4. **Install Dependencies & Build**
   ```bash
   cd /var/www/ltc-app
   npm install
   npm run build
   ```

5. **Use PM2 to Keep Server Running**
   ```bash
   sudo npm install -g pm2
   pm2 start server/index.js --name ltc-app
   pm2 startup
   pm2 save
   ```

6. **Configure Nginx** (reverse proxy)
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

7. **Setup SSL** (free with Let's Encrypt)
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

## 🔒 Security Considerations

Before deploying publicly:

1. **Environment Variables**
   - Move sensitive data to `.env` file
   - Never commit `.env` to Git
   - Add `.env` to `.gitignore`

2. **Rate Limiting**
   - Add rate limiting to API endpoints

3. **CORS Configuration**
   - Set proper CORS origins in production

---

## 📊 Post-Deployment

After deployment, your app will be accessible at:
- Vercel: `https://your-project.vercel.app`
- Render: `https://your-app.onrender.com`
- Netlify: `https://your-site.netlify.app`
- Custom domain: `https://your-domain.com`

**Share the URL with anyone!** 🎉

---

## 💡 Tips

- **Custom Domain**: All platforms support custom domains
- **Analytics**: Add Google Analytics to track usage
- **Updates**: Push to GitHub and platforms auto-redeploy
- **Free Tier**: Vercel, Render, and Netlify all have generous free tiers

