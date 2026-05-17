# XFilter — Image-Only Feed Filter

> A lightweight browser extension that hides text-only tweets from users you choose. Their photos stay. Their text disappears.

![Brave](https://img.shields.io/badge/Brave-supported-orange?logo=brave)
![Chrome](https://img.shields.io/badge/Chrome-supported-yellow?logo=googlechrome)
![Edge](https://img.shields.io/badge/Edge-supported-blue?logo=microsoftedge)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green)
![No backend](https://img.shields.io/badge/no%20backend-local%20only-lightgrey)

---

## What it does

You follow someone for their photography, their memes, or their design work — not their takes. XFilter lets you add any Twitter/X user to a filter list. From that point on, only their tweets containing images appear on your feed. Text-only tweets from those users are silently hidden.

Everyone else on your feed is completely unaffected.

---

## Features

- **Per-user control** — filter specific accounts, leave everyone else alone
- **Real-time filtering** — works as you scroll; new tweets are filtered as they load
- **Persistent settings** — your list is saved and syncs across devices via browser storage
- **Zero latency** — runs entirely in your browser, no API calls, no servers
- **Clean popup UI** — add and remove users in seconds

---

## Installation

XFilter is not on the Chrome Web Store. Install it manually in a few steps:

**1. Download the extension**

Clone this repository or download it as a ZIP and extract it:

```bash
git clone https://github.com/YOUR_USERNAME/xfilter.git
```

**2. Open your browser's extension page**

| Browser | Address |
|---------|---------|
| Brave   | `brave://extensions` |
| Chrome  | `chrome://extensions` |
| Edge    | `edge://extensions` |

**3. Enable Developer Mode**

Toggle **Developer Mode** on (top-right corner of the extensions page).

**4. Load the extension**

Click **"Load unpacked"** and select the `xfilter` folder.

**5. Pin it**

Click the puzzle icon in your toolbar and pin XFilter for easy access.

---

## Usage

1. Navigate to [twitter.com](https://twitter.com) or [x.com](https://x.com)
2. Click the XFilter icon in your toolbar
3. Type a username (with or without the `@`) and press **ADD** or hit Enter
4. Done — their text-only tweets are hidden immediately

To stop filtering someone, click the **✕** next to their name in the popup. To reset everything, use the **CLEAR ALL** button.

---

## How it works

XFilter is a Manifest V3 browser extension with two main parts:

**`content.js`** — injected into Twitter/X pages. Uses a `MutationObserver` to watch the feed for new tweets as they load. For each tweet from a filtered user, it checks for the presence of image elements (`[data-testid="tweetPhoto"]`, `pbs.twimg.com/media` sources, and card media). Tweets without images are set to `display: none`.

**`popup.js`** — manages the user list via `chrome.storage.sync`, which persists settings and optionally syncs them across devices. On every change, it sends a message to active Twitter/X tabs so the filter updates live without a page refresh.

No data is sent anywhere. No external requests are made.

---

## File structure

```
xfilter/
├── manifest.json   # Extension manifest (MV3)
├── popup.html      # Settings UI
├── popup.js        # Popup logic & storage management
├── content.js      # Feed filtering & MutationObserver
└── README.md
```

---

## Known limitations

- Twitter/X periodically changes their internal DOM structure and `data-testid` attributes. If filtering stops working after a site update, the selectors in `content.js` may need to be updated.
- Retweets are filtered by the **retweeter**, not the original author. If a filtered user retweets a text-only post from someone else, it gets hidden. If an unfiltered user retweets a filtered user's text post, it stays visible.
- Quoted tweets are filtered based on the quoting user's handle.
- The extension has no effect on the Twitter/X mobile apps — only the browser version.

---

## Contributing

Pull requests are welcome. If Twitter changes their DOM and breaks the selectors, opening an issue with the new attribute names is the most helpful thing you can do.

---

## License

MIT — do whatever you want with it.
