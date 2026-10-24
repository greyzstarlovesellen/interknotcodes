const redemptionUrl = 'https://zenless.hoyoverse.com/redemption';
// Lista pública e somente leitura. Atualize aqui e publique uma nova versão do site.
const codes = window.INTER_KNOT_CODES || [];
const list = document.querySelector('#code-list');
const count = document.querySelector('#code-count');
const empty = document.querySelector('#empty-state');
const search = document.querySelector('#search');
let toastTimer;

function formatExpiry(item) {
  if (item.expiryStatus === 'permanent') return 'PERMANENTE · SEM EXPIRAÇÃO';
  if (item.expiryStatus === 'undetermined') return 'VALIDADE INDETERMINADA';
  if (!item.expiresAt) return 'VALIDADE NÃO INFORMADA';
  const utc8Date = new Date(new Date(item.expiresAt).getTime() + 8 * 60 * 60 * 1000);
  const parts = Object.fromEntries(new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC'
  }).formatToParts(utc8Date).map(part => [part.type, part.value]));
  const month = parts.month.replace('.', '').toUpperCase();
  const time = `${String(utc8Date.getUTCHours()).padStart(2, '0')}:${String(utc8Date.getUTCMinutes()).padStart(2, '0')}`;
  return `VÁLIDO ATÉ ${parts.day} ${month} ${parts.year} · ${time} (UTC+8)`;
}
function daysUntil(value) { return Math.ceil((new Date(value) - new Date()) / 86400000); }
function render() {
  const query = search.value.trim().toLowerCase();
  const visible = codes.filter(item => `${item.code} ${item.reward.map(reward => reward.name).join(' ')}`.toLowerCase().includes(query));
  count.textContent = String(visible.length).padStart(2, '0');
  empty.hidden = visible.length !== 0;
  list.replaceChildren(...visible.map(item => {
    const card = document.createElement('article'); card.className = 'code-card';
    const symbol = document.createElement('span'); symbol.className = 'code-symbol'; symbol.textContent = '✳';
    const code = document.createElement('strong'); code.className = 'code-value'; code.textContent = item.code;
    const info = document.createElement('div'); info.className = 'code-info';
    const identity = document.createElement('div'); identity.className = 'code-identity'; identity.append(symbol, code);
    const rewards = document.createElement('div'); rewards.className = 'reward-list';
    item.reward.forEach(itemReward => {
      const reward = document.createElement('span'); reward.className = 'reward-chip';
      const icon = document.createElement('img'); icon.className = 'reward-icon'; icon.src = `assets/icons/${itemReward.icon}.png`; icon.alt = ''; icon.loading = 'lazy';
      const amount = document.createElement('strong'); amount.textContent = `×${itemReward.amount}`;
      const name = document.createElement('span'); name.textContent = itemReward.name;
      reward.append(icon, amount, name); rewards.append(reward);
    });
    const details = document.createElement('div'); details.className = 'code-details';
    const expiry = document.createElement('span');
    const remainingDays = item.expiresAt ? daysUntil(item.expiresAt) : Infinity;
    const expiryClass = item.expiryStatus || (remainingDays <= 2 && remainingDays >= 0 ? 'soon' : '');
    expiry.className = `expiry${expiryClass ? ` ${expiryClass}` : ''}`;
    expiry.textContent = formatExpiry(item);
    details.append(rewards, expiry);
    const actions = document.createElement('div'); actions.className = 'card-actions';
    const copy = document.createElement('button'); copy.className = 'copy-button'; copy.type = 'button'; copy.setAttribute('aria-label', `Copiar código ${item.code}`); copy.textContent = 'COPIAR CÓDIGO'; copy.addEventListener('click', () => copyCode(item.code));
    const redeem = document.createElement('a'); redeem.className = 'redeem-button'; redeem.href = `${redemptionUrl}?code=${encodeURIComponent(item.code)}`; redeem.target = '_blank'; redeem.rel = 'noopener noreferrer';
    const arrow = document.createElement('span'); arrow.className = 'redeem-arrow'; arrow.textContent = '↗';
    const label = document.createElement('span'); label.className = 'redeem-label';
    const eyebrow = document.createElement('small'); eyebrow.textContent = 'SITE OFICIAL';
    const cta = document.createElement('strong'); cta.textContent = 'RESGATAR'; label.append(eyebrow, cta); redeem.append(label, arrow);
    actions.append(copy, redeem); info.append(identity, details); card.append(info, actions); return card;
  }));
}
async function copyCode(code) {
  try { await navigator.clipboard.writeText(code); showToast(`CÓDIGO ${code} COPIADO`); }
  catch {
    const field = document.createElement('textarea'); field.value = code; field.style.position = 'fixed'; field.style.opacity = '0'; document.body.append(field); field.select();
    const ok = document.execCommand('copy'); field.remove(); showToast(ok ? `CÓDIGO ${code} COPIADO` : 'NÃO FOI POSSÍVEL COPIAR');
  }
}
function showToast(message) {
  const toast = document.querySelector('#toast'); toast.textContent = message; toast.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2300);
}
search.addEventListener('input', render);
document.addEventListener('keydown', event => { if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) { event.preventDefault(); search.focus(); } });
render();
