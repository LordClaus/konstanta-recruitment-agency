import { translations } from './translations.js';

const API_BASE_URL = 'http://localhost:8000';

// State
let currentLang = localStorage.getItem('lang') || 'ua';
let currentTheme = localStorage.getItem('theme') || 'light';
let user = JSON.parse(localStorage.getItem('user')) || null;
let cookieConsent = localStorage.getItem('cookie-consent') === 'true';

let jobsData = [];
let comments = [];

let activeFilter = 'All';

// Init
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initLanguage();
    initModals();
    initMobileMenu();
    initJobFilters();
    fetchJobs();
    fetchReviews();
    initCounters();
    initRevealAnimations();
    initCookieConsent();
    updateAuthUI();
    lucide.createIcons();
});

async function fetchJobs() {
    try {
        const response = await fetch(`${API_BASE_URL}/jobs`);
        if (!response.ok) throw new Error('Failed to fetch jobs');
        jobsData = await response.json();
    } catch (err) {
        console.warn('API unavailable (localhost:8000), using fallback jobs.');
        jobsData = [
            { id: '1001', title: { ua: "Водії автомобілів", cz: "Řidiči automobilů", en: "Delivery Drivers" }, category: 'Drivers', location: "Praha, CZ", maps: [1, 2], new: true },
            { id: '1002', title: { ua: "Робітник сортування", cz: "Skladník-třídič", en: "Sorting Worker" }, category: 'Warehouse', location: "Brno, CZ", maps: [1, 2], new: true },
            { id: '1003', title: { ua: "Прибиральник", cz: "Uklízeč/ka", en: "Cleaner" }, category: 'Cleaning', location: "Plzeň, CZ", maps: [1, 2] },
            { id: '1004', title: { ua: "Робітник на виробництво", cz: "Dělník ve výrobě", en: "Production Worker" }, category: 'Factory', location: "Ostrava, CZ", maps: [1, 2] }
        ];
    } finally {
        renderJobs();
    }
}

async function fetchReviews() {
    try {
        const response = await fetch(`${API_BASE_URL}/reviews`);
        if (!response.ok) throw new Error('Failed to fetch reviews');
        comments = await response.json();
    } catch (err) {
        console.warn('API unavailable (localhost:8000), using fallback reviews.');
        comments = [
            { id: '1', userName: 'John Doe', text: 'Great service!', createdAt: new Date().toISOString() },
            { id: '2', userName: 'Anna Smith', text: 'Helpful staff.', createdAt: new Date().toISOString() }
        ];
    } finally {
        renderReviews();
    }
}

// Translation Logic
function initLanguage() {
    updateLanguage(currentLang);
    
    // Lang selectors
    document.querySelectorAll('[data-lang]').forEach(el => {
        el.addEventListener('click', () => {
            const lang = el.getAttribute('data-lang');
            setLanguage(lang);
        });
    });
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
    updateLanguage(lang);
    renderJobs();
    renderReviews();
    renderBranches();
    renderLegalInfo();
    updateProfessions();
    
    // Update active class on selectors
    document.querySelectorAll('[data-lang]').forEach(el => {
        if (el.getAttribute('data-lang') === lang) {
            el.classList.remove('opacity-60');
            el.classList.add('text-primary', 'dark:text-accent', 'font-bold');
        } else {
            el.classList.add('opacity-60');
            el.classList.remove('text-primary', 'dark:text-accent', 'font-bold');
        }
    });

    // Mobile nav lang
    document.querySelectorAll('#lang-selector-mobile button').forEach(el => {
        if (el.getAttribute('data-lang') === lang) {
            el.classList.add('text-primary', 'dark:text-accent');
            el.classList.remove('text-slate-600', 'dark:text-slate-500');
        } else {
            el.classList.remove('text-primary', 'dark:text-accent');
            el.classList.add('text-slate-600', 'dark:text-slate-500');
        }
    });
}

function updateLanguage(lang) {
    const t = translations[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const path = el.getAttribute('data-i18n');
        const keys = path.split('.');
        let value = t;
        keys.forEach(key => {
            value = value ? value[key] : null;
        });
        if (value) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = value;
            } else {
                el.textContent = value;
            }
        }
    });
}

