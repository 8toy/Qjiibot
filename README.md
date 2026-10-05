# Telegram Auto Reaction Bot V6

A multi-platform Telegram bot built around one codebase. It supports automatic reactions, group/channel settings, welcome messages, required-channel verification, private-channel join requests, broadcasts, MongoDB on Node hosts, and Cloudflare Workers + D1 + Queues.

## ✨ V6 changes

- `/groupsetting` is the central group/channel management entry point.
- Running `/groupsetting` inside a group connects that group to the admin's private settings panel.
- Private `/groupsetting` shows all connected groups/channels.
- Group + Channel selection is separated when both are connected.
- Settings are managed in the bot's private chat instead of filling the group with configuration messages.
- Text-edit/input modes temporarily hide the settings buttons and restore the panel after input is received.
- Welcome mode: **Only User** or **Group**.
- Welcome buttons support multiple rows and multiple buttons in the same row.
- Button management supports **Add**, **Delete One**, and **Delete All**.
- Required-channel gate for groups: users are muted until they join the configured channel and press **Check & Unmute**.
- The required channel is accepted only after the bot is verified as an admin there.
- Private-channel join-request users are stored for statistics and an optional broadcast audience.
- `/help` deletes the old welcome message and sends a fresh help message; Back edits that help message back to the welcome screen.
- The old Upload/Add UI is replaced with **Donation**.
- Commands such as `/groupsetting` and `/start` are never converted to Unicode small-caps.
- MongoDB adapter for Node/Vercel/Koyeb/Railway/Heroku/VPS/Docker.
- Cloudflare Workers uses D1 + Queues and does **not** bundle the MongoDB Node driver.

## 🚀 One-click deployment

> The repository used by the buttons below is `https://github.com/a-if/Reactions`. If you fork the project, replace the repository URL in the button/link with your fork.

### Cloudflare Workers — recommended free-tier path

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/a-if/Reactions)

Cloudflare's Deploy button can provision resources declared in `wrangler.toml`, including D1 and Queues. The Worker expects `BOT_TOKEN` as a secret/deployment value. `UPLOAD_URL` is **not required** in V6. Do not put your Telegram token in GitHub.

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fa-if%2FReactions&project-name=auto-reaction-bot)

Vercel uses the Node webhook entry point. Set `BOT_TOKEN`, `BOT_USERNAME`, `MONGODB_URL`, `MONGODB_DB`, and `ADMIN_IDS`. The Vercel deploy flow supports importing a repository through `repository-url`.

### Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://www.heroku.com/deploy?template=https://github.com/a-if/Reactions)

The repository includes `app.json` and `Procfile` for the Heroku Button flow.

### Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/a-if/Reactions)

The repository includes `render.yaml`. Render's Deploy Button can use the repository's Blueprint configuration.

### Railway

