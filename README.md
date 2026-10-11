# UC Bar Infotech – Website, Admin Panel & AI Assistant

A complete rebuild of the website:

| Part | Tech |
|---|---|
| Public website | **React** (Vite, React Router), hand-written responsive CSS, SEO tags injected server-side, `sitemap.xml`, `robots.txt` |
| Backend / API | **Node.js + Express** |
| Database | **Postgres** in production (Render / Neon / Supabase / Vercel Postgres) · a local JSON file for development |
| Admin panel | React, at **`/admin`** – products, categories, events, software, updates, support, FAQs, industries, logos, offices, enquiries, settings |
| Customer chat | **AI assistant** – choose **OpenAI (ChatGPT models), DeepSeek, Claude, Google Gemini, Groq, Mistral, OpenRouter** or any OpenAI-compatible server; answers from *your* catalogue + **WhatsApp** button + "Request a callback" form |

Everything the admin edits is live on the website immediately (no publish step, no redeploy).
All content from your old site (37 products, support cards, software showcase, events, offices, contact details) is pre-loaded.

---

## 1. Run it on your computer

```bash
npm install
cp .env.example .env        # optional for local use
npm run dev                 # site → http://localhost:5173   (API on :3000)
```
Open **http://localhost:5173/admin**. On first start an admin account is created; if you didn't set `ADMIN_PASS`, a random password is printed in the terminal.

Production-style run: `npm run build && npm start` → http://localhost:3000

## 2. Deploy

### Render.com (recommended – one service, simplest)
1. Push this folder to GitHub.
2. Render → **New → Blueprint** → pick the repo (it reads `render.yaml`: a web service + a Postgres database).
3. When asked, set **`ADMIN_PASS`** (your admin password) and optionally **`ANTHROPIC_API_KEY`**.
4. Deploy. Open `https://<your-app>.onrender.com` and `/admin`.
5. Add your domain under *Settings → Custom Domains* and set `SITE_URL` to it.

> Render's free web service sleeps after inactivity (first visit takes ~30 s) and free Postgres has time limits – check Render's current free-tier terms, or use a paid plan / a free Neon or Supabase Postgres and paste its connection string into `DATABASE_URL`.

### Vercel
1. Create a free Postgres (Neon / Supabase / Vercel Postgres) and copy its connection string.
2. Import the repo in Vercel. Framework preset: **Other** (`vercel.json` is included).
3. Add environment variables: `DATABASE_URL`, `ADMIN_PASS`, `SESSION_SECRET` (any long random text), optional `ANTHROPIC_API_KEY`, `SITE_URL`.
4. Deploy. Note: Vercel limits request bodies to ~4.5 MB, so keep admin image uploads under 4 MB there.

