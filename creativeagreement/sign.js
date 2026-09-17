(() => {
"use strict";
// Web app that emails the signed PDF to Fraser Hawkshaw Media and the signer (Google Apps Script in Fraser's account)
const ENDPOINT = "https://script.google.com/macros/s/AKfycbwhaxHabcWoOWHTd0IesyCwdwHe110lHHTCSCA3Kea3gZ72Hzc2cxr3kIcOR3zk25fgVg/exec";
const PDF_URL = "freelance-creative-services-agreement.pdf";
const COMPANY = {name:"Fraser Hawkshaw", role:"Director", company:"Fraser Hawkshaw Media Limited", email:"contact@fraserhawkshaw.com"};
// Where the lines are on the last page of the PDF (points from the top of the page)
const LINES = {freelancer:{name:171.5, role:231.5, sig:291.5, date:351.5}, company:{name:457.5, role:517.5, sig:577.5, date:637.5}};
const X = 56, LINE_W = 255;

const $ = s => document.querySelector(s);
const form = $("#signForm");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const pad2 = n => String(n).padStart(2, "0");
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; };
const ukDate = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ""); return m ? `${m[3]}/${m[2]}/${m[1]}` : ""; };
const clean = s => String(s || "").replace(/\s+/g, " ").trim();

// Prefill from the booking email link
const q = new URLSearchParams(location.search);
if (q.get("name")) $("#fName").value = clean(q.get("name")).slice(0, 80);
if (q.get("role")) $("#fRole").value = clean(q.get("role")).slice(0, 60);
if (q.get("email") && EMAIL_RE.test(q.get("email"))) $("#fEmail").value = q.get("email").trim();
$("#fDate").value = todayISO();

/* ---------- Signature: draw or type ---------- */
let mode = "draw", strokes = [], drawing = null;
const canvas = $("#sigCanvas"), ctx = canvas.getContext("2d");
function sizeCanvas(){
  const r = canvas.getBoundingClientRect(), dpr = Math.max(1, window.devicePixelRatio || 1);
  if (!r.width) return;
  canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  redraw();
}
function redraw(){
  const r = canvas.getBoundingClientRect();
  ctx.clearRect(0, 0, r.width, r.height);
  ctx.strokeStyle = "#14213D"; ctx.lineWidth = 2.4; ctx.lineCap = "round"; ctx.lineJoin = "round";
  for (const s of strokes){
    ctx.beginPath();
    s.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    if (s.length === 1) ctx.lineTo(s[0].x + 0.1, s[0].y + 0.1);
    ctx.stroke();
  }
  $("#padPh").hidden = strokes.length > 0;
}
const pt = e => { const r = canvas.getBoundingClientRect(); return {x: e.clientX - r.left, y: e.clientY - r.top}; };
canvas.addEventListener("pointerdown", e => { e.preventDefault(); canvas.setPointerCapture(e.pointerId); drawing = [pt(e)]; strokes.push(drawing); redraw(); });
canvas.addEventListener("pointermove", e => { if (!drawing) return; for (const ev of (e.getCoalescedEvents ? e.getCoalescedEvents() : [e])) drawing.push(pt(ev)); redraw(); });
const endStroke = () => { drawing = null; };
canvas.addEventListener("pointerup", endStroke); canvas.addEventListener("pointercancel", endStroke);
$("#clearSig").addEventListener("click", () => { strokes = []; redraw(); });
window.addEventListener("resize", sizeCanvas);
sizeCanvas();

function setMode(m){
  mode = m;
  $("#modeDraw").setAttribute("aria-pressed", m === "draw");
  $("#modeType").setAttribute("aria-pressed", m === "type");
  $("#pad").hidden = m !== "draw";
  $("#typedSig").hidden = m !== "type";
  if (m === "draw") sizeCanvas();
  renderTyped();
}
function renderTyped(){
  const n = clean($("#fName").value), el = $("#typedSig");
  el.textContent = n || "Type your full name above";
  el.classList.toggle("empty", !n);
}
$("#modeDraw").addEventListener("click", () => setMode("draw"));
$("#modeType").addEventListener("click", () => setMode("type"));
$("#fName").addEventListener("input", renderTyped);

