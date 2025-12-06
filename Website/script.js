// script.js — simple product catalog for furniture demo
const services = [
  {
    id: 'sofa-01',
    title: 'Cove Sofa',
    short: '3-seater sofa with low profile and wool blend upholstery.',
    price: 'Rp6.750.000',
    details: 'Elegant low-profile 3-seater with kiln-dried frame and high-density foam. Dimensions: 220x90x78 cm.'
  },
  {
    id: 'armchair-01',
    title: 'Loma Armchair',
    short: 'Single lounge chair with sculptural silhouette.',
    price: 'Rp2.950.000',
    details: 'Hand-finished ash frame with textured gray fabric. Comfortable deep seat for reading corners.'
  },
  {
    id: 'table-01',
    title: 'Slate Coffee Table',
    short: 'Minimal coffee table with matte black steel base.',
    price: 'Rp3.200.000',
    details: 'Round solid oak top with powder-coated steel legs. Diameter 90 cm, height 40 cm.'
  },
  {
    id: 'lamp-01',
    title: 'Halo Floor Lamp',
    short: 'Slim floor lamp with adjustable arm and warm LED.',
    price: 'Rp1.150.000',
    details: 'Brass finish with dimmable LED (2700K). Height adjustable up to 160 cm.'
  }
];

const $ = s => document.querySelector(s);

// Default API endpoints (change to your public server URL when deployed)
const API_BASE = '';
const LOGIN_URL = API_BASE + '/api/login';
const REGISTER_URL = API_BASE + '/api/register';

