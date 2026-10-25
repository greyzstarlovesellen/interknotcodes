const redemptionUrl = 'https://zenless.hoyoverse.com/redemption';
// Lista pública e somente leitura. Atualize aqui e publique uma nova versão do site.
const codes = window.INTER_KNOT_CODES || [];
const list = document.querySelector('#code-list');
const count = document.querySelector('#code-count');
const empty = document.querySelector('#empty-state');
const search = document.querySelector('#search');
let toastTimer;
const profileStorageKey = 'interKnotLocalProfiles';
const activeProfileKey = 'interKnotActiveProfile';
let activeProfile = localStorage.getItem(activeProfileKey) || '';

function loadProfiles() {
  try { return JSON.parse(localStorage.getItem(profileStorageKey) || '{}'); }
  catch { return {}; }
}
function saveProfiles(profiles) {
  try { localStorage.setItem(profileStorageKey, JSON.stringify(profiles)); return true; }
  catch { showToast('ARMAZENAMENTO LOCAL INDISPONÍVEL'); return false; }
}
function profileKey(name) { return name.trim().toLocaleLowerCase('pt-BR'); }
function activeProfileData() {
  if (!activeProfile) return null;
  return loadProfiles()[activeProfile] || null;
}
function setSiteView(view) {
  const accountView = document.querySelector('#account-view');
  const siteSections = [...document.querySelectorAll('main > .hero, main > .code-section, main > .how-section')];
  const isAccount = view === 'account';
  siteSections.forEach(section => { section.hidden = isAccount; });
  accountView.hidden = !isAccount;
  document.body.classList.toggle('account-mode', isAccount);
  if (isAccount) {
    const profile = activeProfileData();
    document.querySelector('#login-panel').hidden = Boolean(profile);
    document.querySelector('#history-panel').hidden = !profile;
    if (profile) renderHistory(profile);
    history.replaceState(null, '', '#account');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    history.replaceState(null, '', '#top');
  }
}
function polyRewardTotal(rewards = []) {
  return rewards.reduce((total, reward) => {
    if (reward.icon !== 'polychrome' && reward.name.toLowerCase() !== 'policromos') return total;
    return total + (Number.parseInt(String(reward.amount).replace(/\D/g, ''), 10) || 0);
  }, 0);
}
function renderHistory(profile) {
  document.querySelector('#profile-name').textContent = profile.name;
  const entries = [...(profile.redeemed || [])].sort((a, b) => new Date(b.redeemedAt) - new Date(a.redeemedAt));
  const polyTotal = entries.reduce((sum, entry) => sum + polyRewardTotal(entry.reward), 0);
  document.querySelector('#poly-total').textContent = new Intl.NumberFormat('pt-BR').format(polyTotal);
  document.querySelector('#history-count').textContent = `${String(entries.length).padStart(2, '0')} ${entries.length === 1 ? 'REGISTRO' : 'REGISTROS'}`;
  document.querySelector('#history-empty').hidden = entries.length > 0;
  const historyList = document.querySelector('#history-list');
  historyList.replaceChildren(...entries.map(entry => {
    const item = document.createElement('article'); item.className = 'history-item';
    const identity = document.createElement('div'); identity.className = 'history-code';
    const code = document.createElement('strong'); code.textContent = entry.code;
    const date = document.createElement('span'); date.textContent = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(entry.redeemedAt));
    identity.append(code, date);
    const rewards = document.createElement('div'); rewards.className = 'history-rewards';
    (entry.reward || []).forEach(reward => {
      const chip = document.createElement('span');
      if (reward.icon) { const icon = document.createElement('img'); icon.src = `assets/icons/${reward.icon}.png`; icon.alt = ''; chip.append(icon); }
      const text = document.createElement('span'); text.textContent = `×${reward.amount} ${reward.name}`; chip.append(text); rewards.append(chip);
    });
    item.append(identity, rewards); return item;
  }));
}
function toggleRedeemed(code) {
  if (!activeProfileData()) { showToast('ABRA MINHA CONTA PARA SALVAR SEU HISTÓRICO'); return; }
  const profiles = loadProfiles();
  const profile = profiles[activeProfile];
  const existingIndex = profile.redeemed.findIndex(item => item.code.toLowerCase() === code.toLowerCase());
  if (existingIndex >= 0) {
    profile.redeemed.splice(existingIndex, 1);
    showToast(`${code} REMOVIDO DO HISTÓRICO`);
  } else {
    const source = codes.find(item => item.code.toLowerCase() === code.toLowerCase());
    if (!source) return;
    profile.redeemed.push({ code: source.code, reward: source.reward.map(reward => ({ ...reward })), redeemedAt: new Date().toISOString() });
    showToast(`${code} ADICIONADO AO HISTÓRICO`);
  }
  if (saveProfiles(profiles)) {
    render();
    if (!document.querySelector('#account-view').hidden) renderHistory(profile);
  }
}

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
    const redeemed = Boolean(activeProfileData()?.redeemed?.some(entry => entry.code.toLowerCase() === item.code.toLowerCase()));
    const mark = document.createElement('button'); mark.className = `redeemed-button${redeemed ? ' is-redeemed' : ''}`; mark.type = 'button';
    mark.setAttribute('aria-pressed', String(redeemed)); mark.textContent = redeemed ? 'RESGATADO ✓' : 'MARCAR RESGATE';
    mark.addEventListener('click', () => toggleRedeemed(item.code));
    const copy = document.createElement('button'); copy.className = 'copy-button'; copy.type = 'button'; copy.setAttribute('aria-label', `Copiar código ${item.code}`); copy.textContent = 'COPIAR CÓDIGO'; copy.addEventListener('click', () => copyCode(item.code));
    const redeem = document.createElement('a'); redeem.className = 'redeem-button'; redeem.href = `${redemptionUrl}?code=${encodeURIComponent(item.code)}`; redeem.target = '_blank'; redeem.rel = 'noopener noreferrer';
    const arrow = document.createElement('span'); arrow.className = 'redeem-arrow'; arrow.textContent = '↗';
    const label = document.createElement('span'); label.className = 'redeem-label';
    const eyebrow = document.createElement('small'); eyebrow.textContent = 'SITE OFICIAL';
    const cta = document.createElement('strong'); cta.textContent = 'RESGATAR'; label.append(eyebrow, cta); redeem.append(label, arrow);
    actions.append(copy, redeem, mark); info.append(identity, details); card.append(info, actions); return card;
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
document.querySelector('#account-link').addEventListener('click', () => setSiteView('account'));
document.querySelector('#account-back').addEventListener('click', () => setSiteView('site'));
document.querySelector('#account-logout').addEventListener('click', () => {
  activeProfile = ''; localStorage.removeItem(activeProfileKey); setSiteView('account');
});
document.querySelector('#login-form').addEventListener('submit', event => {
  event.preventDefault();
  const name = document.querySelector('#username').value.trim().replace(/\s+/g, ' ');
  if (name.length < 2) { showToast('DIGITE UM NOME COM PELO MENOS 2 CARACTERES'); return; }
  const key = profileKey(name);
  const profiles = loadProfiles();
  if (!profiles[key]) profiles[key] = { name, redeemed: [] };
  else profiles[key].name = name;
  if (!saveProfiles(profiles)) return;
  activeProfile = key; localStorage.setItem(activeProfileKey, key);
  render(); setSiteView('account');
});
document.querySelector('.brand').addEventListener('click', event => { event.preventDefault(); setSiteView('site'); });
window.addEventListener('hashchange', () => {
  if (location.hash === '#account') setSiteView('account');
  else if (location.hash === '#top' || location.hash === '#codes' || location.hash === '#how' || !location.hash) {
    document.querySelectorAll('main > .hero, main > .code-section, main > .how-section').forEach(section => { section.hidden = false; });
    document.querySelector('#account-view').hidden = true;
    document.body.classList.remove('account-mode');
  }
});
document.addEventListener('keydown', event => { if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) { event.preventDefault(); search.focus(); } });
document.querySelector('#account-link').textContent = activeProfileData() ? 'MINHA CONTA' : 'MINHA CONTA';
render();
