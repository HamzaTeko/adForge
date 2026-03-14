/**
 * AdForge Backend — server.js  v3.0  (Supabase Auth Edition)
 *
 * Every request carries the user's Supabase JWT in the Authorization header.
 * The backend verifies it with supabase.auth.getUser(token) — no sessions,
 * no cookies, no shared state between users. Every DB query is scoped to
 * req.userId so two different logins can NEVER see the same data.
 *
 * Endpoints:
 *   GET  /health
 *   GET  /auth/me                         — return this user's profile
 *   PUT  /auth/profile                    — update name / brand
 *   GET  /auth/meta/connect               — start Meta OAuth (token in query)
 *   GET  /auth/meta/callback              — exchange code, save to Supabase per user
 *   POST /auth/meta/disconnect            — remove Meta connection for this user
 *   GET  /auth/session                    — which platforms are connected for this user
 *   GET  /api/meta/accounts/:id/campaigns
 *   GET  /api/meta/accounts/:id/insights
 *   POST /api/meta/accounts/:id/creatives
 *   POST /api/copy/generate
 *   POST /api/copy/refine
 *   GET  /api/creatives
 *   DELETE /api/creatives/:id
 */
"use strict";
require("dotenv").config();

const express   = require("express");
const cors      = require("cors");
const axios     = require("axios");
const rateLimit = require("express-rate-limit");
const { createClient } = require("@supabase/supabase-js");

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Validate env vars ────────────────────────────────────────
const REQUIRED = [
  "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY",
  "FRONTEND_URL",
];
// Soft-required: warn but don't crash — features degrade gracefully
const SOFT_REQUIRED = ["META_APP_ID", "META_APP_SECRET", "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "FAL_API_KEY"];
const missing = REQUIRED.filter(v => !process.env[v]);
if (missing.length) {
  console.error("❌ Missing required env vars:", missing.join(", "));
  console.error("   Copy .env.example → .env and fill in all values.");
  process.exit(1);
}
const missingSoft = SOFT_REQUIRED.filter(v => !process.env[v]);
if (missingSoft.length) {
  console.warn("⚠️  Optional env vars not set (features will degrade):", missingSoft.join(", "));
}

// ── Supabase service-role client (bypasses RLS for server operations) ──
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ── Constants ────────────────────────────────────────────────
const META_BASE         = "https://graph.facebook.com/v19.0";
const BACKEND_URL       = process.env.BACKEND_URL || `http://localhost:${PORT}`;
const META_REDIRECT_URI = `${BACKEND_URL}/auth/meta/callback`;
const META_SCOPES       = "ads_read,ads_management,business_management,read_insights";
const INSIGHTS_FIELDS   = [
  "campaign_id","campaign_name","status","objective",
  "impressions","clicks","ctr","cpc","spend",
  "actions","action_values","date_start","date_stop",
].join(",");

// ── Middleware ───────────────────────────────────────────────
app.use(express.json({ limit: "4mb" }));
app.use(cors({
  origin:         process.env.FRONTEND_URL,
  credentials:    true,
  methods:        ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"],
}));
app.options("*", cors());

const apiLimiter  = rateLimit({ windowMs: 60_000, max: 60,  message: { error: "Rate limit exceeded — try again in a minute." } });
const copyLimiter = rateLimit({ windowMs: 60_000, max: 15,  message: { error: "Too many copy requests." } });
const authLimiter = rateLimit({ windowMs: 60_000, max: 30,  message: { error: "Too many auth requests." } });

// ── JWT Auth middleware ──────────────────────────────────────
// Verifies the Supabase JWT on every protected request.
// Sets req.userId for all downstream handlers.
async function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing Authorization: Bearer <token>" });
  }
  try {
    const { data: { user }, error } = await supabase.auth.getUser(header.slice(7));
    if (error || !user) return res.status(401).json({ error: "Invalid or expired token. Please log in again." });
    req.userId    = user.id;
    req.userEmail = user.email;
    next();
  } catch (e) {
    res.status(401).json({ error: "Token verification failed." });
  }
}

// ── DB helpers ───────────────────────────────────────────────
async function getMetaAccount(userId) {
  const { data } = await supabase
    .from("connected_accounts")
    .select("access_token, ad_account_ids, platform_user_id, account_name")
    .eq("user_id", userId)
    .eq("platform", "meta")
    .eq("status", "active")
    .single();
  return data || null;
}

async function upsertMetaAccount(userId, payload) {
  await supabase.from("connected_accounts").upsert({
    user_id:          userId,
    platform:         "meta",
    account_name:     payload.accountName,
    platform_user_id: payload.platformUserId,
    access_token:     payload.accessToken,
    ad_account_ids:   payload.adAccountIds,
    status:           "active",
    connected_at:     new Date().toISOString(),
  }, { onConflict: "user_id,platform" });
}

// Normalize Meta campaign for DB + frontend consumption
function normalizeCampaign(c, ins = {}) {
  const actions    = ins.actions || [];
  const purchases  = actions.find(a => a.action_type === "purchase") || {};
  const convValue  = (ins.action_values || []).find(a => a.action_type === "purchase") || {};
  const spend      = parseFloat(ins.spend || 0);
  const conv       = parseInt(purchases.value || 0, 10);
  const revenue    = parseFloat(convValue.value || 0);
  const roas       = spend > 0 && revenue > 0 ? +(revenue / spend).toFixed(4) : null;
  const cpa        = conv > 0 ? +(spend / conv).toFixed(2) : null;
  return {
    platform_id:  c.id,
    name:         c.name,
    status:       c.status,
    objective:    c.objective,
    daily_budget: c.daily_budget ? parseInt(c.daily_budget) / 100 : null,
    start_date:   c.start_time?.substring(0, 10) || null,
    impressions:  parseInt(ins.impressions || 0, 10),
    clicks:       parseInt(ins.clicks || 0, 10),
    ctr:          parseFloat(ins.ctr || 0),
    cpc:          parseFloat(ins.cpc || 0),
    spend,
    conversions:  conv,
    cost_per_conv: cpa,
    revenue,
    roas,
    synced_at:    new Date().toISOString(),
    // Formatted for UI
    budget:       c.daily_budget ? `$${(parseInt(c.daily_budget)/100).toFixed(0)}/day` : "—",
    spent:        `$${spend.toLocaleString()}`,
    impr:         ins.impressions >= 1000 ? `${(+ins.impressions/1000).toFixed(0)}K` : String(parseInt(ins.impressions||0)),
    ctrFmt:       parseFloat(ins.ctr||0).toFixed(2) + "%",
    cpcFmt:       "$" + parseFloat(ins.cpc||0).toFixed(2),
    conv:         String(conv),
    cpaFmt:       cpa ? `$${cpa}` : "—",
    roasFmt:      roas ? `${roas.toFixed(2)}×` : "—",
    start:        c.start_time ? c.start_time.slice(5, 10).replace("-", " ") : "—",
  };
}

async function syncCampaigns(userId, accountId, accessToken) {
  try {
    const [campRes, insRes] = await Promise.all([
      axios.get(`${META_BASE}/${accountId}/campaigns`, {
        params: { fields: "id,name,status,objective,daily_budget,start_time", limit: 50, access_token: accessToken },
      }),
      axios.get(`${META_BASE}/${accountId}/insights`, {
        params: { fields: INSIGHTS_FIELDS, date_preset: "last_30d", level: "campaign", limit: 50, access_token: accessToken },
      }),
    ]);

    const insightMap = Object.fromEntries(
      (insRes.data.data || []).map(i => [i.campaign_id, i])
    );

    const rows = (campRes.data.data || []).map(c => ({
      user_id:  userId,
      platform: "meta",
      ...normalizeCampaign(c, insightMap[c.id] || {}),
    }));

    if (rows.length) {
      await supabase.from("campaigns")
        .upsert(rows, { onConflict: "user_id,platform,platform_id" });
    }

    return rows;
  } catch (e) {
    console.error("syncCampaigns error:", e.message);
    return [];
  }
}


// ════════════════════════════════════════════════════════════
// HEALTH
// ════════════════════════════════════════════════════════════
app.get("/health", (_req, res) => res.json({ status: "ok", version: "3.0.0" }));


// ════════════════════════════════════════════════════════════
// AUTH — profile
// ════════════════════════════════════════════════════════════
app.get("/auth/me", authLimiter, requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("profiles").select("*").eq("id", req.userId).single();
  if (error) return res.status(404).json({ error: "Profile not found" });
  res.json({ profile: data });
});

app.put("/auth/profile", authLimiter, requireAuth, async (req, res) => {
  const { full_name, brand_name } = req.body;
  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name, brand_name })
    .eq("id", req.userId)
    .select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ profile: data });
});


