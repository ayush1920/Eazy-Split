# Getting Started with Eazy Split

This guide will help you set up and run Eazy Split locally for development.

## Prerequisites

- **Node.js**: v18 or higher ([download](https://nodejs.org/))
- **npm**: v9 or higher (comes with Node.js)
- **Git**: For cloning the repository
- **Google Gemini API Key**: Required for OCR functionality ([get key](https://makersuite.google.com/app/apikey))

## Project Structure

```
Eazy_split/
├── client/          # React PWA frontend
├── server/          # Express API backend (optional)
├── docs/            # System documentation
└── ../pwa_receipt_splitter_technical_plan_api_spec.md
```

## Quick Start

### Option 1: Client Only (Manual Entry)

If you only want to use manual receipt entry without OCR:

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Option 2: Full Stack (Client + Server with OCR)

For the complete experience with AI-powered OCR:

**Terminal 1 - Start Server:**
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create .env file
echo "GEMINI_API_KEY=your_api_key_here" > .env

# Start development server
npm run dev
```

Server will run on `http://localhost:3000`

**Terminal 2 - Start Client:**
```bash
# Navigate to client directory
cd client

# Install dependencies (if not done already)
npm install

# Start development server
npm run dev
```

Client will run on `http://localhost:5173`

## Detailed Setup

### Client Setup

1. **Install Dependencies**
   ```bash
   cd client
   npm install
   ```

2. **Available Scripts**
   - `npm run dev` - Start Vite dev server with hot reload
   - `npm run build` - Build for production
   - `npm run preview` - Preview production build
   - `npm run lint` - Run ESLint

3. **Environment Variables** (Optional)
   
   Create `client/.env` if you need custom configuration:
   ```env
   VITE_API_URL=http://localhost:3000
   ```

4. **Development**
   
   The client runs on `http://localhost:5173` by default. Changes to source files trigger hot module replacement (HMR).

### Server Setup

1. **Install Dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Configure Environment Variables**
   
   Create `server/.env`:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   PORT=3000
   ```

   > [!IMPORTANT]
   > Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

3. **Available Scripts**
   - `npm run dev` - Start with nodemon (auto-restart on changes)
   - `npm run build` - Compile TypeScript to JavaScript
   - `npm start` - Run compiled JavaScript (production)

4. **Verify Server**
   
   Test the server is running:
   ```bash
   curl http://localhost:3000/
   # Expected: "Receipt Splitter API is running"
   
   curl http://localhost:3000/api/ocr/health
   # Expected: "OCR Service Running"
   ```

## Testing the Application

### Manual Testing (Client Only)

1. Open `http://localhost:5173` in your browser
2. Click **"Add People"** and add at least 2 people
3. Click **"+ Add Receipt"** 
4. Enter platform (e.g., "Eazy") and date
5. Manually add items with names and prices
6. Assign items to people using checkboxes
7. View live totals in the right panel
8. Click **"Copy as Text"** or **"Export Markdown"**

### OCR Testing (Full Stack)

1. Ensure both client and server are running
2. Open `http://localhost:5173`
3. Add people first
4. Click **"+ Add Receipt"**
5. Upload a receipt image (JPG, PNG)
6. Wait for OCR processing (2-5 seconds)
7. Review extracted items and make corrections if needed
8. Assign items to people
9. Export the split

### Sample Receipt Images

For testing, you can use:
- Screenshots from Eazy, Blinkit, Instamart, DMart apps
- Photos of physical receipts
- The included sample image: [../67DA995D-749D-4B39-A9C7-FE81C68525B9.jpeg](../67DA995D-749D-4B39-A9C7-FE81C68525B9.jpeg)

## Building for Production

### Client Production Build

```bash
cd client
npm run build
```

Output: `client/dist/` folder containing static files

**Deploy to**:
- Vercel: `vercel deploy`
- Netlify: `netlify deploy --prod`
- GitHub Pages: Copy `dist/` to `gh-pages` branch

### Server Production Build

```bash
cd server
npm run build
```

Output: `server/dist/` folder containing compiled JavaScript

**Deploy to**:
- Heroku: `git push heroku main`
- Railway: Connect GitHub repo
- AWS/Azure: Use Docker or direct Node.js deployment

## Troubleshooting

### Client Issues

**Port already in use**:
```bash
# Kill process on port 5173
npx kill-port 5173
```

**Build errors**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**TypeScript errors**:
```bash
# Rebuild TypeScript
npm run build
```

### Server Issues

**GEMINI_API_KEY not set**:
- Verify `.env` file exists in `server/` directory
- Check API key is valid at [Google AI Studio](https://makersuite.google.com/app/apikey)
- Restart server after adding `.env`

**Port 3000 already in use**:
```bash
# Change port in .env
echo "PORT=3001" >> .env

# Or kill process on port 3000
npx kill-port 3000
```

**SSL verification errors** (Corporate proxy):
- The server disables SSL verification by default
- If you see certificate errors, this is expected in corporate environments
- For production, remove `NODE_TLS_REJECT_UNAUTHORIZED = '0'` from [../server/src/index.ts](../server/src/index.ts#L2)

**OCR processing fails**:
- Check server logs for Gemini API errors
- Verify API key has sufficient quota
- Try with a different image (clear, well-lit receipt)

### Browser Issues

**IndexedDB not working**:
- Check browser console for errors
- Clear browser data and reload
- Ensure you're using a modern browser (Chrome 90+, Firefox 88+, Safari 14+)

**PWA not installing**:
- Ensure you're on HTTPS (or localhost)
- Check browser console for manifest errors
- Verify service worker is registered

## Development Tips

### Hot Reload

Both client and server support hot reload:
- **Client**: Vite HMR updates instantly
- **Server**: Nodemon restarts on file changes

### Browser DevTools

- **React DevTools**: Install extension for component inspection
- **IndexedDB Inspector**: Chrome DevTools → Application → IndexedDB
- **Network Tab**: Monitor API calls to server

### Code Style

The project uses:
- **ESLint**: Linting rules configured in `client/eslint.config.js`
- **TypeScript**: Strict mode enabled
- **Prettier**: (Optional) Add `.prettierrc` for formatting

Run linter:
```bash
cd client
npm run lint
```

## Next Steps

- Read [System Architecture](./architecture.md) to understand the design
- Explore [Client Documentation](../client/docs/index.md) for frontend details
- Review [Server Documentation](../server/docs/index.md) for backend details
- Check [Technical Plan](../pwa_receipt_splitter_technical_plan_api_spec.md) for full specification

## Getting Help

- **Issues**: Check existing documentation first
- **Code**: All source code is in `client/src/` and `server/src/`
- **Logs**: Check browser console and server terminal output