function renderServices(){
  const container = document.getElementById('products');
  if(!container) return;
  container.innerHTML = '';
  services.forEach(s => {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.innerHTML = `
      <img src="images/${s.id}.jpg" alt="${s.title}" onerror="this.style.opacity=0.9;this.style.background='#eee'">
      <div class="product-body">
        <div class="product-title">${s.title}</div>
        <div class="product-price">${s.price}</div>
        <div class="product-price-desc">${s.short}</div>
        <div class="product-actions">
          <button class="btn" data-id="${s.id}" data-action="detail">Details</button>
          <button class="btn btn-primary" data-id="${s.id}" data-action="inquiry">Add to Cart</button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function openDetail(id){
  const s = services.find(x=>x.id===id);
  if(!s) return alert('Product not found');
  const html = `
    <div style="display:flex;gap:14px;align-items:flex-start">
      <img src="images/${s.id}.jpg" alt="${s.title}" style="width:220px;height:160px;object-fit:cover;border-radius:8px">
      <div>
        <h3 style="margin:0 0 8px">${s.title}</h3>
        <div style="color:var(--muted);margin-bottom:8px">${s.price}</div>
        <p style="margin:0 0 12px">${s.details}</p>
        <div style="display:flex;gap:8px"><button class="btn btn-primary" data-id="${s.id}" data-action="inquiry">Add to Cart</button><button class="btn" id="modal-close-temp">Close</button></div>
      </div>
    </div>
  `;
  openModal(html);
  const closeTemp = document.getElementById('modal-close-temp'); if(closeTemp) closeTemp.addEventListener('click', closeModal);
}

function openInquiry(id){
  const s = services.find(x=>x.id===id);
  if(!s) return;
  addToCart(s);
  alert(`${s.title} ditambahkan ke keranjang.`);
}

function addToCart(product){
  try{
    const list = JSON.parse(localStorage.getItem('cart')||'[]');
    list.push(Object.assign({ts: Date.now()}, product));
    localStorage.setItem('cart', JSON.stringify(list));
  }catch(e){console.error('Gagal menyimpan cart', e)}
}

// Minimal modal implementation
function openModal(innerHTML){
  let modal = document.getElementById('site-modal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'site-modal';
    modal.className = 'site-modal';
    modal.innerHTML = '<div class="modal-inner"><button id="modal-close">×</button><div class="modal-body"></div></div>';
    document.body.appendChild(modal);
    modal.querySelector('#modal-close').addEventListener('click', closeModal);
  }
  modal.querySelector('.modal-body').innerHTML = innerHTML;
  modal.classList.remove('hidden');
}
function closeModal(){
  const modal = document.getElementById('site-modal');
  if(modal) modal.classList.add('hidden');
}

document.addEventListener('click', e=>{
  const btn = e.target.closest('button[data-action]');
  if(btn){
    const id = btn.getAttribute('data-id');
    const action = btn.getAttribute('data-action');
    if(action==='detail') openDetail(id);
    if(action==='inquiry') openInquiry(id);
  }
});

document.addEventListener('DOMContentLoaded', ()=>{
  // render products
  if(document.getElementById('products')) renderServices();
  // set year if present
  const y = document.getElementById('year'); if(y) y.textContent = new Date().getFullYear();

  const cta = document.getElementById('cta-shop');
  if(cta) cta.addEventListener('click', ()=>{
    document.getElementById('shop').scrollIntoView({behavior:'smooth'});
  });
  const ctaExplore = document.getElementById('cta-explore');
  if(ctaExplore) ctaExplore.addEventListener('click', ()=> alert('Explore materials coming soon.'));
  // hook up header "Masuk" button to open dedicated login page
  const loginHeaderBtn = document.querySelector('.nav-btn.outline');
  if(loginHeaderBtn){
    loginHeaderBtn.addEventListener('click', (ev)=>{ ev.preventDefault(); window.location.href = 'login.html'; });
  }
  // if already logged in (token present), show logged-in state
  const existingToken = localStorage.getItem('ev_token');
  const existingName = localStorage.getItem('ev_name');
  if(existingToken){ showLoggedInState(existingName || 'User'); }
  // hook up header "Daftar" button to registration page
  const signupBtn = document.querySelector('.nav-btn.primary');
  if(signupBtn){ signupBtn.addEventListener('click', (ev)=>{ ev.preventDefault(); window.location.href = 'register.html'; }); }
  // registration page behaviour (if on register.html)
  initRegisterPage();
});

function initRegisterPage(){
  if(!document.body.classList.contains('register-page')) return;
  const form = document.getElementById('register-form');
  const steps = Array.from(document.querySelectorAll('.step'));
  const total = steps.length;
  const progressTrack = document.querySelector('.progress-track');
  const feedback = document.getElementById('register-feedback');
  let current = 0; // index in steps (0-based)

  function showStep(index){
    steps.forEach((s,i)=>{
      if(i===index) s.classList.remove('hidden'); else s.classList.add('hidden');
    });
    const pct = total>1 ? Math.round((index)/(total-1)*100) : 100;
    if(progressTrack) progressTrack.style.setProperty('--fill', pct + '%');
    if(feedback) feedback.textContent='';
  }

  // initial
  showStep(current);

  // delegated click handler for next/back buttons
  form.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-action]');
    if(!btn) return;
    const action = btn.getAttribute('data-action');
    if(action==='next'){
      // basic validation of current step inputs
      const inputs = steps[current].querySelectorAll('input,select');
      for(const inp of inputs){
        if(inp.hasAttribute('required')){
          if(inp.type==='file'){
            if(!inp.files || inp.files.length===0){ if(feedback){ feedback.textContent = 'Mohon isi semua field yang wajib.'; feedback.style.color='crimson'; } return; }
          }else if(!inp.value || !String(inp.value).trim()){
            if(feedback){ feedback.textContent = 'Mohon isi semua field yang wajib.'; feedback.style.color='crimson'; }
            return;
          }
        }
      }
      if(current < total-1){ current += 1; showStep(current); }
    }
    if(action==='back'){
      if(current > 0){ current -= 1; showStep(current); }
    }
  });

  // submit handler: collect all fields including files and send as FormData
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    if(feedback) feedback.textContent='';

    // final validation: ensure TnC checked
    const tnc = document.getElementById('tnc');
    if(tnc && !tnc.checked){ if(feedback){ feedback.textContent='Anda harus menyetujui syarat & ketentuan.'; feedback.style.color='crimson'; } return; }

    const submitBtn = document.getElementById('reg-submit');
    const prevText = submitBtn ? submitBtn.textContent : 'Mengirim...';
    if(submitBtn){ submitBtn.disabled = true; submitBtn.textContent = 'Mendaftarkan...'; }

    try{
      const formData = new FormData();
      // append all inputs
      const elements = form.querySelectorAll('input,select');
      elements.forEach(el => {
        if(!el.name) return;
        if(el.type === 'file'){
          if(el.files && el.files[0]) formData.append(el.name, el.files[0]);
        } else if(el.type === 'checkbox'){
          formData.append(el.name, el.checked);
        } else {
          formData.append(el.name, el.value);
        }
      });

      const res = await fetch(REGISTER_URL, { method: 'POST', body: formData });
      const data = await res.json().catch(()=>null);
      if(!res.ok){ const msg = data && data.message ? data.message : `Gagal mendaftar (status ${res.status})`; if(feedback){ feedback.textContent=msg; feedback.style.color='crimson'; } if(submitBtn){ submitBtn.disabled=false; submitBtn.textContent=prevText; } return; }

      // expect token
      const token = data && data.token;
      const name = data && data.name;
      if(!token){ if(feedback){ feedback.textContent='Respons server tidak menyertakan token.'; feedback.style.color='crimson'; } if(submitBtn){ submitBtn.disabled=false; submitBtn.textContent=prevText; } return; }

      localStorage.setItem('ev_token', token);
      if(name) localStorage.setItem('ev_name', name);
      if(feedback){ feedback.textContent='Pendaftaran berhasil. Mengalihkan...'; feedback.style.color='var(--green)'; }
      setTimeout(()=>{ window.location.href = 'Index.html'; }, 900);
    }catch(err){ console.error('Register error', err); if(feedback){ feedback.textContent='Terjadi kesalahan jaringan.'; feedback.style.color='crimson'; } if(submitBtn){ submitBtn.disabled=false; submitBtn.textContent=prevText; } }
  });
}

// --- Login modal + API integration ---
function openLoginModal(){
  const html = `
    <div class="login-modal">
      <h2>Lanjutkan Ke Elvora</h2>
      <form id="login-form">
        <input id="login-identifier" name="identifier" type="text" placeholder="email/No hp" required>
        <input id="login-password" name="password" type="password" placeholder="Kata sandi" required>
        <div class="login-actions">
          <a href="#" id="forgot-pw">Lupa Kata Sandi?</a>
          <button type="submit" class="btn btn-primary" id="login-submit">Masuk</button>
        </div>
        <div class="login-feedback" id="login-feedback" aria-live="polite"></div>
      </form>
    </div>
  `;
  openModal(html);
  const form = document.getElementById('login-form');
  if(form) form.addEventListener('submit', handleLoginSubmit);
  const forgot = document.getElementById('forgot-pw'); if(forgot) forgot.addEventListener('click', (e)=>{ e.preventDefault(); alert('Fitur pemulihan kata sandi belum tersedia.'); });
}

async function handleLoginSubmit(e){
  e.preventDefault();
  const idEl = document.getElementById('login-identifier');
  const pwEl = document.getElementById('login-password');
  const submitBtn = document.getElementById('login-submit');
  const feedback = document.getElementById('login-feedback');
  if(!idEl || !pwEl || !submitBtn || !feedback) return;
  const identifier = idEl.value.trim();
  const password = pwEl.value.trim();
  feedback.textContent = '';
  if(!identifier){ feedback.textContent = 'Mohon masukkan email atau nomor HP.'; feedback.style.color = 'crimson'; idEl.focus(); return; }
  if(!password){ feedback.textContent = 'Mohon masukkan kata sandi.'; feedback.style.color = 'crimson'; pwEl.focus(); return; }

  submitBtn.disabled = true;
  const prevText = submitBtn.textContent;
  submitBtn.textContent = 'Memeriksa...';

  try{
    const res = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });
    const data = await res.json().catch(()=>null);
    if(!res.ok){
      const msg = data && data.message ? data.message : `Gagal masuk (status ${res.status})`;
      feedback.textContent = msg; feedback.style.color = 'crimson';
      submitBtn.disabled = false; submitBtn.textContent = prevText; return;
    }
    // expect { token, name }
    const token = data && data.token;
    const name = data && data.name;
    if(!token){ feedback.textContent = 'Respons server tidak menyertakan token.'; feedback.style.color = 'crimson'; submitBtn.disabled = false; submitBtn.textContent = prevText; return; }

    // success
    localStorage.setItem('ev_token', token);
    if(name) localStorage.setItem('ev_name', name);
    feedback.textContent = 'Berhasil masuk. Mengalihkan...'; feedback.style.color = 'var(--green)';
    setTimeout(()=>{
      closeModal();
      showLoggedInState(name || identifier);
    }, 700);
  }catch(err){
    console.error('Login error', err);
    feedback.textContent = 'Terjadi kesalahan jaringan. Coba lagi.'; feedback.style.color = 'crimson';
    submitBtn.disabled = false; submitBtn.textContent = prevText;
  }
}

function showLoggedInState(identifier){
  const loginBtn = document.querySelector('.nav-btn.outline');
  if(!loginBtn) return;
  const parent = loginBtn.parentElement;
  if(!parent) return;
  const displayName = shortName(identifier || localStorage.getItem('ev_name') || 'User');
  const userEl = document.createElement('div');
  userEl.className = 'nav-user';
  userEl.innerHTML = `<span class="nav-user-name">${escapeHtml(displayName)}</span> <button class="nav-btn" id="logout-btn">Keluar</button>`;
  parent.replaceChild(userEl, loginBtn);
  const logout = document.getElementById('logout-btn'); if(logout) logout.addEventListener('click', ()=>{ localStorage.removeItem('ev_token'); localStorage.removeItem('ev_name'); window.location.reload(); });
}

function shortName(identifier){
  if(!identifier) return 'User';
  const at = identifier.indexOf('@'); if(at > 0) return identifier.slice(0, at);
  const digits = identifier.replace(/\D/g,''); if(digits.length >= 4) return 'User' + digits.slice(-4);
  return identifier;
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]); }