// Crop the drawing to its ink and return a PNG
function drawnPng(){
  const pts = strokes.flat();
  if (pts.length < 2) return null;
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  if (maxX - minX < 12 && maxY - minY < 12) return null;
  const padPx = 6, scale = 3;
  const w = Math.ceil(maxX - minX + padPx * 2), h = Math.ceil(maxY - minY + padPx * 2);
  const c = document.createElement("canvas"); c.width = w * scale; c.height = h * scale;
  const g = c.getContext("2d"); g.scale(scale, scale); g.translate(padPx - minX, padPx - minY);
  g.strokeStyle = "#14213D"; g.lineWidth = 2.4; g.lineCap = "round"; g.lineJoin = "round";
  for (const s of strokes){ g.beginPath(); s.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); if (s.length === 1) g.lineTo(s[0].x + .1, s[0].y + .1); g.stroke(); }
  return {data: c.toDataURL("image/png"), w, h};
}
async function typedPng(text){
  try { await document.fonts.load('600 64px "Caveat"'); } catch (e) {}
  const font = '600 64px Caveat, "Bradley Hand", "Segoe Script", cursive';
  const c = document.createElement("canvas"), g = c.getContext("2d");
  g.font = font;
  const w = Math.ceil(g.measureText(text).width) + 24, h = 90;
  c.width = w * 2; c.height = h * 2;
  const g2 = c.getContext("2d"); g2.scale(2, 2); g2.font = font; g2.fillStyle = "#14213D"; g2.textBaseline = "alphabetic";
  g2.fillText(text, 12, 64);
  return {data: c.toDataURL("image/png"), w, h};
}

/* ---------- Build the signed PDF ---------- */
async function sha256Hex(buf){
  const d = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, "0")).join("");
}
// Standard PDF fonts can't draw every character; swap the common ones and drop the rest
const pdfSafe = s => clean(s).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/…/g, "...").normalize("NFC").replace(/[^\x20-\x7E\xA0-\xFF€]/g, "?");

async function buildPdf(d){
  const { PDFDocument, StandardFonts, rgb } = PDFLib;
  const srcBytes = await (await fetch(PDF_URL, {cache: "no-store"})).arrayBuffer();
  const docHash = await sha256Hex(srcBytes);
  const pdf = await PDFDocument.load(srcBytes);
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pages = pdf.getPages(), last = pages[pages.length - 1];
  const H = last.getHeight();
  const ink = rgb(0.08, 0.13, 0.24);
  const text = (t, top, size = 12) => last.drawText(pdfSafe(t), {x: X, y: H - top - 6, size, font: helv, color: ink, maxWidth: LINE_W});
  const fit = (t, size) => { let s = size; while (s > 7 && helv.widthOfTextAtSize(pdfSafe(t), s) > LINE_W) s -= 0.5; return s; };
  async function sig(img, top){
    const png = await pdf.embedPng(img.data);
    const maxH = 34, maxW = LINE_W;
    const k = Math.min(maxH / img.h, maxW / img.w, 1.2);
    last.drawImage(png, {x: X, y: H - top - 5, width: img.w * k, height: img.h * k});
  }
  const who = d.business ? `${d.name} (${d.business})` : d.name;
  const L = LINES.freelancer;
  text(who, L.name, fit(who, 12));
  text(d.role, L.role, fit(d.role, 12));
  await sig(d.sigImg, L.sig);
  text(ukDate(d.date), L.date);
  const C = LINES.company;
  text(COMPANY.name, C.name);
  text(COMPANY.role, C.role);
  await sig(await typedPng(COMPANY.name), C.sig);
  text(ukDate(d.date), C.date);

  // Signing record
  const page = pdf.addPage([last.getWidth(), H]);
  const W = page.getWidth();
  let y = H - 72;
  const line = (label, value) => {
    page.drawText(pdfSafe(label), {x: 54, y, size: 10, font: bold, color: rgb(0.42, 0.46, 0.53)});
    const words = pdfSafe(value).split(" "); let row = "", yy = y;
    for (const w of words){
      const next = row ? row + " " + w : w;
      if (helv.widthOfTextAtSize(next, 11) > W - 250 && row){ page.drawText(row, {x: 210, y: yy, size: 11, font: helv, color: ink}); yy -= 15; row = w; }
      else row = next;
    }
    page.drawText(row, {x: 210, y: yy, size: 11, font: helv, color: ink});
    y = yy - 22;
  };
  page.drawText("Electronic signing record", {x: 54, y, size: 18, font: bold, color: ink}); y -= 22;
  page.drawText(pdfSafe("Freelance Creative Services Agreement - Fraser Hawkshaw Media Limited"), {x: 54, y, size: 11, font: helv, color: rgb(0.42, 0.46, 0.53)}); y -= 36;
  line("Document reference", d.ref);
  line("Signed by", d.name);
  if (d.business) line("On behalf of", d.business);
  line("Role", d.role);
  line("Email", d.email);
  line("Date entered", ukDate(d.date));
  line("Signed at", `${d.signedAt} (${d.localTime}, ${d.tz})`);
  line("Signature method", d.method === "draw" ? "Drawn on screen" : "Typed name");
  line("Signed on", location.origin + location.pathname);
  line("Browser", d.ua.slice(0, 200));
  line("Agreement file (SHA-256)", docHash);
  y -= 6;
  line("Countersigned", `Signed electronically for ${COMPANY.company} by ${COMPANY.name}, ${COMPANY.role}, when the freelancer signed.`);
  line("Consent", "The freelancer confirmed they had read the agreement, agreed to its terms and agreed to sign it electronically.");
  pdf.setTitle(`Freelance Creative Services Agreement - signed by ${pdfSafe(d.name)}`);
  pdf.setAuthor(COMPANY.company);
  pdf.setSubject(`Signed ${d.signedAt}`);
  pdf.setCreationDate(new Date());
  const bytes = await pdf.save();
  return {bytes, docHash};
}
function toBase64(bytes){
  let s = ""; const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) s += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  return btoa(s);
}
const fileName = name => `Freelance Creative Services Agreement - ${clean(name).replace(/[\\/:*?"<>|]+/g, "")} - signed.pdf`;

