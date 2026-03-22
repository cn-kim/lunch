import { useState, useEffect, useCallback } from "react";

function seededRandom(seed) {
  let s = seed >>> 0;
  s = (s ^ (s << 13)) >>> 0;
  s = (s ^ (s >> 7)) >>> 0;
  s = (s ^ (s << 17)) >>> 0;
  return (s >>> 0) / 0xFFFFFFFF;
}
function getTodaySeed() {
  const d = new Date();
  return parseInt(`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`);
}
function getMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}
function getAvailablePool(pool, used) {
  const remaining = pool.filter(r => !used.includes(r));
  return remaining.length > 0 ? remaining : pool;
}
function pick(pool, seed) {
  if (!pool.length) return null;
  return pool[Math.floor(seededRandom(seed) * pool.length)];
}
function isWeekday() { const d = new Date().getDay(); return d >= 1 && d <= 5; }
function isRevealed() {
  const n = new Date();
  return n.getHours() > 12 || (n.getHours() === 12 && n.getMinutes() >= 15);
}
function getCountdown() {
  const now = new Date(), rev = new Date();
  rev.setHours(12, 15, 0, 0);
  const diff = rev - now;
  if (diff <= 0) return null;
  return { h: Math.floor(diff/3600000), m: Math.floor((diff%3600000)/60000), s: Math.floor((diff%60000)/1000) };
}
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function formatMonthYear(y, m) {
  return new Date(y, m, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

const DEFAULT_POOL = ["Tartine Manufactory", "The Slanted Door", "Zuni Cafe", "Burma Superstar", "Nopa"];

const WAITING_PHRASES = [
  ["Hungry?", "Not yet. Please pretend to work."],
  ["The restaurants are nervous.", "The algorithm hasn't decided yet."],
  ["Your stomach is not in charge here.", "12:15 is."],
  ["Somewhere, a chef is unaware", "they're about to be chosen."],
  ["Not lunch yet.", "Please act like everything is fine."],
  ["The suspense is real.", "So is the hunger. Hang tight."],
  ["Eyes on the screen.", "Lunch is still a ways away."],
  ["Good things come to those who wait.", "Today, the good thing is lunch."],
  ["You could grab a snack.", "Or you could have patience. Your call."],
  ["The algorithm is thinking.", "Very deeply. Very seriously."],
  ["Almost there.", "Just kidding, not really. Keep working."],
  ["A watched calendar never hits 12:15.", "Look away. Come back later."],
];

const DELETE_PHRASES = [
  ["Removing this place forever.", "Was it really that bad?"],
  ["This restaurant will vanish from the pool.", "Are you sure it deserves exile?"],
  ["Someone had a bad lunch, we see.", "No going back after this."],
  ["Erasing it from history.", "The team will never know it existed."],
  ["A bold move.", "Are you absolutely certain?"],
  ["Once it's gone, it's gone.", "Still want to do this?"],
  ["Quietly letting it go.", "It didn't even get a farewell."],
  ["The pool will be a little smaller.", "Is this really what the team wants?"],
];

const W = {
  bg: "#F7F4EE", ink: "#2A2520", muted: "#9B9185",
  rule: "#C8C0B0", ruleLight: "#DDD8CF", serif: "Georgia, 'Times New Roman', serif",
  holidayBg: "#F5EFE0", holidayInk: "#7A5C2A",
};

function MiniCalendar({ year, month, holidays, onToggle, onPrevMonth, onNextMonth }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const dow = ["Su","Mo","Tu","We","Th","Fr","Sa"];

  return (
    <div style={{ userSelect: "none" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <button onClick={onPrevMonth} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: W.muted, padding: "0 6px" }}>&#8249;</button>
        <p style={{ fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", color: W.ink, margin: 0 }}>{formatMonthYear(year, month)}</p>
        <button onClick={onNextMonth} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: W.muted, padding: "0 6px" }}>&#8250;</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "3px", marginBottom: "4px" }}>
        {dow.map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: "10px", color: W.rule, letterSpacing: "0.06em", padding: "2px 0" }}>{d}</div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={`e${i}`} />;
          const key = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
          const isHol = !!holidays[key];
          const isSat = (i % 7) === 6;
          const isSun = (i % 7) === 0;
          const isWknd = isSat || isSun;
          const todayDate = new Date(); todayDate.setHours(0,0,0,0);
          const cellDate = new Date(year, month, d); cellDate.setHours(0,0,0,0);
          const isPast = cellDate < todayDate;
          const isToday = key === todayKey();
          return (
            <div key={key} onClick={() => !isWknd && onToggle(key)}
              style={{
                textAlign: "center", fontSize: "12px", padding: "5px 2px",
                borderRadius: "4px", cursor: isWknd ? "default" : "pointer",
                background: isHol ? W.holidayBg : isToday ? "#EDE8DF" : "transparent",
                color: isWknd ? W.rule : isHol ? W.holidayInk : isPast ? W.rule : W.ink,
                fontWeight: isToday ? 500 : 400,
                border: isToday ? `0.5px solid ${W.rule}` : "0.5px solid transparent",
                transition: "background 0.15s",
              }}>
              {d}
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: "12px", marginTop: "8px", fontSize: "11px", color: W.rule }}>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "2px", background: W.holidayBg, border: `0.5px solid ${W.rule}` }} />Holiday
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "2px", border: `0.5px solid ${W.rule}` }} />Today
        </span>
      </div>
    </div>
  );
}