// Theme Logic
function initTheme() {
    if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        currentTheme = 'dark';
    } else {
        document.documentElement.classList.remove('dark');
        currentTheme = 'light';
    }

    document.getElementById('theme-toggle').addEventListener('click', () => {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            currentTheme = 'light';
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            currentTheme = 'dark';
        }
    });
}

// Mobile Menu
function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    btn.addEventListener('click', () => {
        menu.classList.toggle('hidden');
    });
    menu.querySelectorAll('a, button').forEach(el => {
        el.addEventListener('click', () => menu.classList.add('hidden'));
    });
}

// Modals
function initModals() {
    const authModal = document.getElementById('auth-modal');
    const jobModal = document.getElementById('job-modal');

    document.getElementById('btn-login-header').addEventListener('click', () => {
        if (user) {
            logout();
        } else {
            openModal(authModal);
        }
    });

    document.querySelectorAll('.btn-job-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!cookieConsent) {
                alert(translations[currentLang].cookies.required);
                return;
            }
            if (!user) {
                openModal(authModal);
            } else {
                openModal(jobModal);
                resetJobForm();
            }
        });
    });

    document.querySelectorAll('.modal-close, .modal-overlay').forEach(el => {
        el.addEventListener('click', (e) => {
            if (el.classList.contains('modal-overlay') && e.target !== el) return;
            closeAllModals();
        });
    });

    // Login Handler (Stub)
    document.getElementById('btn-google-login').addEventListener('click', signInWithGoogle);

    // Job Form Handler
    const jobForm = document.getElementById('job-form');
    jobForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-submit-apply');
        btn.disabled = true;
        btn.innerHTML = '...';

        try {
            const formData = new FormData(jobForm);
            const data = Object.fromEntries(formData);
            
            try {
                const response = await fetch(`${API_BASE_URL}/apply`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (!response.ok) throw new Error('API server error');
            } catch (fetchErr) {
                console.warn('POST failed, simulating success for demo:', fetchErr);
                await new Promise(r => setTimeout(r, 1000)); // Simulate network lag
            }
            
            document.getElementById('job-step-1').classList.add('hidden');
            document.getElementById('job-success').classList.remove('hidden');
        } catch (err) {
            console.error('Application error:', err);
            alert('Something went wrong. Please try again.');
        } finally {
            btn.disabled = false;
            btn.innerHTML = `<span data-i18n="apply.submit">${translations[currentLang].apply.submit}</span>`;
        }
    });

    // GDPR Checkbox
    const gdprContainer = document.getElementById('gdpr-checkbox-container');
    const gdprBox = document.getElementById('gdpr-checkbox');
    const submitBtn = document.getElementById('btn-submit-apply');
    let gdprAgreed = false;

    gdprContainer.addEventListener('click', () => {
        gdprAgreed = !gdprAgreed;
        if (gdprAgreed) {
            gdprBox.classList.add('bg-accent', 'border-accent');
            gdprBox.classList.remove('bg-white', 'dark:bg-slate-900', 'border-slate-200', 'dark:border-slate-700');
            gdprBox.querySelector('i').classList.remove('hidden');
        } else {
            gdprBox.classList.remove('bg-accent', 'border-accent');
            gdprBox.classList.add('bg-white', 'dark:bg-slate-900', 'border-slate-200', 'dark:border-slate-700');
            gdprBox.querySelector('i').classList.add('hidden');
        }
        submitBtn.disabled = !gdprAgreed;
    });

    // CV Upload
    const cvInput = document.getElementById('cv-input');
    const cvPlaceholder = document.getElementById('cv-placeholder');
    const cvSelected = document.getElementById('cv-selected');
    const cvFilename = document.getElementById('cv-filename');

    document.getElementById('cv-upload-area').addEventListener('click', () => cvInput.click());
    cvInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            cvPlaceholder.classList.add('hidden');
            cvSelected.classList.remove('hidden');
            cvFilename.innerText = e.target.files[0].name;
        }
    });
}

function openModal(el) {
    el.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeAllModals() {
    document.querySelectorAll('#auth-modal, #job-modal').forEach(el => el.classList.add('hidden'));
    document.body.style.overflow = 'auto';
}

function resetJobForm() {
    document.getElementById('job-step-1').classList.remove('hidden');
    document.getElementById('job-success').classList.add('hidden');
    document.getElementById('job-form').reset();
    document.getElementById('cv-placeholder').classList.remove('hidden');
    document.getElementById('cv-selected').classList.add('hidden');
    // Reset GDPR
    const gdprBox = document.getElementById('gdpr-checkbox');
    gdprBox.classList.remove('bg-accent', 'border-accent');
    gdprBox.classList.add('bg-white', 'dark:bg-slate-900', 'border-slate-200', 'dark:border-slate-700');
    gdprBox.querySelector('i').classList.add('hidden');
    document.getElementById('btn-submit-apply').disabled = true;
}

function logout() {
    user = null;
    localStorage.removeItem('user');
    updateAuthUI();
    renderReviews();
}

async function signInWithGoogle() {
    // TODO: Replace with Google Identity Services JWT flow.
    if (!cookieConsent) return;
    try {
        // Mock Login
        user = { uid: '123', displayName: 'Dima', email: 'dima@example.com' };
        localStorage.setItem('user', JSON.stringify(user));
        closeAllModals();
        updateAuthUI();
        renderReviews();
    } catch (err) {
        console.error(err);
    }
}

function updateAuthUI() {
    const desktop = document.getElementById('auth-status-desktop');
    if (user) {
        desktop.innerHTML = `
            <div class="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-6">
               <span class="text-slate-600 dark:text-slate-400 capitalize font-bold">Hi, ${user.displayName.split(' ')[0]}</span>
               <button id="btn-logout" class="text-primary dark:text-accent hover:text-red-500 transition-colors cursor-pointer">
                 <i data-lucide="log-out" class="w-3.5 h-3.5"></i>
               </button>
             </div>
        `;
        document.getElementById('btn-logout').addEventListener('click', logout);
    } else {
        desktop.innerHTML = `
            <button id="btn-login-header" class="flex items-center gap-1.5 text-primary dark:text-accent hover:text-accent transition-colors border-l border-slate-200 dark:border-slate-800 pl-6 cursor-pointer">
                <i data-lucide="log-in" class="w-3 h-3"></i>
                <span data-i18n="auth.login">${translations[currentLang].auth.login}</span>
            </button>
        `;
        document.getElementById('btn-login-header').addEventListener('click', () => openModal(document.getElementById('auth-modal')));
    }
    lucide.createIcons();
}

// Jobs
function initJobFilters() {
    const container = document.getElementById('job-filters');
    const categories = [
        { id: 'All', label: { ua: 'Всі', cz: 'Vše', en: 'All' } },
        { id: 'Factory', label: { ua: 'Завод', cz: 'Továrna', en: 'Factory' } },
        { id: 'Warehouse', label: { ua: 'Склад', cz: 'Sklad', en: 'Warehouse' } },
        { id: 'Cleaning', label: { ua: 'Прибирання', cz: 'Úklid', en: 'Cleaning' } },
        { id: 'Drivers', label: { ua: 'Водії', cz: 'Řidiči', en: 'Drivers' } }
    ];

    container.innerHTML = categories.map(cat => `
        <button data-filter="${cat.id}" class="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${activeFilter === cat.id ? 'bg-primary dark:bg-accent text-white dark:text-slate-900 shadow-lg' : 'glass-card border-none text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}">
            ${cat.label[currentLang]}
        </button>
    `).join('');

    container.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            activeFilter = btn.getAttribute('data-filter');
            initJobFilters();
            renderJobs();
        });
    });
}

function renderJobs() {
    const container = document.getElementById('job-container');
    const filtered = activeFilter === 'All' ? jobsData : jobsData.filter(j => j.category === activeFilter);
    const t = translations[currentLang];

    container.innerHTML = filtered.map((job, idx) => `
        <div class="glass-card overflow-hidden group cursor-pointer border-slate-200 dark:border-slate-800 reveal-item">
            <div class="p-6">
                <div class="flex justify-between items-start mb-6">
                    <div>
                        <div class="text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-1">${job.category}</div>
                        <h3 class="text-xl font-bold text-primary dark:text-white group-hover:text-accent transition-colors">
                            ${job.title[currentLang]}
                        </h3>
                        <div class="flex items-center gap-1 text-slate-500 dark:text-slate-400 mt-1 transition-colors">
                            <i data-lucide="map-pin" class="w-3.5 h-3.5 text-accent"></i>
                            <span class="text-sm font-semibold">${job.location}</span>
                        </div>
                    </div>
                    <button class="text-slate-400 dark:text-slate-500 hover:text-accent transition-colors p-2 glass rounded-lg group-hover:bg-accent/10">
                        <i data-lucide="external-link" class="w-5 h-5"></i>
                    </button>
                </div>

                <div class="grid grid-cols-2 gap-3 mt-4">
                    ${job.maps.map((m, midx) => `
                        <div class="relative aspect-video rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors">
                            <img src="https://picsum.photos/seed/map-rec-${job.id}-${midx}/400/250" alt="Map snippet" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer">
                        </div>
                    `).join('')}
                </div>

                <div class="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-slate-500 dark:text-slate-400 transition-colors">
                    <span class="flex items-center gap-1.5">
                        ${job.new ? '<div class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>' : ''}
                        <span data-i18n="jobs.new">${t.jobs.new}</span>
                    </span>
                    <span class="text-accent transition-colors">ID: ${job.id}</span>
                </div>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

// Reviews
function renderReviews() {
    const container = document.getElementById('reviews-container');
    const formContainer = document.getElementById('review-form-container');
    const t = translations[currentLang];

    if (comments.length === 0) {
        container.innerHTML = `
            <div class="glass border border-dashed border-slate-300 dark:border-slate-700 p-12 rounded-2xl text-center text-slate-500 font-bold">
                 ${t.reviews.noReviews}
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="columns-1 md:columns-2 gap-6 space-y-6">
                ${comments.map(review => `
                    <div class="break-inside-avoid glass-card p-6 relative overflow-hidden group text-left border-slate-200 dark:border-slate-800 animate-fade-in-up">
                        <div class="flex items-center gap-3 mb-4">
                            <div class="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">
                                ${review.userName[0].toUpperCase()}
                            </div>
                            <div>
                                <div class="font-bold text-primary dark:text-white text-sm transition-colors">${review.userName}</div>
                                <div class="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-black tracking-widest transition-colors">
                                    ${new Date(review.createdAt).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                        <p class="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-medium transition-colors">"${review.text}"</p>
                    </div>
                `).join('')}
            </div>
        `;
    }

    if (user) {
        formContainer.innerHTML = `
            <form id="review-form" class="space-y-4 text-left">
                <div>
                    <input type="text" disabled value="${user.displayName || user.email}" class="w-full glass border border-slate-300 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-600 dark:text-slate-400 font-bold">
                </div>
                <textarea required id="review-text" placeholder="${cookieConsent ? t.reviews.textPlaceholder : t.cookies.required}" rows="4" class="w-full glass border border-slate-300 dark:border-slate-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all shadow-inner text-slate-900 dark:text-white font-medium ${!cookieConsent ? 'opacity-50 cursor-not-allowed' : ''}"></textarea>
                <button type="submit" id="btn-submit-review" class="w-full bg-primary dark:bg-accent text-white dark:text-slate-900 py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-slate-800 dark:hover:bg-accent-light disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95">
                    <i data-lucide="send" class="w-3.5 h-3.5"></i> <span data-i18n="reviews.submit">${t.reviews.submit}</span>
                </button>
            </form>
        `;
        document.getElementById('review-form').addEventListener('submit', handleReviewSubmit);
    } else {
        formContainer.innerHTML = `
            <div class="text-center py-6">
                <p class="text-slate-500 dark:text-slate-400 text-sm mb-6 transition-colors">${t.reviews.loginRequired}</p>
                <button class="bg-primary dark:bg-accent text-white dark:text-slate-900 px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-accent-light transition-all shadow-lg active:scale-95" onclick="document.getElementById('btn-login-header').click()">
                    ${t.auth.login}
                </button>
            </div>
        `;
    }
    lucide.createIcons();
}

async function handleReviewSubmit(e) {
    e.preventDefault();
    if (!cookieConsent) return;
    const textEl = document.getElementById('review-text');
    const text = textEl.value.trim();
    if (!text) return;

    const btn = document.getElementById('btn-submit-review');
    btn.disabled = true;
    btn.innerText = '...';

    try {
        const payload = {
            userName: user.displayName || user.email,
            text,
            createdAt: new Date().toISOString()
        };

        try {
            const response = await fetch(`${API_BASE_URL}/reviews`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error('API server error');
        } catch (fetchErr) {
            console.warn('Review POST failed, simulating local add:', fetchErr);
            comments.unshift(payload);
        }
        
        await fetchReviews(); // Refresh shared state
        textEl.value = '';
    } catch (err) {
        console.error('Review error:', err);
    } finally {
        btn.disabled = false;
        lucide.createIcons();
    }
}

// Branches & Legal Info
function renderBranches() {
    const list = document.getElementById('branch-list');
    const t = translations[currentLang];
    const locs = ["Praha", "Brno", "Ostrava", "Plzeň", "Liberec"];
    const branchText = currentLang === 'ua' ? 'Філія' : currentLang === 'cz' ? 'Pobočka' : 'Branch';
    
    document.getElementById('branch-map-title').innerText = t.contact.branchMap;

    list.innerHTML = locs.map(loc => `
        <div class="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase transition-colors">
            <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-accent"></i> <span>${branchText}: ${loc}</span>
        </div>
    `).join('');
    lucide.createIcons();
}

function renderLegalInfo() {
    const container = document.getElementById('legal-info');
    const t = translations[currentLang];
    container.innerHTML = `
        <p class="font-bold text-slate-200 uppercase tracking-widest text-[10px] mb-2">${t.legal.title}</p>
        <p>${t.legal.address}</p>
        <p>${t.legal.ico} | ${t.legal.dic}</p>
        <p class="italic opacity-80">${t.legal.reg}</p>
    `;
}

function updateProfessions() {
    const select = document.getElementById('profession-select');
    const t = translations[currentLang];
    const lang = currentLang;
    const professions = lang === 'ua' 
        ? ["Водій", "Прибиральник", "Сортувальник", "Контрактор", "Інше"]
        : lang === 'cz'
          ? ["Řidič", "Uklízeč", "Skladník", "Kontraktor", "Jiné"]
          : ["Driver", "Cleaner", "Sorter", "Contractor", "Other"];
    
    select.innerHTML = `<option value="">${t.apply.select}</option>` + professions.map(p => `
        <option value="${p}">${p}</option>
    `).join('');
}

// Stats Animation
function initCounters() {
    const numbers = document.querySelectorAll('.animated-number');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.getAttribute('data-value'));
                animateValue(entry.target, 0, target, 2000);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    numbers.forEach(num => observer.observe(num));
}

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Reveal Animations
function initRevealAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal-item').forEach(el => observer.observe(el));
}

// Cookie Consent
function initCookieConsent() {
    if (!cookieConsent) {
        document.getElementById('cookie-consent').classList.remove('hidden');
    }

    document.getElementById('btn-cookie-accept').addEventListener('click', () => {
        cookieConsent = true;
        localStorage.setItem('cookie-consent', 'true');
        document.getElementById('cookie-consent').classList.add('hidden');
        renderReviews(); // Re-render to update inputs
    });

    document.getElementById('btn-cookie-decline').addEventListener('click', () => {
        document.getElementById('cookie-consent').classList.add('hidden');
    });
}

// Mocking initial content
renderBranches();
renderLegalInfo();
updateProfessions();
