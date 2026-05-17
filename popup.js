const input     = document.getElementById('handle-input');
const addBtn    = document.getElementById('add-btn');
const errorMsg  = document.getElementById('error-msg');
const userList  = document.getElementById('user-list');
const countBadge= document.getElementById('count-badge');
const clearBtn  = document.getElementById('clear-btn');

// ── Helpers ──────────────────────────────────────────────
function normalise(raw) {
  return raw.trim().replace(/^@/, '').toLowerCase();
}

function showError(msg) {
  errorMsg.textContent = msg;
  setTimeout(() => { errorMsg.textContent = ''; }, 2500);
}

function saveAndNotify(users) {
  chrome.storage.sync.set({ xfilter_users: users }, () => {
    // Tell any open Twitter/X tabs to refresh their filter list
    chrome.tabs.query({ url: ['*://twitter.com/*', '*://x.com/*'] }, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { type: 'XFILTER_UPDATE', users }).catch(() => {});
      });
    });
  });
}

// ── Render list ──────────────────────────────────────────
function renderList(users) {
  countBadge.textContent = users.length;
  userList.innerHTML = '';

  if (users.length === 0) {
    userList.innerHTML = `
      <div class="empty-state">
        <span>◎</span>
        No users added yet.<br>Type a handle above to get started.
      </div>`;
    return;
  }

  users.forEach(handle => {
    const item = document.createElement('div');
    item.className = 'user-item';
    item.innerHTML = `
      <span class="user-handle">@${handle}</span>
      <button class="remove-btn" data-handle="${handle}" title="Remove">✕</button>
    `;
    userList.appendChild(item);
  });

  userList.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const h = btn.dataset.handle;
      chrome.storage.sync.get('xfilter_users', ({ xfilter_users = [] }) => {
        const updated = xfilter_users.filter(u => u !== h);
        saveAndNotify(updated);
        renderList(updated);
      });
    });
  });
}

// ── Add user ─────────────────────────────────────────────
function addUser() {
  const handle = normalise(input.value);
  if (!handle) { showError('Enter a username.'); return; }
  if (!/^[a-z0-9_]{1,15}$/.test(handle)) {
    showError('Invalid username format.');
    return;
  }

  chrome.storage.sync.get('xfilter_users', ({ xfilter_users = [] }) => {
    if (xfilter_users.includes(handle)) {
      showError('@' + handle + ' is already in the list.');
      return;
    }
    const updated = [...xfilter_users, handle];
    saveAndNotify(updated);
    renderList(updated);
    input.value = '';
    input.focus();
  });
}

addBtn.addEventListener('click', addUser);
input.addEventListener('keydown', e => { if (e.key === 'Enter') addUser(); });

clearBtn.addEventListener('click', () => {
  if (!confirm('Remove all filtered users?')) return;
  saveAndNotify([]);
  renderList([]);
});

// ── Init ─────────────────────────────────────────────────
chrome.storage.sync.get('xfilter_users', ({ xfilter_users = [] }) => {
  renderList(xfilter_users);
});
