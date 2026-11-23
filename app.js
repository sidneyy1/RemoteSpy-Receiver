// ─── CONFIG ───────────────────────────────────────────────
const SUPABASE_URL = "https://tbpxzmnukhoqthdozbwj.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_RVfnZvDuGmyu22MmuPAn9A_JoaMh11a";
// ─────────────────────────────────────────────────────────

const feed = document.getElementById("feed");
const bootEl = document.getElementById("boot");
const filterInput = document.getElementById("filter");
const pauseBtn = document.getElementById("pauseBtn");
const clearBtn = document.getElementById("clearBtn");
const statusEl = document.getElementById("status");

function boot(msg) {
  if (bootEl) bootEl.textContent = msg;
  console.log("[boot]", msg);
}

// If the Supabase library itself failed to load, the old code died here
// silently and the feed stayed blank forever. Say so on screen instead.
if (!window.supabase) {
  boot("supabase-js failed to load (CDN blocked?) — check connection and hard-refresh");
  feed.innerHTML = `<div class="empty">supabase-js failed to load (CDN blocked?) — check connection and hard-refresh</div>`;
  throw new Error("supabase-js not loaded");
}

let sb;
try {
  sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (e) {
  const msg = e && e.message ? e.message : String(e);
  boot("createClient failed: " + msg);
  feed.innerHTML = `<div class="empty">createClient failed: ${escapeHtml(msg)}</div>`;
  throw e;
}
boot("supabase-js loaded — loading events…");

let paused = false;
let events = [];          // local cache for filter
let channel = null;

function formatArgs(args) {
  try {
    return JSON.stringify(args, null, 2);
  } catch {
    return String(args);
  }
}

function renderCard(row) {
  const card = document.createElement("div");
  card.className = "card";
  card.dataset.id = row.id;

  const dirClass = row.direction === "incoming" ? "in" : "out";
  const time = new Date(row.created_at).toLocaleTimeString();

  card.innerHTML = `
    <div class="meta">
      <span class="badge ${dirClass}">${row.method}</span>
      <span>${time}</span>
      <span>${row.caller || "—"}</span>
      <span>#${row.id}</span>
    </div>
    <div class="path">${escapeHtml(row.remote_path)}</div>
    <pre class="args">${escapeHtml(formatArgs(row.args))}</pre>
  `;
  return card;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function applyFilter() {
  const q = filterInput.value.trim().toLowerCase();
  feed.innerHTML = "";

  const filtered = q
    ? events.filter(e => {
        const blob = `${e.remote_path} ${e.method} ${e.direction} ${JSON.stringify(e.args)} ${e.caller || ""}`.toLowerCase();
        return blob.includes(q);
      })
    : events;

  if (filtered.length === 0) {
    feed.innerHTML = `<div class="empty">no events match</div>`;
    return;
  }

  // newest first
  filtered.slice().reverse().forEach(row => feed.appendChild(renderCard(row)));
}

function pushEvent(row) {
  events.push(row);
  if (events.length > 500) events.shift(); // keep last 500 in memory
  if (!paused) applyFilter();
}

async function loadRecent() {
  const { data, error } = await sb
    .from("remote_events")
    .select("*")
    .order("id", { ascending: false })
    .limit(100);

  if (error) {
    console.error(error);
    boot("load failed: " + error.message);
    feed.innerHTML = `<div class="empty">failed to load: ${error.message}</div>`;
    return;
  }

  events = (data || []).reverse(); // oldest → newest for push order
  boot("loaded " + events.length + " events — waiting for live…");
  applyFilter();
}

function startRealtime() {
  channel = sb
    .channel("remote_events_feed")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "remote_events" },
      (payload) => {
        if (!paused) pushEvent(payload.new);
        else events.push(payload.new);
      }
    )
    .subscribe((status) => {
      console.log("realtime:", status);
      boot("realtime: " + status + " — " + events.length + " events in view");
    });
}

pauseBtn.addEventListener("click", () => {
  paused = !paused;
  pauseBtn.textContent = paused ? "Resume" : "Pause";
  statusEl.textContent = paused ? "● PAUSED" : "● LIVE";
  statusEl.className = paused ? "paused" : "live";
  if (!paused) applyFilter();
});

clearBtn.addEventListener("click", () => {
  events = [];
  applyFilter();
});

filterInput.addEventListener("input", () => {
  if (!paused) applyFilter();
});

// boot
loadRecent().then(startRealtime);