// ════════════════════════════════════════════════════════════
// META OAUTH — token stored per user in Supabase
// ════════════════════════════════════════════════════════════

// GET /auth/meta/connect?token=<supabase_jwt>
// The frontend opens this in a popup, passing its JWT so we
// know which user to associate the Meta token with.
app.get("/auth/meta/connect", authLimiter, async (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).json({ error: "token query param required" });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: "Invalid token" });

  // Encode userId into OAuth state so callback can retrieve it
  const state = Buffer.from(JSON.stringify({ userId: user.id, ts: Date.now() })).toString("base64url");
  const params = new URLSearchParams({
    client_id:     process.env.META_APP_ID,
    redirect_uri:  META_REDIRECT_URI,
    scope:         META_SCOPES,
    response_type: "code",
    state,
  });
  res.redirect(`https://www.facebook.com/v19.0/dialog/oauth?${params}`);
});

// GET /auth/meta/callback
app.get("/auth/meta/callback", authLimiter, async (req, res) => {
  const FRONTEND = process.env.FRONTEND_URL;
  const { code, state, error: oErr } = req.query;

  if (oErr)           return res.redirect(`${FRONTEND}?oauth_error=${encodeURIComponent(oErr)}`);
  if (!code || !state) return res.redirect(`${FRONTEND}?oauth_error=missing_params`);

  let userId;
  try {
    ({ userId } = JSON.parse(Buffer.from(state, "base64url").toString()));
  } catch {
    return res.redirect(`${FRONTEND}?oauth_error=invalid_state`);
  }

  try {
    // Exchange code → short-lived token
    const shortRes = await axios.get(`${META_BASE}/oauth/access_token`, {
      params: {
        client_id:     process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        redirect_uri:  META_REDIRECT_URI,
        code,
      },
    });

    // Upgrade → 60-day long-lived token
    const longRes = await axios.get(`${META_BASE}/oauth/access_token`, {
      params: {
        grant_type:        "fb_exchange_token",
        client_id:         process.env.META_APP_ID,
        client_secret:     process.env.META_APP_SECRET,
        fb_exchange_token: shortRes.data.access_token,
      },
    });
    const accessToken = longRes.data.access_token;

    // Fetch Meta user profile + ad accounts
    const [profileRes, adAccountsRes] = await Promise.all([
      axios.get(`${META_BASE}/me`, { params: { fields: "id,name", access_token: accessToken } }),
      axios.get(`${META_BASE}/me/adaccounts`, { params: { fields: "id,name", access_token: accessToken } }),
    ]);

    const adAccountIds = (adAccountsRes.data.data || []).map(a => a.id);

    // Save THIS user's token in Supabase — no other user can read it (RLS)
    await upsertMetaAccount(userId, {
      accountName:    profileRes.data.name + " — Meta Business",
      platformUserId: profileRes.data.id,
      accessToken,
      adAccountIds,
    });

    // Sync campaigns into Supabase immediately
    if (adAccountIds[0]) {
      await syncCampaigns(userId, adAccountIds[0], accessToken);
    }

    res.redirect(`${FRONTEND}?oauth_success=meta&accounts=${adAccountIds.length}`);
  } catch (err) {
    console.error("Meta callback error:", err.response?.data || err.message);
    res.redirect(`${FRONTEND}?oauth_error=${encodeURIComponent(err.message.slice(0, 120))}`);
  }
});

// POST /auth/meta/disconnect
app.post("/auth/meta/disconnect", requireAuth, async (req, res) => {
  await supabase
    .from("connected_accounts")
    .update({ status: "disconnected", access_token: null })
    .eq("user_id", req.userId)
    .eq("platform", "meta");
  res.json({ success: true });
});

// GET /auth/session — connected platforms for THIS user only
app.get("/auth/session", requireAuth, async (req, res) => {
  const { data } = await supabase
    .from("connected_accounts")
    .select("platform, account_name, platform_user_id, ad_account_ids, status")
    .eq("user_id", req.userId)
    .eq("status", "active");

  const meta      = (data || []).find(r => r.platform === "meta");
  const connected = (data || []).map(r => r.platform);

  res.json({
    connected,
    userName:     meta?.account_name || null,
    userId:       meta?.platform_user_id || null,
    adAccountIds: meta?.ad_account_ids || [],
    accounts:     data || [],
  });
});


// ════════════════════════════════════════════════════════════
// META MARKETING API — always scoped to req.userId
// ════════════════════════════════════════════════════════════

app.get("/api/meta/accounts/:accountId/campaigns", apiLimiter, requireAuth, async (req, res) => {
  const { accountId } = req.params;
  try {
    const meta = await getMetaAccount(req.userId);
    if (!meta) return res.status(403).json({ error: "Meta not connected for your account. Please connect Meta first." });
    if (!meta.ad_account_ids?.includes(accountId)) {
      return res.status(403).json({ error: "You are not authorised for this ad account." });
    }

    const rows = await syncCampaigns(req.userId, accountId, meta.access_token);

    const totalSpend  = rows.reduce((s, c) => s + (c.spend || 0), 0);
    const totalConv   = rows.reduce((s, c) => s + (c.conversions || 0), 0);
    const totalImpr   = rows.reduce((s, c) => s + (c.impressions || 0), 0);
    const totalClicks = rows.reduce((s, c) => s + (c.clicks || 0), 0);
    const roasItems   = rows.filter(c => c.roas);

    res.json({
      accountId,
      campaigns: rows,
      summary: {
        totalSpend:       totalSpend.toFixed(2),
        totalConv,
        totalImpressions: totalImpr,
        totalClicks,
        avgCtr:           totalImpr > 0 ? ((totalClicks / totalImpr) * 100).toFixed(2) : "0.00",
        avgRoas:          roasItems.length
          ? (roasItems.reduce((s, c) => s + c.roas, 0) / roasItems.length).toFixed(2)
          : null,
        activeCampaigns:  rows.filter(c => c.status === "ACTIVE").length,
        totalCampaigns:   rows.length,
      },
    });
  } catch (err) {
    console.error("Campaigns error:", err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

app.get("/api/meta/accounts/:accountId/insights", apiLimiter, requireAuth, async (req, res) => {
  const { accountId } = req.params;
  try {
    const meta = await getMetaAccount(req.userId);
    if (!meta || !meta.ad_account_ids?.includes(accountId)) {
      return res.status(403).json({ error: "Unauthorised" });
    }
    const datePreset = req.query.date_preset || "last_30d";
    const insRes = await axios.get(`${META_BASE}/${accountId}/insights`, {
      params: {
        fields:      INSIGHTS_FIELDS + ",reach,frequency",
        date_preset: datePreset,
        level:       "campaign",
        limit:       50,
        access_token: meta.access_token,
      },
    });
    const insights = insRes.data.data || [];

    // Persist analytics snapshot for this user
    if (insights.length) {
      const rows = insights.map(ins => ({
        user_id:     req.userId,
        platform:    "meta",
        date_range:  datePreset,
        impressions: parseInt(ins.impressions || 0),
        clicks:      parseInt(ins.clicks || 0),
        ctr:         parseFloat(ins.ctr || 0),
        cpc:         parseFloat(ins.cpc || 0),
        spend:       parseFloat(ins.spend || 0),
        reach:       parseInt(ins.reach || 0),
      }));
      await supabase.from("analytics").insert(rows);
    }

    res.json({ accountId, datePreset, insights });
  } catch (err) {
    res.status(500).json({ error: err.response?.data?.error?.message || err.message });
  }
});

app.post("/api/meta/accounts/:accountId/creatives", apiLimiter, requireAuth, async (req, res) => {
  const { accountId } = req.params;
  const { campaignId, name, imageUrl, headline, body, callToAction, link } = req.body;
  try {
    const meta = await getMetaAccount(req.userId);
    if (!meta || !meta.ad_account_ids?.includes(accountId)) {
      return res.status(403).json({ error: "Unauthorised" });
    }
    const at = meta.access_token;

    // Upload image
    const imgRes = await axios.post(`${META_BASE}/${accountId}/adimages`, { url: imageUrl, access_token: at });
    const hash   = Object.values(imgRes.data.images || {})[0]?.hash;
    if (!hash) throw new Error("Image upload to Meta failed — no hash returned");

    // Create creative
    const crRes = await axios.post(`${META_BASE}/${accountId}/adcreatives`, {
      name: `${name} — Creative`,
      object_story_spec: {
        page_id:   process.env.META_PAGE_ID,
        link_data: { link, message: body, name: headline, image_hash: hash, call_to_action: { type: callToAction||"SHOP_NOW", value: { link } } },
      },
      access_token: at,
    });

    // Get first active adset
    const asRes = await axios.get(`${META_BASE}/${campaignId}/adsets`, { params: { fields: "id,status", access_token: at } });
    const adset = (asRes.data.data||[]).find(a => a.status==="ACTIVE") || asRes.data.data?.[0];
    if (!adset) throw new Error("No ad sets found — create one in Meta Ads Manager first.");

    const adRes = await axios.post(`${META_BASE}/${accountId}/ads`, {
      name, adset_id: adset.id, creative: { creative_id: crRes.data.id }, status: "PAUSED", access_token: at,
    });

    // Save creative to Supabase for this user
    await supabase.from("creatives").insert({
      user_id: req.userId, type: "image", platform: "meta",
      title:   name, content: imageUrl,
      metadata: { adId: adRes.data.id, campaignId, adsetId: adset.id, status: "PAUSED" },
    });

    res.json({ success: true, adId: adRes.data.id, creativeId: crRes.data.id, status: "PAUSED" });
  } catch (err) {
    const e = err.response?.data?.error;
    res.status(500).json({ error: e?.message || err.message, code: e?.code });
  }
});


// ════════════════════════════════════════════════════════════
// OPENAI COPY GENERATION
// ════════════════════════════════════════════════════════════

app.post("/api/copy/generate", copyLimiter, requireAuth, async (req, res) => {
  const { product, platform = "Meta", tone = "Energetic", additionalNotes = "" } = req.body;
  if (!product?.trim()) return res.status(400).json({ error: "Product description required (min 3 chars)" });

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o",
        messages: [
          { role: "system", content: `Expert direct-response ad copywriter for ${platform}. Return ONLY valid JSON, no markdown.` },
          { role: "user",   content: `Product: ${product}\nPlatform: ${platform}\nTone: ${tone}\n${additionalNotes ? `Notes: ${additionalNotes}` : ""}\n\nReturn exactly:\n{"headline":"≤40 chars","subheadline":"≤70 chars","adCopy":"2-3 sentences","socialCaption":"≤150 chars with emojis + hashtags","callToAction":"2-4 words","hook":"first 3 seconds stop-scroll","valueProposition":"one sentence","targetAudience":"who this targets"}` },
        ],
        temperature: 0.8,
        max_tokens:  600,
        response_format: { type: "json_object" },
      },
      { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, timeout: 25_000 }
    );

    const copy = JSON.parse(response.data.choices[0]?.message?.content || "{}");

    // Save to Supabase for this user's library
    await supabase.from("creatives").insert({
      user_id:  req.userId,
      type:     "copy",
      platform,
      title:    copy.headline || "Generated Copy",
      content:  JSON.stringify(copy),
      prompt:   product,
      style:    tone,
    });

    res.json({ success: true, copy, usage: response.data.usage });
  } catch (err) {
    const e = err.response?.data?.error;
    res.status(e ? 502 : 500).json({ error: e?.message || err.message });
  }
});

app.post("/api/copy/refine", copyLimiter, requireAuth, async (req, res) => {
  const { field, currentValue, instruction, product, platform } = req.body;
  if (!field || !currentValue || !instruction) {
    return res.status(400).json({ error: "Missing: field, currentValue, instruction" });
  }
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o",
        messages: [
          { role: "system", content: "Expert ad copywriter. Return ONLY the improved text, nothing else." },
          { role: "user",   content: `Field: ${field}\nProduct: ${product||"product"}\nPlatform: ${platform||"Meta"}\nCurrent: ${currentValue}\nInstruction: ${instruction}\n\nImproved:` },
        ],
        temperature: 0.9,
        max_tokens:  200,
      },
      { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, timeout: 15_000 }
    );
    const refined = response.data.choices[0]?.message?.content?.trim() || currentValue;
    res.json({ success: true, field, refined });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ════════════════════════════════════════════════════════════
// CREATIVES LIBRARY — per user from Supabase
// ════════════════════════════════════════════════════════════

app.get("/api/creatives", requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("creatives")
    .select("*")
    .eq("user_id", req.userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ creatives: data || [] });
});

app.delete("/api/creatives/:id", requireAuth, async (req, res) => {
  const { error } = await supabase
    .from("creatives")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.userId); // ← prevents deleting another user's creative
  if (error) return res.status(500).json({ error: error.message });
  res.json({ deleted: true });
});


// ════════════════════════════════════════════════════════════
// CAMPAIGNS from Supabase (cached, no live API hit)
// ════════════════════════════════════════════════════════════

app.get("/api/campaigns", requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("user_id", req.userId)
    .order("synced_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ campaigns: data || [] });
});




// ════════════════════════════════════════════════════════════
// AI PROXY — Anthropic (Claude) · keys never leave the server
// ════════════════════════════════════════════════════════════

const aiLimiter = rateLimit({ windowMs: 60_000, max: 30, message: { error: "Too many AI requests — try again in a minute." } });

app.post("/api/ai/chat", aiLimiter, requireAuth, async (req, res) => {
  const { system, user: userMsg, history = [] } = req.body;
  if (!userMsg?.trim()) return res.status(400).json({ error: "Missing user message." });
  try {
    const messages = [
      ...history
        .filter(h => h.role === "user" || h.role === "assistant")
        .map(h => ({ role: h.role, content: h.content })),
      { role: "user", content: userMsg },
    ];
    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-sonnet-4-20250514",
        max_tokens: 1200,
        system: system || "You are AdForge AI, an expert marketing assistant.",
        messages,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        timeout: 30_000,
      }
    );
    const text = response.data.content?.map(c => c.text || "").join("") || "";
    res.json({ success: true, text });
  } catch (err) {
    const e = err.response?.data?.error;
    res.status(502).json({ error: e?.message || err.message });
  }
});


// ════════════════════════════════════════════════════════════
// AI PROXY — OpenAI DALL-E 3 image generation
// ════════════════════════════════════════════════════════════

app.post("/api/ai/image", aiLimiter, requireAuth, async (req, res) => {
  const { prompt, size = "1024x1024", quality = "hd" } = req.body;
  if (!prompt?.trim()) return res.status(400).json({ error: "Missing image prompt." });
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/images/generations",
      { model: "dall-e-3", prompt, n: 1, size, quality },
      {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        timeout: 60_000,
      }
    );
    const url = response.data.data?.[0]?.url;
    if (!url) throw new Error("No image URL returned");

    // Save to creatives table
    await supabase.from("creatives").insert({
      user_id: req.userId,
      type:    "image",
      title:   prompt.slice(0, 80),
      content: JSON.stringify({ url, prompt }),
      prompt,
    });

    res.json({ success: true, url });
  } catch (err) {
    const e = err.response?.data?.error;
    res.status(502).json({ error: e?.message || err.message });
  }
});

// ════════════════════════════════════════════════════════════
// FAL.AI — IMAGE GENERATION (FLUX.1 Kontext Pro)
// POST /api/fal/image
// Body: { prompt, aspect_ratio?, model? }
// Returns: { url, requestId } immediately (async) or { url } if sync
// ════════════════════════════════════════════════════════════

const FAL_BASE = "https://queue.fal.run";
const FAL_HEADERS = () => ({
  "Authorization": `Key ${process.env.FAL_API_KEY}`,
  "Content-Type": "application/json",
});

app.post("/api/fal/image", aiLimiter, requireAuth, async (req, res) => {
  const { prompt, aspect_ratio = "1:1", model = "flux-kontext-pro", reference_image_url } = req.body;
  if (!prompt?.trim()) return res.status(400).json({ error: "Missing prompt." });
  if (!process.env.FAL_API_KEY) return res.status(503).json({ error: "FAL_API_KEY not configured." });

  // Model map: friendly name → fal endpoint
  const MODEL_MAP = {
    "flux-kontext-pro": "fal-ai/flux/kontext/pro",
    "flux-dev":         "fal-ai/flux/dev",
    "ideogram-v3":      "fal-ai/ideogram/v3",
  };
  const endpoint = MODEL_MAP[model] || MODEL_MAP["flux-kontext-pro"];

  try {
    const payload = {
      prompt,
      aspect_ratio,
      output_format: "jpeg",
      safety_tolerance: "2",
      ...(reference_image_url ? { reference_image_url } : {}),
    };

    // Submit to fal queue
    const submitRes = await axios.post(
      `${FAL_BASE}/${endpoint}`,
      payload,
      { headers: FAL_HEADERS(), timeout: 10_000 }
    );

    const { request_id, status, images } = submitRes.data;

    // If fal returned synchronously (status 200 + images), return immediately
    if (images?.[0]?.url) {
      const url = images[0].url;
      await supabase.from("creatives").insert({
        user_id: req.userId, type: "image", title: prompt.slice(0, 80),
        content: JSON.stringify({ url, prompt, model }), prompt,
      });
      return res.json({ success: true, url, request_id });
    }

    // Otherwise return request_id for polling
    res.json({ success: true, request_id, status: status || "IN_QUEUE" });
  } catch (err) {
    console.error("fal image error:", err.response?.data || err.message);
    res.status(502).json({ error: err.response?.data?.detail || err.message });
  }
});


// ════════════════════════════════════════════════════════════
// FAL.AI — POLL STATUS
// GET /api/fal/status/:requestId?model=flux-kontext-pro
// Returns: { status, url? }
// ════════════════════════════════════════════════════════════

app.get("/api/fal/status/:requestId", requireAuth, async (req, res) => {
  const { requestId } = req.params;
  const model = req.query.model || "flux-kontext-pro";
  const MODEL_MAP = {
    "flux-kontext-pro": "fal-ai/flux/kontext/pro",
    "flux-dev":         "fal-ai/flux/dev",
    "ideogram-v3":      "fal-ai/ideogram/v3",
    "kling-v3":         "fal-ai/kling-video/v3",
  };
  const endpoint = MODEL_MAP[model] || MODEL_MAP["flux-kontext-pro"];

  try {
    const statusRes = await axios.get(
      `${FAL_BASE}/${endpoint}/requests/${requestId}/status`,
      { headers: FAL_HEADERS(), timeout: 8_000 }
    );
    const { status, output } = statusRes.data;
    const url = output?.images?.[0]?.url || output?.video?.url || null;

    if (url) {
      // Save completed creative
      await supabase.from("creatives").insert({
        user_id: req.userId, type: model.includes("kling") ? "video" : "image",
        title: `Generated ${model.includes("kling") ? "video" : "image"}`,
        content: JSON.stringify({ url, request_id: requestId, model }),
        prompt: req.query.prompt || "",
      }).select().single();
    }

    res.json({ status, url });
  } catch (err) {
    res.status(502).json({ error: err.response?.data?.detail || err.message });
  }
});


// ════════════════════════════════════════════════════════════
// FAL.AI — VIDEO GENERATION (Kling 3.0)
// POST /api/fal/video
// Body: { prompt, image_url?, duration?, aspect_ratio? }
// Returns: { request_id, status }
// ════════════════════════════════════════════════════════════

app.post("/api/fal/video", aiLimiter, requireAuth, async (req, res) => {
  const {
    prompt,
    image_url,          // reference image → animate it (image-to-video)
    duration = 5,       // seconds: 5 or 10
    aspect_ratio = "9:16", // 9:16 for TikTok/Stories, 16:9 for YouTube, 1:1 for feed
  } = req.body;

  if (!prompt?.trim()) return res.status(400).json({ error: "Missing prompt." });
  if (!process.env.FAL_API_KEY) return res.status(503).json({ error: "FAL_API_KEY not configured." });

  try {
    const payload = {
      prompt,
      duration: String(duration),
      aspect_ratio,
      cfg_scale: 0.5,
      ...(image_url ? { image_url } : {}),
    };

    const submitRes = await axios.post(
      `${FAL_BASE}/fal-ai/kling-video/v3`,
      payload,
      { headers: FAL_HEADERS(), timeout: 15_000 }
    );

    const { request_id, status, video } = submitRes.data;

    // Sync response
    if (video?.url) {
      await supabase.from("creatives").insert({
        user_id: req.userId, type: "video", title: prompt.slice(0, 80),
        content: JSON.stringify({ url: video.url, prompt, duration, aspect_ratio }),
        prompt,
      });
      return res.json({ success: true, url: video.url, request_id });
    }

    res.json({ success: true, request_id, status: status || "IN_QUEUE" });
  } catch (err) {
    console.error("fal video error:", err.response?.data || err.message);
    res.status(502).json({ error: err.response?.data?.detail || err.message });
  }
});


// ════════════════════════════════════════════════════════════
// ERROR HANDLER
// ════════════════════════════════════════════════════════════
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`\n✅ AdForge backend v3.0 (Supabase Auth) running on http://localhost:${PORT}`);
  console.log(`   Supabase: ${process.env.SUPABASE_URL}`);
  console.log(`   Frontend: ${process.env.FRONTEND_URL}\n`);
});