[Open Railway and deploy from GitHub](https://railway.com/new)

Choose **Deploy from GitHub repo**, select this repository, then add the environment variables below. Railway supports GitHub repositories as a service source.

### Koyeb

[Open Koyeb](https://app.koyeb.com/)

Choose **Create Web Service → GitHub**, select this repository, and use `npm start`. `koyeb.yaml` is included as the service configuration reference.

### VPS / Docker

```bash
git clone https://github.com/a-if/Reactions.git
cd Reactions
cp .env.example .env
# edit .env
npm install
npm start
```

Docker:

```bash
cp .env.example .env
# edit .env
docker compose up -d --build
```

## ☁️ Cloudflare Free architecture

Cloudflare deployment uses:

- Workers for webhook execution
- D1 for bot data/settings
- Queues for broadcast jobs
- Worker Secrets for `BOT_TOKEN`

The Node `mongodb` package is not used by the Worker runtime.

Cloudflare's Deploy-to-Workers flow reads the Wrangler configuration and can automatically provision supported resources such as D1 and Queues.

### Cloudflare variables

Required:

```text
BOT_TOKEN
BOT_USERNAME
```

Recommended:

```text
ADMIN_IDS=123456789,987654321
UPDATES_URL=https://t.me/YourUpdates
SUPPORT_URL=https://t.me/YourSupport
```

Optional:

```text
EMOJI_LIST=👍❤🔥🥰👏😁🎉🤩🙏👌🕊😍🐳❤‍🔥💯⚡🏆
RANDOM_LEVEL=0
RESTRICTED_CHATS=
START_ANIMATION=
DONATE_ANIMATION=
LOG_LEVEL=info
AUTO_SET_WEBHOOK=true
```

**Do not add a random `UPLOAD_URL`. V6 does not use it.**

After deployment, opening the Worker URL once lets the Worker automatically set the Telegram webhook to `/` when `AUTO_SET_WEBHOOK=true`.

## 🍃 MongoDB hosts

For Koyeb, Railway, Heroku, Render, Vercel, VPS and Docker, use MongoDB Atlas or another reachable MongoDB deployment.

```env
BOT_TOKEN=
BOT_USERNAME=ReactionsXBot
MONGODB_URL=mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=reaction-bot
ADMIN_IDS=
UPDATES_URL=https://t.me/PythonBotz
SUPPORT_URL=
AUTO_SET_WEBHOOK=true
WEBHOOK_URL=https://your-public-host.example.com/
```

For platforms that provide a stable public URL, `WEBHOOK_URL` is recommended. If the platform provides the URL only after deployment, add it in environment variables and redeploy/restart.

## 🤖 Commands

### Users

```text
/start
/help
/reactions
/donate
```

### Group admins

```text
/groupsetting
/welcome
/reactions_on
/reactions_off
```

`/groupsetting` is the recommended central dashboard. The older shortcuts remain for compatibility where applicable.

### Channel admins

```text
/joinsetting
```

For a private channel, forward a channel post to the bot and use `/groupsetting` or `/joinsetting` in the private chat.

### Bot owner/admin

```text
/stats
/users
/broadcast
```

## 👋 Welcome system

From the private group settings panel:

- Enable / Disable
- Message editor
- Only User / Group mode
- Button editor
- Preview
- Add buttons
- Delete one button
- Delete all buttons

Template variables:

```text
{name}
{username}
{mention}
{group}
```

### Multiple buttons per row

When adding buttons, use:

```text
Button 1 | https://example.com/1 | primary | 1
Button 2 | https://example.com/2 | success | 1
Button 3 | https://example.com/3 | primary | 2
```

Result:

```text
[ Button 1 ] [ Button 2 ]
[ Button 3 ]
```

Styles supported by the current Telegram Bot API implementation:

```text
primary
success
danger
```

## 🔐 Required channel for groups

An admin can configure a required channel from:

`/groupsetting → Require Channel`

The bot verifies that it is an admin in the configured channel before saving it.

When a new member joins the group:

1. Bot checks channel membership.
2. If the user has joined, normal group access continues.
3. If not, the bot attempts to mute the user.
4. The user receives a join button and **Check & Unmute** button.
5. After joining the channel, the user presses **Check & Unmute**.
6. Bot checks membership again and restores normal permissions.

The bot needs administrator permission to restrict members in the group and administrator access in the required channel to verify membership reliably.

## 📢 Private channel join requests

Channel settings support:

- Enable / Disable
- Notify Only
- Auto Accept
- Custom message
- Custom buttons
- Preview
- Separate statistics for channel-request users

Join-request users are stored in the database so they can be counted and, where Telegram permits messaging, used as a broadcast audience.

## 📣 Broadcast

Reply to a message and use:

```text
/broadcast
```

The flow is:

```text
Copy / Forward
       ↓
Pin / Without Pin
       ↓
Broadcast
```

Node hosts use the local broadcast runner. Cloudflare uses Queues to keep each invocation small.

## 🗄️ Database model

### Cloudflare

```text
D1
├── chats
├── chat_settings
├── pending_settings
├── connections
└── channel_request_users
```

### MongoDB

```text
chats
chat_settings
pending_settings
connections
channel_request_users
```

## 🔒 Security

Never commit:

```text
BOT_TOKEN
MONGODB_URL
```

If a BotFather token is exposed, revoke it immediately and create a new token.

## 🩺 Health check

All Node deployments expose:

```text
GET /health
```

Cloudflare exposes the same health endpoint.

## 🧪 Local testing

```bash
cp .env.example .env
npm install
npm run build
npm start
```

Health check:

```text
http://localhost:3000/health
```

For local Telegram webhook testing, use an HTTPS tunnel such as Cloudflare Tunnel or another trusted HTTPS tunnel and set `WEBHOOK_URL` to that public URL.

## ⚠️ Important platform notes

- Cloudflare Workers is the preferred low-cost/serverless deployment for this architecture.
- MongoDB is intended for Node-compatible deployments; it is not bundled into the Worker path.
- Vercel is used as a webhook/serverless adapter, not as a permanent background process.
- Render free web services can spin down after inactivity, so webhook cold-start latency can occur.
- Railway, Koyeb, Heroku and VPS resource limits/pricing depend on the current plan selected.

## License

See `LICENSE`.
