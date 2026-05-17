/**
 * XFilter — content script
 * Runs on twitter.com / x.com.
 * For each user in the filter list, hides their text-only tweets
 * and keeps only tweets that contain at least one image.
 */

let filteredUsers = new Set();

// ── Load saved users from storage ────────────────────────
chrome.storage.sync.get('xfilter_users', ({ xfilter_users = [] }) => {
  filteredUsers = new Set(xfilter_users.map(u => u.toLowerCase()));
  scanFeed();
});

// ── Listen for updates from popup ────────────────────────
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'XFILTER_UPDATE') {
    filteredUsers = new Set((msg.users || []).map(u => u.toLowerCase()));
    // Re-evaluate all currently visible tweets
    document.querySelectorAll('article[data-testid="tweet"]').forEach(processTweet);
  }
});

// ── Extract all handles responsible for a tweet ──────────
// Returns an array: [retweeter (if any), original author]
// We check both so filtering works on retweets too.
function getHandles(article) {
  const handles = [];

  // 1. Retweeter — Twitter renders the "X Retweeted" bar as a SIBLING above
  //    the article, not inside it. Climb up to the cell wrapper to find it.
  const cell = article.closest('[data-testid="cellInnerDiv"]') || article.parentElement;
  if (cell) {
    const socialContext = cell.querySelector('[data-testid="socialContext"]');
    if (socialContext) {
      const rtLink = socialContext.querySelector('a[href^="/"]');
      if (rtLink) {
        const match = rtLink.getAttribute('href').match(/^\/([^/?]+)/);
        if (match) handles.push(match[1].toLowerCase());
      }
    }
  }

  // 2. Original tweet author — from the User-Name block inside the article
  const userNameBlock = article.querySelector('[data-testid="User-Name"]');
  if (userNameBlock) {
    const spans = userNameBlock.querySelectorAll('span');
    for (const span of spans) {
      const t = span.textContent.trim();
      if (t.startsWith('@')) { handles.push(t.slice(1).toLowerCase()); break; }
    }
    // Fallback: profile link href
    if (handles.length === (handles[0] ? 1 : 0)) {
      const link = userNameBlock.querySelector('a[href^="/"]');
      if (link) {
        const match = link.getAttribute('href').match(/^\/([^/?]+)/);
        if (match) handles.push(match[1].toLowerCase());
      }
    }
  }

  return handles;
}

// ── Check if a tweet contains at least one image ─────────
function hasImage(article) {
  // Photo card
  if (article.querySelector('[data-testid="tweetPhoto"]')) return true;
  // Media in the tweet body (pbs.twimg.com/media = uploaded images)
  const imgs = article.querySelectorAll('img[src]');
  for (const img of imgs) {
    if (img.src.includes('pbs.twimg.com/media')) return true;
  }
  // Card with image preview
  if (article.querySelector('[data-testid="card.layoutSmall.media"]')) return true;
  if (article.querySelector('[data-testid="card.layoutLarge.media"]')) return true;
  return false;
}

// ── Process a single tweet ────────────────────────────────
function processTweet(article) {
  // Skip promoted tweets (ads)
  if (article.querySelector('[data-testid="placementTracking"]')) return;

  const handles = getHandles(article);
  if (handles.length === 0) return;

  // Trigger if ANY of the handles (retweeter or author) is in the filter list
  const isFiltered = handles.some(h => filteredUsers.has(h));

  if (!isFiltered) {
    // Not a filtered user — restore visibility in case they were removed from list
    if (article.dataset.xfilterHidden === 'true') {
      article.style.display = '';
      article.dataset.xfilterHidden = 'false';
    }
    return;
  }

  // Filtered user: hide if no image, show if image
  if (hasImage(article)) {
    article.style.display = '';
    article.dataset.xfilterHidden = 'false';
  } else {
    article.style.display = 'none';
    article.dataset.xfilterHidden = 'true';
  }
}

// ── Scan all tweets currently in the DOM ─────────────────
function scanFeed() {
  document.querySelectorAll('article[data-testid="tweet"]').forEach(processTweet);
}

// ── Watch for new tweets loading (infinite scroll) ───────
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (!(node instanceof HTMLElement)) continue;

      // The new node might be a tweet itself
      if (node.matches('article[data-testid="tweet"]')) {
        processTweet(node);
      }

      // Or it might contain tweets (e.g. a wrapper div)
      node.querySelectorAll('article[data-testid="tweet"]').forEach(processTweet);
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });
