import { useState, ReactNode, useEffect, createContext, useContext, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Phone, 
  MapPin, 
  ExternalLink, 
  Users, 
  Briefcase, 
  Menu, 
  X,
  Clock,
  ChevronRight,
  Globe,
  LogIn,
  LogOut,
  Send,
  MessageSquare,
  FileText,
  CheckCircle2
} from 'lucide-react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  getDocFromServer
} from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { translations } from './translations';

// --- Types & Constants ---
type Language = 'ua' | 'en';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

// --- Helpers ---
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- Context ---
const LanguageContext = createContext<{
  lang: Language;
  setLang: (l: Language) => void;
  t: typeof translations.ua;
}>({
  lang: 'ua',
  setLang: () => {},
  t: translations.ua
});

const useTranslation = () => useContext(LanguageContext);

// --- Components ---
const Logo = () => (
  <div className="flex items-center gap-2 group cursor-pointer text-left">
    <div className="w-10 h-10 bg-[var(--color-primary)] rounded-lg flex items-center justify-center text-[var(--color-accent)] ring-2 ring-[var(--color-accent)]/20 group-hover:ring-[var(--color-accent)]/50 transition-all">
      <span className="font-bold text-xl">KS</span>
    </div>
    <div className="flex flex-col">
      <span className="font-bold text-[var(--color-primary)] leading-none tracking-tight uppercase">KONSTANTA</span>
      <span className="text-[10px] text-[var(--color-accent)] font-semibold tracking-widest uppercase">RECRUITMENT</span>
    </div>
  </div>
);

const NavLink = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} className="text-sm font-medium text-slate-600 hover:text-[var(--color-primary)] transition-colors whitespace-nowrap">
    {children}
  </a>
);