/* ---------- Submit ---------- */
function showErr(msg){ const el = $("#formErr"); el.textContent = msg; el.hidden = !msg; if (msg) el.scrollIntoView({block: "nearest", behavior: "smooth"}); }
form.addEventListener("submit", async e => {
  e.preventDefault();
  showErr("");
  const d = {
    name: clean($("#fName").value), role: clean($("#fRole").value), business: clean($("#fBiz").value),
    email: $("#fEmail").value.trim(), date: $("#fDate").value, method: mode
  };
  if (d.name.length < 2){ $("#fName").focus(); return showErr("Enter your full name."); }
  if (!d.role){ $("#fRole").focus(); return showErr("Enter the role you’re being booked for."); }
  if (!d.date){ $("#fDate").focus(); return showErr("Enter today’s date."); }
  if (!EMAIL_RE.test(d.email)){ $("#fEmail").focus(); return showErr("Enter a valid email address, so we can send you a copy."); }
  d.sigImg = mode === "draw" ? drawnPng() : await typedPng(d.name);
  if (!d.sigImg) return showErr("Draw your signature in the box, or switch to Type.");
  if (!$("#fAgree").checked) return showErr("Tick the box to confirm you’ve read and agree to the agreement.");
  if ($("#fWebsite").value) return;
  if (!window.PDFLib) return showErr("The page didn’t load properly. Refresh and try again.");

  const btn = $("#submitBtn"); btn.disabled = true; btn.textContent = "Signing…";
  const now = new Date();
  d.signedAt = now.toISOString().replace(/\.\d+Z$/, "Z");
  d.localTime = now.toLocaleString("en-GB");
  d.tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  d.ua = navigator.userAgent;
  d.ref = `FHM-FCSA-${d.signedAt.slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  let built;
  try { built = await buildPdf(d); }
  catch (err) { btn.disabled = false; btn.textContent = "Sign agreement"; return showErr("Something went wrong making the signed PDF. Refresh the page and try again."); }
  const blob = new Blob([built.bytes], {type: "application/pdf"});
  const name = fileName(d.name);
  const url = URL.createObjectURL(blob);
  $("#dlSigned").href = url; $("#dlSigned").download = name;

  btn.textContent = "Sending your copy…";
  let sent = false, problem = "";
  try {
    const res = await fetch(ENDPOINT, {method: "POST", credentials: "omit", body: JSON.stringify({
      name: d.name, role: d.role, business: d.business, email: d.email, date: d.date, method: d.method,
      signedAt: d.signedAt, localTime: d.localTime, tz: d.tz, ua: d.ua.slice(0, 300), ref: d.ref, docHash: built.docHash,
      page: location.origin + location.pathname, filename: name, pdf: toBase64(built.bytes), website: $("#fWebsite").value
    })});
    const out = await res.json();
    sent = !!(out && out.ok);
    if (!sent) problem = (out && out.error) || "";
  } catch (err) { problem = "network"; }

  form.hidden = true;
  $("#done").hidden = false;
  if (sent){
    $("#doneText").textContent = `Thanks, ${d.name.split(" ")[0]}. The signed agreement has been emailed to you at ${d.email} and to Fraser Hawkshaw Media. You can also download it now.`;
  } else {
    $("#doneText").textContent = `Thanks, ${d.name.split(" ")[0]}. Your signed agreement is ready, but it couldn’t be emailed automatically.`;
    const se = $("#sendErr");
    se.hidden = false;
    se.innerHTML = "";
    se.append("Please download it and email it to ");
    const a = document.createElement("a");
    a.href = `mailto:${COMPANY.email}?subject=${encodeURIComponent("Signed Freelance Creative Services Agreement – " + d.name)}`;
    a.textContent = COMPANY.email; se.append(a, " with the PDF attached.");
    if (problem === "limit") se.append(" (Too many agreements were signed from here today.)");
  }
  $("#done").scrollIntoView({block: "nearest", behavior: "smooth"});
});
})();