export default function App() {
  const [pool, setPool] = useState([]);
  const [usedThisMonth, setUsedThisMonth] = useState([]);
  const [holidays, setHolidays] = useState({});
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [holName, setHolName] = useState("");
  const [pendingDate, setPendingDate] = useState(null);
  const [view, setView] = useState("calendar");
  const [revealed, setRevealed] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [justAdded, setJustAdded] = useState("");
  const [err, setErr] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deletePhrase, setDeletePhrase] = useState([]);
  const [waitingPhrase, setWaitingPhrase] = useState(null);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());

  const now = new Date();
  const day = now.getDate();
  const weekday = now.toLocaleDateString("en-US", { weekday: "long" });
  const monthYear = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const seed = getTodaySeed();
  const isToday_weekday = isWeekday();
  const todayHoliday = holidays[todayKey()];
  const availablePool = getAvailablePool(pool, usedThisMonth);
  const restaurant = pick(availablePool, seed);

  const isWaitingWindow = () => {
    const h = now.getHours(), m = now.getMinutes();
    return isWeekday() && !holidays[todayKey()] && (h === 10 || h === 11 || (h === 12 && m < 15));
  };

  useEffect(() => {
    async function load() {
      try {
        const rp = await window.storage.get("lunch-pool", true);
        setPool(rp ? JSON.parse(rp.value) : DEFAULT_POOL);
      } catch { setPool(DEFAULT_POOL); }
      try {
        const ru = await window.storage.get(`lunch-used-${getMonthKey()}`, true);
        setUsedThisMonth(ru ? JSON.parse(ru.value) : []);
      } catch { setUsedThisMonth([]); }
      try {
        const rh = await window.storage.get("lunch-holidays", true);
        setHolidays(rh ? JSON.parse(rh.value) : {});
      } catch { setHolidays({}); }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!isToday_weekday || todayHoliday) return;
    const rev = isRevealed();
    if (rev && !revealed) { setFadeIn(true); setTimeout(() => { setRevealed(true); setFadeIn(false); }, 700); }
    else if (rev) setRevealed(true);
  }, []);

  useEffect(() => {
    if (!isWaitingWindow()) return;
    const pickPhrase = () => setWaitingPhrase(WAITING_PHRASES[Math.floor(Math.random() * WAITING_PHRASES.length)]);
    pickPhrase();
    const t = setInterval(pickPhrase, 60 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!isToday_weekday || todayHoliday || !revealed || !restaurant) return;
    if (!usedThisMonth.includes(restaurant)) recordUsed(restaurant);
  }, [revealed]);

  const savePool = useCallback(async (p) => {
    try { await window.storage.set("lunch-pool", JSON.stringify(p), true); } catch {}
  }, []);

  const recordUsed = useCallback(async (r) => {
    const updated = [...usedThisMonth, r];
    setUsedThisMonth(updated);
    try { await window.storage.set(`lunch-used-${getMonthKey()}`, JSON.stringify(updated), true); } catch {}
  }, [usedThisMonth]);

  const saveHolidays = useCallback(async (h) => {
    try { await window.storage.set("lunch-holidays", JSON.stringify(h), true); } catch {}
  }, []);

  const addRestaurant = () => {
    const name = input.trim();
    if (!name || pool.map(x => x.toLowerCase()).includes(name.toLowerCase())) {
      setErr(true); setTimeout(() => setErr(false), 400); return;
    }
    const p = [...pool, name];
    setPool(p); savePool(p);
    setInput(""); setJustAdded(name);
    setTimeout(() => setJustAdded(""), 2500);
  };

  const deleteRestaurant = (name) => {
    const p = pool.filter(r => r !== name);
    setPool(p); savePool(p);
    setConfirmDelete(null);
  };

  const toggleHoliday = (key) => {
    if (holidays[key]) {
      const h = { ...holidays }; delete h[key];
      setHolidays(h); saveHolidays(h); setPendingDate(null);
    } else {
      setPendingDate(key); setHolName("");
    }
  };

  const confirmHoliday = () => {
    const name = holName.trim() || "Holiday";
    const h = { ...holidays, [pendingDate]: name };
    setHolidays(h); saveHolidays(h);
    setPendingDate(null); setHolName("");
  };

  const removeHoliday = (key) => {
    const h = { ...holidays }; delete h[key];
    setHolidays(h); saveHolidays(h);
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", background: W.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ fontSize: "13px", color: W.muted, fontFamily: W.serif }}>...</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: W.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem 1.5rem", fontFamily: "var(--font-sans)", position: "relative" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-5px)} 75%{transform:translateX(5px)} }
        .washi-input{background:transparent;border:none;border-bottom:0.5px solid ${W.rule};border-radius:0;font-size:15px;color:${W.ink};font-family:Georgia,serif;padding:8px 0;width:100%;outline:none;letter-spacing:0.02em;}
        .washi-input::placeholder{color:${W.rule};}
        .washi-input:focus{border-bottom-color:${W.muted};}
        .nav-link{background:none;border:none;cursor:pointer;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:${W.muted};font-family:var(--font-sans);padding:4px 8px;transition:color 0.2s;}
        .nav-link:hover{color:${W.ink};}
        .nav-link.active{color:${W.ink};border-bottom:0.5px solid ${W.ink};}
        .add-btn{background:none;border:none;cursor:pointer;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:${W.muted};font-family:var(--font-sans);padding:6px 0;transition:color 0.2s;}
        .add-btn:hover{color:${W.ink};}
        .pool-item{font-size:14px;color:${W.muted};padding:10px 0;border-bottom:0.5px solid ${W.ruleLight};font-family:Georgia,serif;display:flex;align-items:center;justify-content:space-between;}
        .hol-item{display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:0.5px solid ${W.ruleLight};}
        .hol-remove{background:none;border:none;cursor:pointer;font-size:11px;color:${W.rule};letter-spacing:0.08em;text-transform:uppercase;font-family:var(--font-sans);transition:color 0.2s;}
        .hol-remove:hover{color:${W.ink};}
      `}</style>

      <nav style={{ display: "flex", gap: "24px", marginBottom: "3rem" }}>
        <button className={`nav-link${view==="calendar"?" active":""}`} onClick={() => setView("calendar")}>Today</button>
        <button className={`nav-link${view==="holidays"?" active":""}`} onClick={() => setView("holidays")}>Holidays</button>
        <button className={`nav-link${view==="submit"?" active":""}`} onClick={() => setView("submit")}>Pool</button>
      </nav>

      {view === "calendar" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: "320px" }}>
          <p style={{ fontSize: "11px", letterSpacing: "0.18em", color: W.muted, textTransform: "uppercase", marginBottom: "6px" }}>{weekday}</p>
          <p style={{ fontSize: "80px", fontWeight: 400, color: W.ink, lineHeight: 1, fontFamily: W.serif, marginBottom: "4px" }}>{day}</p>
          <p style={{ fontSize: "12px", letterSpacing: "0.14em", color: W.muted, textTransform: "uppercase", marginBottom: "40px" }}>{monthYear}</p>

          {!isToday_weekday ? (
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "10px", letterSpacing: "0.16em", color: W.rule, textTransform: "uppercase", marginBottom: "8px" }}>Weekend</p>
              <p style={{ fontSize: "15px", color: W.muted, fontFamily: W.serif }}>Back on Monday</p>
            </div>
          ) : todayHoliday ? (
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "10px", letterSpacing: "0.16em", color: W.rule, textTransform: "uppercase", marginBottom: "10px" }}>Holiday</p>
              <p style={{ fontSize: "22px", fontWeight: 400, color: W.holidayInk, fontFamily: W.serif, lineHeight: 1.3, animation: "fadeUp 0.6s ease both" }}>{todayHoliday}</p>
              <p style={{ fontSize: "12px", color: W.rule, marginTop: "10px", fontStyle: "italic", fontFamily: W.serif }}>No lunch draw today.</p>
            </div>
          ) : revealed || fadeIn ? (
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "10px", letterSpacing: "0.16em", color: W.rule, textTransform: "uppercase", marginBottom: "10px" }}>Today's pick</p>
              {pool.length > 0
                ? <p style={{ fontSize: "22px", fontWeight: 400, color: W.ink, fontFamily: W.serif, lineHeight: 1.3, opacity: fadeIn ? 0 : 1, transition: "opacity 0.7s ease", animation: revealed && !fadeIn ? "fadeUp 0.6s ease both" : "none" }}>{restaurant}</p>
                : <p style={{ fontSize: "14px", color: W.muted, fontFamily: W.serif }}>The pool is empty.</p>
              }
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "10px", letterSpacing: "0.16em", color: W.rule, textTransform: "uppercase", marginBottom: isWaitingWindow() ? "24px" : "0" }}>Reveals at 12:15</p>
              {isWaitingWindow() && waitingPhrase && (
                <div style={{ animation: "fadeUp 0.6s ease both" }}>
                  <p style={{ fontSize: "15px", fontFamily: W.serif, color: W.ink, marginBottom: "6px" }}>{waitingPhrase[0]}</p>
                  <p style={{ fontSize: "13px", fontFamily: W.serif, color: W.muted, fontStyle: "italic", lineHeight: 1.6 }}>{waitingPhrase[1]}</p>
                </div>
              )}
            </div>
          )}

          <p style={{ fontSize: "11px", color: W.rule, letterSpacing: "0.08em", marginTop: "48px" }}>{availablePool.length} of {pool.length} remaining this month</p>
          {availablePool.length < 3 && pool.length > 0 && (
            <div style={{ textAlign: "center", marginTop: "12px", animation: "fadeUp 0.5s ease both" }}>
              <p style={{ fontSize: "13px", fontFamily: W.serif, color: W.muted, fontStyle: "italic", lineHeight: 1.6, marginBottom: "6px" }}>
                {availablePool.length === 0 ? "The pool has run dry." : availablePool.length === 1 ? "Only one restaurant left. Living dangerously." : "Running low. The options are getting lonely."}
              </p>
              <button onClick={() => setView("submit")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", letterSpacing: "0.1em", textTransform: "uppercase", color: W.muted, fontFamily: "var(--font-sans)", borderBottom: `0.5px solid ${W.rule}`, padding: "0 0 1px", transition: "color 0.2s" }}
                onMouseEnter={e => e.target.style.color = W.ink}
                onMouseLeave={e => e.target.style.color = W.muted}>
                Add more restaurants
              </button>
            </div>
          )}
        </div>
      )}

      {view === "holidays" && (
        <div style={{ width: "100%", maxWidth: "340px", animation: "fadeUp 0.4s ease both" }}>
          <p style={{ fontSize: "10px", letterSpacing: "0.16em", color: W.muted, textTransform: "uppercase", marginBottom: "24px", textAlign: "center" }}>Holidays</p>
          <MiniCalendar
            year={calYear} month={calMonth} holidays={holidays}
            onToggle={toggleHoliday}
            onPrevMonth={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y-1); } else setCalMonth(m => m-1); }}
            onNextMonth={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y+1); } else setCalMonth(m => m+1); }}
          />
          {pendingDate && (
            <div style={{ marginTop: "20px", padding: "14px 16px", background: W.holidayBg, borderRadius: "8px", border: `0.5px solid ${W.rule}` }}>
              <p style={{ fontSize: "11px", color: W.holidayInk, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "10px" }}>
                {new Date(pendingDate+"T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
              <input className="washi-input" placeholder="Holiday name..." value={holName} onChange={e => setHolName(e.target.value)} onKeyDown={e => e.key === "Enter" && confirmHoliday()} style={{ fontSize: "14px", color: W.holidayInk }} autoFocus />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
                <button className="add-btn" onClick={() => setPendingDate(null)} style={{ color: W.rule }}>Cancel</button>
                <button className="add-btn" onClick={confirmHoliday}>Save</button>
              </div>
            </div>
          )}
          <div style={{ marginTop: "24px", borderTop: `0.5px solid ${W.ruleLight}` }}>
            <p style={{ fontSize: "10px", letterSpacing: "0.14em", textTransform: "uppercase", color: W.rule, margin: "12px 0 8px" }}>Scheduled</p>
            {Object.entries(holidays).length === 0
              ? <p style={{ fontSize: "13px", color: W.rule, fontFamily: W.serif, fontStyle: "italic", padding: "8px 0" }}>No holidays set.</p>
              : Object.entries(holidays).sort(([a],[b]) => a.localeCompare(b)).map(([key, name]) => (
                <div key={key} className="hol-item">
                  <div>
                    <p style={{ fontSize: "13px", fontFamily: W.serif, color: W.holidayInk, margin: 0 }}>{name}</p>
                    <p style={{ fontSize: "11px", color: W.rule, margin: "2px 0 0" }}>
                      {new Date(key+"T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <button className="hol-remove" onClick={() => removeHoliday(key)}>Remove</button>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {view === "submit" && (
        <div style={{ width: "100%", maxWidth: "320px", animation: "fadeUp 0.4s ease both" }}>
          <p style={{ fontSize: "10px", letterSpacing: "0.16em", color: W.muted, textTransform: "uppercase", marginBottom: "24px", textAlign: "center" }}>Lunch pool</p>
          <div style={{ marginBottom: "8px", animation: err ? "shake 0.35s ease" : "none" }}>
            <input className="washi-input" placeholder="Add a restaurant..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addRestaurant()} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
            <p style={{ fontSize: "12px", color: "#A5C99A", minHeight: "16px", fontFamily: W.serif, fontStyle: "italic" }}>{justAdded ? `"${justAdded}" added.` : ""}</p>
            <button className="add-btn" onClick={addRestaurant}>Add</button>
          </div>
          <div style={{ borderTop: `0.5px solid ${W.ruleLight}` }}>
            {pool.length === 0
              ? <p style={{ fontSize: "13px", color: W.rule, padding: "20px 0", textAlign: "center", fontFamily: W.serif, fontStyle: "italic" }}>Nothing here yet.</p>
              : pool.map((r, i) => (
                <div key={i} className="pool-item">
                  <span>{r}</span>
                  <button className="hol-remove" onClick={() => { setConfirmDelete(r); setDeletePhrase(DELETE_PHRASES[Math.floor(Math.random()*DELETE_PHRASES.length)]); }}>Remove</button>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {confirmDelete && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(42,37,32,0.35)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }} onClick={() => setConfirmDelete(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: W.bg, border: `0.5px solid ${W.rule}`, borderRadius: "12px", padding: "2rem", maxWidth: "300px", width: "100%", animation: "fadeUp 0.25s ease both", textAlign: "center" }}>
            <p style={{ fontSize: "13px", fontFamily: W.serif, color: W.muted, fontStyle: "italic", lineHeight: 1.6, marginBottom: "6px" }}>{deletePhrase[0]}</p>
            <p style={{ fontSize: "13px", fontFamily: W.serif, color: W.muted, fontStyle: "italic", lineHeight: 1.6, marginBottom: "20px" }}>{deletePhrase[1]}</p>
            <p style={{ fontSize: "18px", fontWeight: 400, color: W.ink, fontFamily: W.serif, marginBottom: "24px", lineHeight: 1.3 }}>"{confirmDelete}"</p>
            <div style={{ display: "flex", justifyContent: "center", gap: "28px" }}>
              <button className="add-btn" onClick={() => setConfirmDelete(null)} style={{ color: W.rule }}>Keep it</button>
              <button className="add-btn" onClick={() => deleteRestaurant(confirmDelete)} style={{ color: W.ink }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