export default function App() {
  const [lang, setLang] = useState<Language>('ua');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showCookieConsent, setShowCookieConsent] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  const t = translations[lang];

  useEffect(() => {
    // Check connection
    const testDoc = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (e) {
        // Expected
      }
    };
    testDoc();

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    const consent = localStorage.getItem('cookie-consent');
    if (!consent) setShowCookieConsent(true);

    const q = query(collection(db, 'comments'), orderBy('createdAt', 'desc'));
    const unsubComments = onSnapshot(q, (snapshot) => {
      setComments(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'comments'));

    return () => {
      unsubAuth();
      unsubComments();
    };
  }, []);

  const handleLogin = async () => {
    if (showCookieConsent) return;
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setShowAuthModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => signOut(auth);

  const toggleJobModal = () => {
    if (showCookieConsent) return;
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setShowJobModal(true);
  };

  const submitComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim()) return;
    setIsSubmittingComment(true);
    try {
      await addDoc(collection(db, 'comments'), {
        userId: user.uid,
        userName: user.displayName || user.email,
        text: commentText,
        createdAt: serverTimestamp()
      });
      setCommentText("");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'comments');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const acceptCookies = () => {
    localStorage.setItem('cookie-consent', 'true');
    setShowCookieConsent(false);
  };

  const stats = [
    { label: t.stats.years, value: "16+", subLabel: "(POKIB HA PHHKY)" },
    { label: t.stats.clients, value: "70+", subLabel: "(PERMANENT CUSTOMER)" },
    { label: t.stats.workers, value: "1850+", subLabel: "(EMPLOYEETS)" }
  ];

  const jobs = [
    { title: lang === 'ua' ? "Водії автомобілі..." : "Delivery Drivers...", location: "Local, Local", maps: [1, 2] },
    { title: lang === 'ua' ? "Робітник сортування..." : "Sorting Worker...", location: "Local, Local", maps: [1, 2] },
    { title: lang === 'ua' ? "Прибиральник" : "Cleaner", location: "Local, Local", maps: [1, 2] },
    { title: lang === 'ua' ? "Контрактор" : "Contractor", location: "Local, Local", maps: [1, 2] }
  ];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      <div className="min-h-screen flex flex-col font-sans">
        {/* Top Bar */}
        <div className="bg-slate-50 border-b border-slate-200 py-1 hidden sm:block">
          <div className="container flex justify-end items-center gap-6 text-[11px] text-slate-500 uppercase tracking-wider font-medium">
            <div 
              className="flex items-center gap-2 cursor-pointer hover:text-[var(--color-primary)] transition-colors"
              onClick={() => setLang(lang === 'ua' ? 'en' : 'ua')}
            >
              <span className="text-lg">{lang === 'ua' ? '🇺🇦' : '🇬🇧'}</span>
              <span>{lang.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-1.5 cursor-pointer hover:text-[var(--color-primary)] transition-colors">
              <Phone size={12} className="text-[var(--color-accent)]" />
              <span>+380 800 100 59</span>
            </div>
              {user ? (
                 <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
                   <span className="text-slate-400 capitalize">Hi, {user.displayName?.split(' ')[0]}</span>
                   <button onClick={handleLogout} className="text-[var(--color-primary)] hover:text-red-500 transition-colors cursor-pointer">
                     <LogOut size={14} />
                   </button>
                 </div>
              ) : (
                <button 
                  onClick={() => setShowAuthModal(true)}
                  disabled={showCookieConsent}
                  className={`flex items-center gap-1.5 text-[var(--color-primary)] hover:text-[var(--color-accent)] transition-colors border-l border-slate-200 pl-6 ${showCookieConsent ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <LogIn size={12} />
                  <span>{t.auth.login}</span>
                </button>
              )}
          </div>
        </div>

        {/* Header */}
        <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
          <div className="container py-4 flex justify-between items-center">
            <Logo />
            
            <nav className="hidden lg:flex items-center gap-8">
              <NavLink href="#about">{t.nav.about}</NavLink>
              <NavLink href="#services">{t.nav.services}</NavLink>
              <NavLink href="#jobs">{t.nav.jobs}</NavLink>
              <NavLink href="#news">{t.nav.news}</NavLink>
              <NavLink href="#contact">{t.nav.contact}</NavLink>
            </nav>

            <div className="hidden lg:block">
               <button 
                onClick={toggleJobModal}
                className="bg-[var(--color-primary)] text-white px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg active:scale-95"
               >
                 <FileText size={14} />
                 {t.apply.title}
               </button>
            </div>

            <button 
              className="lg:hidden p-2 text-[var(--color-primary)]"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          <AnimatePresence>
            {isMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden bg-white border-t border-slate-100 overflow-hidden"
              >
                <div className="container py-6 flex flex-col gap-4">
                  <NavLink href="#about">{t.nav.about}</NavLink>
                  <NavLink href="#services">{t.nav.services}</NavLink>
                  <NavLink href="#jobs">{t.nav.jobs}</NavLink>
                  <NavLink href="#news">{t.nav.news}</NavLink>
                  <NavLink href="#contact">{t.nav.contact}</NavLink>
                  <button 
                    onClick={() => { toggleJobModal(); setIsMenuOpen(false); }}
                    className="w-full bg-[var(--color-primary)] text-white py-3 rounded uppercase font-bold text-sm mt-2"
                  >
                    {t.apply.title}
                  </button>
                  <button 
                    onClick={() => setLang(lang === 'ua' ? 'en' : 'ua')}
                    className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mt-4"
                  >
                    <Globe size={14}/> {lang === 'ua' ? 'English' : 'Українська'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Hero Section */}
        <section className="bg-[var(--color-primary)] relative overflow-hidden">
          <div className="container py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="z-10"
            >
              <h1 className="text-3xl lg:text-5xl font-bold text-white mb-6 uppercase leading-tight">
                {t.hero.title} <br />
                <span className="text-[var(--color-accent)]">{t.hero.accent}</span> <br />
                {t.hero.sub}
              </h1>
              <div className="flex flex-wrap gap-4 mt-8">
                <button className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-light)] text-[var(--color-primary)] font-bold px-8 py-3 rounded uppercase transition-all shadow-[0_4px_0_0_#b5962f] active:shadow-none active:translate-y-1">
                  {t.hero.forFirms}
                </button>
                <button className="bg-transparent border-2 border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 font-bold px-8 py-3 rounded uppercase transition-all">
                  {t.hero.forStaff}
                </button>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative lg:h-[400px] flex justify-center"
            >
              <div className="w-full h-full bg-slate-800/30 rounded-2xl flex items-center justify-center overflow-hidden border border-white/10 backdrop-blur-sm shadow-2xl">
                <img 
                  src="https://picsum.photos/seed/recruitment-team-v2/800/600" 
                  alt="Professional Team"
                  className="w-full h-full object-cover opacity-80"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-primary)]/60 to-transparent" />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="bg-white py-12 lg:py-0 relative z-20">
          <div className="container lg:-translate-y-12">
            <div className="bg-white rounded-xl shadow-2xl shadow-slate-200/50 p-6 lg:p-10 border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-12">
              {stats.map((stat, idx) => (
                <div key={idx} className="flex flex-col items-center text-center group w-full">
                  <div className="mb-4 p-4 bg-slate-50 rounded-full text-[var(--color-accent)] group-hover:scale-110 group-hover:bg-[var(--color-accent)] group-hover:text-white transition-all duration-300">
                    {idx === 0 ? <Clock size={32} /> : idx === 1 ? <Users size={32} /> : <Briefcase size={32} />}
                  </div>
                  <div className="text-4xl lg:text-5xl font-black text-[var(--color-primary)] mb-1 tracking-tight">{stat.value}</div>
                  <div className="text-sm font-bold text-slate-800 uppercase tracking-wide">{stat.label}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{stat.subLabel}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Active Jobs */}
        <section id="jobs" className="py-16 bg-slate-50">
          <div className="container">
            <div className="flex items-center gap-3 mb-12">
              <h2 className="text-2xl font-black text-[var(--color-primary)] uppercase tracking-tight">
                {t.jobs.title} <span className="text-slate-400 font-normal ml-2">{t.jobs.active}</span>
              </h2>
              <div className="h-0.5 flex-1 bg-slate-200 hidden sm:block" />
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {jobs.map((job, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-100 group cursor-pointer"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-[var(--color-primary)] group-hover:text-[var(--color-accent)] transition-colors">
                          {job.title}
                        </h3>
                        <div className="flex items-center gap-1 text-slate-400 mt-1">
                          <MapPin size={14} className="text-[var(--color-accent)]" />
                          <span className="text-sm font-medium">{job.location}</span>
                        </div>
                      </div>
                      <button className="text-slate-300 hover:text-[var(--color-accent)] transition-colors p-2 bg-slate-50 rounded-lg group-hover:bg-[var(--color-accent)]/10">
                        <ExternalLink size={20} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      {job.maps.map((m, midx) => (
                        <div key={midx} className="relative aspect-video rounded-lg overflow-hidden bg-slate-200 border border-slate-100">
                          <img 
                            src={`https://picsum.photos/seed/map-rec-${idx}-${midx}/400/250`} 
                            alt="Map snippet"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        {t.jobs.new}
                      </span>
                      <span className="text-[var(--color-accent)]">ID: {1000 + idx}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section id="contact" className="py-20 bg-white">
          <div className="container">
            <div className="flex flex-col lg:flex-row gap-16 items-center">
              <div className="flex-1 w-full relative">
                 <div className="flex items-center gap-3 mb-10">
                  <h2 className="text-2xl font-black text-[var(--color-primary)] uppercase tracking-tight">
                    {lang === 'ua' ? 'КАРТА ФІЛІЙ' : 'BRANCH MAP'}
                  </h2>
                </div>
                
                <div className="relative aspect-[4/3] bg-slate-50 rounded-3xl p-10 border border-slate-100 group shadow-inner flex items-center justify-center">
                  <div className="text-center">
                     <Logo />
                     <p className="text-slate-400 text-xs mt-4 uppercase tracking-[0.3em]">Interactive Map</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                  <div className="space-y-4">
                     <div className="flex items-center gap-3 text-[var(--color-primary)] font-black text-base uppercase tracking-tight text-left">
                        <div className="w-3 h-3 rounded-full bg-[var(--color-accent)]" />
                        <span>Centrária: Praha</span>
                     </div>
                     <div className="space-y-2.5 text-left">
                      {["Progka", "Brno", "Ossrava", "Plzeň", "Pojiz"].map((loc, i) => (
                        <div key={i} className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase">
                           <ChevronRight size={14} className="text-[var(--color-accent)]" /> Робобка: {loc}
                        </div>
                      ))}
                     </div>
                  </div>
                </div>

                <div className="mt-14 p-8 bg-[var(--color-primary)] rounded-3xl text-white shadow-2xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[var(--color-accent)] flex items-center justify-center text-[var(--color-primary)]">
                       <Phone size={28} />
                    </div>
                    <div className="text-3xl font-black tracking-tight">+380 800 100 59</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section className="py-20 bg-slate-50 border-t border-slate-100">
          <div className="container">
             <div className="flex items-center gap-3 mb-12">
              <h2 className="text-2xl font-black text-[var(--color-primary)] uppercase tracking-tight flex items-center gap-3">
                <MessageSquare size={28} className="text-[var(--color-accent)]" /> 
                {t.reviews.title}
              </h2>
            </div>

            <div className="grid lg:grid-cols-3 gap-12">
              {/* Review Form */}
              <div className="lg:col-span-1">
                <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm sticky top-24">
                  <h3 className="text-lg font-bold text-[var(--color-primary)] mb-6 uppercase tracking-wide">
                    {t.reviews.write}
                  </h3>
                  {user ? (
                    <form onSubmit={submitComment} className="space-y-4 text-left">
                      <div>
                        <input 
                          type="text" 
                          disabled
                          value={user.displayName || user.email || ""} 
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-500"
                        />
                      </div>
                      <textarea 
                        required
                        disabled={showCookieConsent}
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder={showCookieConsent ? t.cookies.required : t.reviews.textPlaceholder}
                        rows={4}
                        className={`w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all shadow-inner ${showCookieConsent ? 'opacity-50 cursor-not-allowed' : ''}`}
                      />
                      <button 
                        disabled={isSubmittingComment || !commentText.trim() || showCookieConsent}
                        className="w-full bg-[var(--color-primary)] text-white py-3 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
                      >
                        {isSubmittingComment ? "..." : <><Send size={14}/> {t.reviews.submit}</>}
                      </button>
                    </form>
                  ) : (
                    <div className="text-center py-6">
                       <p className="text-slate-500 text-sm mb-6">Будь ласка, увійдіть, щоб залишити відгук</p>
                       <button 
                        onClick={() => setShowAuthModal(true)}
                        className="bg-slate-900 text-white px-8 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-[var(--color-accent)] transition-all shadow-lg active:scale-95"
                       >
                         {t.auth.login}
                       </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Review List */}
              <div className="lg:col-span-2 space-y-6">
                {comments.length === 0 ? (
                  <div className="bg-white/50 border border-dashed border-slate-200 p-12 rounded-2xl text-center text-slate-400">
                     No reviews yet. Be the first!
                  </div>
                ) : (
                  <div className="columns-1 md:columns-2 gap-6 space-y-6">
                    {comments.map((review) => (
                      <motion.div 
                        key={review.id}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="break-inside-avoid bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group text-left"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center text-[var(--color-accent)] font-bold">
                            {review.userName?.[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-[var(--color-primary)] text-sm">{review.userName}</div>
                            <div className="text-[10px] text-slate-400 uppercase tracking-widest">
                               {review.createdAt?.toDate ? new Date(review.createdAt.toDate()).toLocaleDateString() : 'New'}
                            </div>
                          </div>
                        </div>
                        <p className="text-slate-600 text-sm leading-relaxed italic">"{review.text}"</p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-slate-900 pt-20 pb-10 text-white mt-auto">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 pb-16 border-b border-slate-800">
              <div className="col-span-1 md:col-span-2 space-y-6 text-left">
                <Logo />
                <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
                   Konstanta s.r.o. — {lang === 'ua' ? 'провідне кадрове агентство' : 'leading recruitment agency'}.
                </p>
              </div>
              <div className="text-left">
                <h4 className="font-bold uppercase text-xs tracking-[0.2em] text-[var(--color-accent)] mb-6">{t.nav.contact}</h4>
                <ul className="space-y-4 text-sm text-slate-400">
                  <li className="flex items-center gap-2"><Phone size={14}/> +380 800 100 59</li>
                  <li className="flex items-center gap-2"><MapPin size={14}/> Praha, Czech Republic</li>
                </ul>
              </div>
            </div>
            <div className="text-center text-[10px] text-slate-500 uppercase tracking-widest">
              © 2026 KONSTANTA s.r.o.
            </div>
          </div>
        </footer>

        {/* --- Modals & Banners --- */}

        {/* Auth Modal */}
        <AnimatePresence>
          {showAuthModal && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={() => setShowAuthModal(false)}
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl w-full max-w-md p-10 relative z-10 shadow-2xl"
              >
                <button onClick={() => setShowAuthModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors"><X size={24}/></button>
                <div className="text-center mb-10">
                   <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6 text-[var(--color-primary)]">
                      <LogIn size={40} />
                   </div>
                   <h2 className="text-2xl font-black text-[var(--color-primary)] uppercase tracking-tight">{t.auth.login}</h2>
                   <p className="text-slate-400 text-sm mt-2">
                     {showCookieConsent ? t.cookies.required : "Login with your account to proceed"}
                   </p>
                </div>
                <button 
                  onClick={handleLogin}
                  disabled={showCookieConsent}
                  className={`w-full flex items-center justify-center gap-4 py-4 rounded-xl font-bold transition-all shadow-xl active:scale-95 ${showCookieConsent ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-black'}`}
                >
                   <img src="https://www.google.com/favicon.ico" className={`w-5 h-5 ${showCookieConsent ? 'grayscale' : ''}`} alt="Google" />
                   Login with Google
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Job Application Modal */}
        <AnimatePresence>
          {showJobModal && <JobApplicationModal onClose={() => setShowJobModal(false)} />}
        </AnimatePresence>

        {/* Cookie Consent Banner */}
        <AnimatePresence>
          {showCookieConsent && (
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="fixed bottom-6 left-6 right-6 lg:left-auto lg:w-96 z-[999]"
            >
              <div className="bg-white p-6 rounded-2xl shadow-2xl border border-slate-100 flex items-center justify-between gap-6">
                <p className="text-xs text-slate-600 leading-relaxed font-medium text-left">
                   {t.cookies.text}
                </p>
                <button 
                  onClick={acceptCookies}
                  className="bg-[var(--color-primary)] text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shrink-0"
                >
                  {t.cookies.accept}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LanguageContext.Provider>
  );
}

// --- Sub-Components ---

function JobApplicationModal({ onClose }: { onClose: () => void }) {
  const { t, lang } = useTranslation();
  const [step, setStep] = useState(1);
  const [phonePrefix, setPhonePrefix] = useState("+380");
  const [phoneBody, setPhoneBody] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: auth.currentUser?.email || "",
    profession: "",
    comment: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const professions = lang === 'ua' 
    ? ["Водій", "Прибиральник", "Сортувальник", "Контрактор", "Інше"]
    : ["Driver", "Cleaner", "Sorter", "Contractor", "Other"];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'applications'), {
        ...formData,
        phone: `${phonePrefix} ${phoneBody}`,
        userId: auth.currentUser?.uid || null,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      setStep(2);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'applications');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-[var(--color-primary)]/80 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div 
        initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
        className="bg-white rounded-[2.5rem] w-full max-w-xl overflow-hidden relative z-10 shadow-3xl"
      >
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-colors">
          <X size={28} />
        </button>

        <div className="p-12 overflow-y-auto max-h-[90vh]">
          {step === 1 ? (
             <div className="text-left">
               <div className="mb-10">
                 <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-[var(--color-accent)] mb-6">
                   <FileText size={32} />
                 </div>
                 <h2 className="text-3xl font-black text-[var(--color-primary)] uppercase tracking-tight">{t.apply.title}</h2>
                 <p className="text-slate-400 mt-2 font-medium">{t.apply.subtitle}</p>
               </div>

               <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="grid sm:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">{t.apply.name}</label>
                     <input 
                      required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all outline-none"
                    />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">{t.apply.email}</label>
                     <input 
                      required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all outline-none"
                    />
                   </div>
                 </div>

                 <div className="grid sm:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">{t.apply.phone}</label>
                     <div className="flex gap-2">
                        <select 
                          value={phonePrefix}
                          onChange={(e) => setPhonePrefix(e.target.value)}
                          className="bg-slate-50 border border-slate-100 rounded-xl px-2 py-3 text-sm focus:bg-white transition-all outline-none font-bold text-[var(--color-primary)]"
                        >
                          <option value="+380">🇺🇦 {t.countries.ua} (+380)</option>
                          <option value="+420">🇨🇿 {t.countries.cz} (+420)</option>
                        </select>
                        <input 
                          required 
                          type="tel"
                          placeholder="00 000 0000"
                          value={phoneBody} 
                          onChange={e => setPhoneBody(e.target.value.replace(/[^0-9 ]/g, ""))}
                          className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all outline-none"
                        />
                     </div>
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">{t.apply.profession}</label>
                     <select 
                      required value={formData.profession} onChange={e => setFormData({...formData, profession: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all outline-none"
                     >
                       <option value="">{lang === 'ua' ? 'Оберіть...' : 'Select...'}</option>
                       {professions.map(p => <option key={p} value={p}>{p}</option>)}
                     </select>
                   </div>
                 </div>

                 <div className="space-y-2">
                   <label className="text-[10px] uppercase font-bold tracking-widest text-slate-400 ml-1">{t.apply.comment}</label>
                   <textarea 
                    value={formData.comment} onChange={e => setFormData({...formData, comment: e.target.value})}
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 text-sm focus:bg-white focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all outline-none"
                  />
                 </div>

                 <button 
                  disabled={isSubmitting}
                  className="w-full bg-[var(--color-primary)] text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-sm hover:translate-y-[-2px] transition-all shadow-xl active:scale-95 disabled:opacity-50"
                 >
                   {isSubmitting ? "..." : t.apply.submit}
                 </button>
               </form>
             </div>
          ) : (
            <div className="text-center py-20 px-4">
               <motion.div 
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-10 text-green-500"
               >
                 <CheckCircle2 size={48} />
               </motion.div>
               <h2 className="text-2xl font-black text-[var(--color-primary)] uppercase tracking-tight mb-4">{t.apply.success}</h2>
               <p className="text-slate-400 mb-12">We will get back to you soon.</p>
               <button 
                onClick={onClose}
                className="bg-[var(--color-primary)] text-white px-12 py-4 rounded-xl font-bold uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-all"
               >
                 OK
               </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