### Environment variables
| Variable | Needed | Purpose |
|---|---|---|
| `DATABASE_URL` | **yes (production)** | Postgres connection string. Without it data is stored in a local file that is **wiped on redeploy** on Render/Vercel (the admin dashboard warns you). |
| `ADMIN_USER` / `ADMIN_PASS` | yes | Your admin login. Applied on first start **and again whenever you change either value and restart** (a password you later change inside the admin panel is kept until these values change again). If `ADMIN_PASS` is empty a random one is printed once in the logs. Min. 10 characters recommended. |
| `SESSION_SECRET` | yes | Signs the login cookie. |
| `OPENAI_API_KEY`, `DEEPSEEK_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `MISTRAL_API_KEY`, `OPENROUTER_API_KEY` | optional | Set **any one or several** to turn on full AI answers (see section 3 → AI assistant). Without a key the chat answers by searching your products/FAQs. |
| `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL` | optional | Any OpenAI-compatible server (Azure OpenAI, Ollama, vLLM, LM Studio…). |
| `CHAT_PROVIDER`, `CHAT_MODEL` | optional | Force a provider / model from the environment (otherwise choose in Admin → Settings). Per-provider model overrides: `OPENAI_MODEL`, `DEEPSEEK_MODEL`, … |
| `CHAT_DAILY_LIMIT` | optional | Max AI replies per day across all visitors (default 500) – a cost safety net. |
| `LEAD_WEBHOOK_URL` | optional | Every new enquiry is POSTed here as JSON – connect Slack / Zapier / Make / n8n to get instant email or WhatsApp alerts. |
| `SITE_URL` | optional | Public address, used in `sitemap.xml`. |

### Can't log in?
* **Fastest fix – reset it directly:** run `npm run reset-admin` (it asks for a username and new password), or `npm run reset-admin -- admin 'New-Pass-123'`. It works on both the local file database and Postgres (set `DATABASE_URL` first, or put it in `.env`). Restart the site afterwards to clear any "too many attempts" lockout.
* On Render/Vercel (no shell): set `ADMIN_USER` + `ADMIN_PASS` in the environment and **redeploy** – changed values are applied at start-up.
* Check the **Logs** (Render) / terminal for `[setup] Admin login created/updated from ADMIN_USER/ADMIN_PASS → username: …` – that confirms which username is active.
* Changed the variable? **Restart/redeploy** – it's applied at start-up.
* **Passwords containing `$`** (e.g. `Alpha$2345`): in a terminal, wrap them in **single quotes** – `ADMIN_PASS='Alpha$2345' npm run dev` – otherwise the shell turns `$2345` into nothing and the password becomes `Alpha`. In a `.env` file, or in Render/Vercel's environment-variable page, type the password exactly as it is (no quotes needed).
* Username/password are case-sensitive for the password (the username is not).

## 3. Using the admin (`/admin`)
* **Enquiries** – every quote request, product enquiry and chat callback lands here (with the chat transcript). Set status New / Contacted / Closed and add notes.
* **Categories & Products** – add/edit/hide/reorder. Pick a category when adding a product; images upload straight from the form. Tick *Feature on home page* for the "Best selling" strip. A new category appears in the Products menu automatically.
* **Events, Software, Updates, Support, FAQs, Industries, Clients & Certificates, Offices** – same simple list + form. *Software & Support Updates* supports a version number and a downloadable file.
* **Settings** – hero text, **hero picture (animated label-printing machine ↔ static image)**, phones, e-mail, **WhatsApp number**, About text, footer, SEO title/description, and the **chat assistant** (on/off, name, welcome message, extra knowledge).

### WhatsApp
Set your number in *Settings → Contact → WhatsApp number* (digits with country code, e.g. `919891060187`). A green WhatsApp button appears on every page, product pages have a "WhatsApp us" button with the product name pre-filled, and the chat can hand the visitor over to WhatsApp. *(I used the WhatsApp number listed on your old Contact page – please confirm it's the right one.)*

### AI assistant (OpenAI / ChatGPT, DeepSeek, Claude, Gemini and more)
1. **Get an API key** from the provider you prefer and add it to your host's environment variables (Render → *Environment*, Vercel → *Settings → Environment Variables*):

   | Provider | Variable | Default model* |
   |---|---|---|
   | OpenAI (ChatGPT models) | `OPENAI_API_KEY` | `gpt-4o-mini` |
   | DeepSeek | `DEEPSEEK_API_KEY` | `deepseek-v4-flash` |
   | Claude (Anthropic) | `ANTHROPIC_API_KEY` | `claude-haiku-4-5-20251001` |
   | Google Gemini | `GEMINI_API_KEY` | `gemini-flash-latest` |
   | Groq / Mistral / OpenRouter | `GROQ_API_KEY` / `MISTRAL_API_KEY` / `OPENROUTER_API_KEY` | see `server/providers.js` |
   | Anything OpenAI-compatible | `AI_BASE_URL` + `AI_API_KEY` + `AI_MODEL` | – |

   \*Model names change often (e.g. DeepSeek retired `deepseek-chat`). If you get an error, put the current model name in **Admin → Settings → AI model** – the defaults above are only starting points.
2. **Pick the provider** in *Admin → Settings → Chat assistant* (or leave on *Automatic*), then press **Send test message** at the bottom of that page. It tells you in plain words whether the key/model works (keys are masked in errors).
3. **Failover:** if the chosen provider errors or times out, the assistant automatically tries one other provider that has a key, and if all fail the visitor still gets a catalogue-search answer – the chat never shows an error page.

How it behaves:
* On every request it is given your live catalogue, FAQs, offices, software list, About text and the **"Extra instructions & knowledge"** you write in Settings (delivery areas, warranty, business hours…).
* It is instructed to answer only from that information, never invent prices/stock, treat visitor text as untrusted, and steer to a callback/WhatsApp for quotes.
* Protections: 25 messages / 10 min per visitor, 1000-character messages, last 12 turns only, daily cap, API keys only in environment variables (never in the database or the browser).
* Visitors can tap **Request a callback** inside the chat; that creates an enquiry with the conversation attached.
* **Privacy/cost:** visitor messages and your catalogue text are sent to the chosen provider and billed to your account there. Pick a provider whose data policy and hosting region suit you. Prefer fast, non-reasoning chat models (reasoning models are slower and costlier).

### The sliding banner (products & work)
The top of the home page is a cinematic slider: big animated headline, a floating product on an accent-coloured stage, a row of preview cards, counter, arrows and a progress bar that drives the autoplay (7 s per slide, 9.5 s for the machine). It pauses on hover / keyboard focus / touch and with the ⏸ button, supports swipe on phones and the ← → keys, and is fully still for visitors who enabled *reduce motion*.
* **Manage it in Admin → Banner Slides** – add, hide, delete and re-order (↑ ↓). Each slide has a type, small heading, title, description, picture, accent colour and a button.
  * *Product / work picture* – floats on the stage. Use a transparent PNG/WebP, **or upload any normal white-background photo and press "✂ Remove white background"** (done in your browser, also trims the empty margins).
  * *Full-width photo background* – e.g. an event photo (slow zoom effect).
  * *Animated label-printing machine* – the animated Flexomaster slide.
* Shipped with 8 slides: the machine, barcode scanners, barcode printers, ID card printers, mobile terminals, thermal transfer ribbons, your software work (client screenshots) and the Manipur expo. Edit or replace any of them.
* **Admin → Settings → Hero picture** can switch the whole banner back to a single static picture.
* **Existing installs:** on first start after updating, the slides are added to your database once (the old "machine only" hero setting is converted); nothing you edited is overwritten.

### The animated hero machine (first slide)
The first slide shows a label-printing machine cut out of the brochure photo and animated: label stock feeds through, is printed as it passes the CMYK print line, the ink-station lights pulse in sequence, and the rewind roll spins; it "prints in" from left to right on load. It is pure SVG + CSS (≈57 KB image, no video, no library), pauses completely for visitors who enabled *reduce motion*, and can be switched off in *Admin → Settings → Hero picture*.
Files: `client/src/components/HeroMachine.jsx` and `MachineryService.jsx` (animation + anchor coordinates), `client/public/images/hero/flexomaster.webp`, styles at the bottom of `client/src/styles.css`. The source photo is only 500 px wide, so a higher-resolution photo from the manufacturer would look sharper (the animation anchors would need re-aligning to a different photo).

### Label printing machine & printing service
* **Banner caption** (under the animated machine) and the **"Label printing — machinery & service"** section on the home page show your *Auto Sticker Label Printing Machinery* specification and the *"we also take orders for printing barcode labels"* service, each with an enquiry pop-up and WhatsApp button. Enquiries arrive in **Admin → Enquiries** tagged with what the visitor asked about.
* Edit every word in **Admin → Settings → Label printing machine & service** (machine name, caption, specification – one point per line, service heading and text). Clear the machine name and service heading to hide the section.
* The machine is also a normal product in **Products → Label Printing Machinery** (with *Get quote*), and the AI assistant and FAQs know about the printing service.
* **Existing installs:** on first start after updating, the server adds this content to your current database once (see `server/patches.js`). It only *adds* what's missing – it never overwrites your edits and never re-adds something you deleted.

## 4. Project layout
```
server/   index.js (API + admin API + serving the site) · store.js (file/Postgres) · schema.js (all admin sections) · chat.js · seed.json
client/   src/pages (public pages) · src/components · src/admin (admin UI, generated from the schema) · public/images
api/      Vercel entry     render.yaml / vercel.json   deployment configs
```
* **Add a field/section to the admin:** edit `server/schema.js` – forms and lists update automatically (then show it in a page under `client/src/pages`).
* **Change the look:** `client/src/styles.css` (colours are CSS variables at the top).

## 5. Security notes
bcrypt passwords · signed HTTP-only cookie (SameSite, Secure in production) · every admin write requires a custom header (blocks cross-site requests) · login lockout (5 tries → 15 min) · upload type/size limits (images + documents only, SVG/HTML rejected) · React escapes all content · public forms have a honeypot + rate limit · private settings (chat instructions) are never sent to the public site.

## 6. Good to know
* Uploaded files are stored in the database so they survive redeploys (8 MB limit; use Cloudinary/S3 later if you upload a lot).
* The site is a React single-page app; titles/descriptions are injected per request for search engines and link previews. Products open in a pop-up rather than separate pages.
* Rebuilding (`npm run build`) requires a server restart – hosts do this on every deploy.
