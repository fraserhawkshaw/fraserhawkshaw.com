(() => {
"use strict";
// Same web app as the Creative Agreement page: emails the signed PDF to Fraser Hawkshaw Media and the signer (Google Apps Script in Fraser's account)
const ENDPOINT = "https://script.google.com/macros/s/AKfycbwhaxHabcWoOWHTd0IesyCwdwHe110lHHTCSCA3Kea3gZ72Hzc2cxr3kIcOR3zk25fgVg/exec";
const DOC_TITLE = "Equipment Liability Acknowledgement";
const DOC_VERSION = "1.1 (October 2026)";
const TERMS_VERSION = "effective 24 October 2026";
const COMPANY = {name:"Fraser Hawkshaw", role:"Director", company:"Fraser Hawkshaw Media Limited", email:"contact@fraserhawkshaw.com"};

/* ---------- The acknowledgement text (one source: shown on the page and written into the PDF) ---------- */
const INTRO = [
  "This Equipment Liability Acknowledgement is given under Section 19.1.7 of the Terms and Conditions for Multi-Camera Event Videography Services of Fraser Hawkshaw Media Limited (“the Company”). Words with capital letters, such as Client, Event, Equipment, Venue and Booking, mean what they mean in those Terms and Conditions, which are at fraserhawkshaw.com/terms.",
  "It applies to the Event and location named in the details you enter on this page. It should be signed before the Company starts filming."
];
const STORAGE = {
  available:   {label: "Secure storage is available", text: "A secure, lockable area has been arranged on site for storing Equipment when it is not in active use (Section 19.1.1)."},
  unconfirmed: {label: "A storage area has been indicated, but it cannot be confirmed as fully secure", text: "An area has been indicated for storing Equipment, but it cannot be confirmed as fully secure. The Client confirms that verbal assurances that it is adequate are not binding on the Company, and accepts responsibility for the suitability of that area. For the purposes of this Acknowledgement it is treated as an area where a secure, lockable area has not been provided."},
  none:        {label: "Secure storage is not available", text: "No secure, lockable area has been provided for the Equipment, as required by Section 19.1.1."}
};
const HAZARD = {
  none:        {label: "No hazardous effects", text: "The Event does not include lasers, pyrotechnics or other Hazardous Effects."},
  disclosed:   {label: "Hazardous effects, disclosed in advance", text: "Hazardous Effects are planned, and the Client disclosed them to the Company in writing before the Event (Section 19.7.1)."},
  undisclosed: {label: "Hazardous effects, not disclosed in advance", text: "Hazardous Effects are present and were not disclosed to the Company in writing before the Event. The Company may reposition or withdraw Equipment from any area it considers at risk, which is not a failure of service, and the Client is liable as set out in Section 19.7.5."}
};
const needsProceed = s => s.storage !== "available" || s.hazard === "undisclosed";
// sel = {storage, hazard} for the signed PDF; null for the page, which shows every option
function clauses(sel){
  const list = [];
  list.push({h: "Secure storage", p: sel
    ? [STORAGE[sel.storage].text]
    : ["The Client confirms which of the following applies, as selected on this page:", ...Object.values(STORAGE).map(o => `${o.label}. ${o.text}`)]});
  list.push({h: "Responsibility for Equipment", p: [
    "Where a secure, lockable area has not been provided, or cannot be confirmed as fully secure, the Client accepts responsibility for any loss, theft or damage to Equipment on site that arises from that failure, including the reasonable repair or replacement cost up to the Equipment’s total replacement value (Section 19.1.3).",
    "In every case the Client remains responsible for loss, theft or damage to Equipment caused by the Client, its representatives, Venue staff, performers, attendees or contractors while the Equipment is on site (Section 19.4).",
    "The Client is not responsible to the extent a loss is caused by the Company’s own negligence or its failure to take reasonable care of the Equipment (Sections 19.1.5 and 19.4)."]});
  list.push({h: "Ownership and replacement value", p: [
    "All Equipment remains the property of the Company at all times (Section 19.3). Replacement values are those stated in any equipment schedule the Company has provided (Section 19.1.4). Where no schedule has been provided, the replacement value is the reasonable cost of replacing the item with an equivalent.",
    "Any sum due under this Acknowledgement will be invoiced and is payable in accordance with Section 5 of the Terms and Conditions."]});
  list.push({h: "Insurance", p: [
    "The Company’s equipment insurance depends on reasonable security measures being in place (Sections 19.1.2 and 19.8.1). Where a secure, lockable area is not provided, Equipment may not be covered. The Client’s responsibility under this Acknowledgement applies whether or not any insurance responds. The Company will not recover the same loss twice."]});
  list.push({h: "How the Company may work without secure storage", p: [
    "The Company may reduce unattended Equipment deployment, keep Equipment with its crew, or take other reasonable steps to protect it. This is not a failure of service and does not reduce the fees (Section 19.1.6)."]});
  list.push({h: "Hazardous effects", p: sel
    ? [HAZARD[sel.hazard].text]
    : ["The Client confirms which of the following applies, as selected on this page:", ...Object.values(HAZARD).map(o => `${o.label}. ${o.text}`)]});
  list.push({h: "Venue and attendees", p: [
    "The Client will use reasonable efforts to make sure Venue staff, performers and attendees know that recording Equipment must not be moved, touched or interfered with (Sections 19.6.2 and 19.6.8)."]});
  if (!sel || needsProceed(sel)) list.push({h: "Instruction to proceed", p: [
    ...(sel ? [] : ["This clause applies, and the instruction box on this page must be ticked, if the Client selects storage that is not available or cannot be confirmed as fully secure, or hazardous effects that were not disclosed in advance."]),
    "The Client confirms that the risks identified above have been considered and instructs the Company to proceed on that basis. The Client accepts that verbal assurances about storage, safe zones or effects are not binding on the Company, and that this Acknowledgement replaces any such assurance.",
    "As between the Company and the Client, any loss of or damage to Equipment arising from those risks is the Client’s responsibility, and the Client may recover it from any third party responsible. This does not apply to the extent a loss is caused by the Company’s own negligence or failure to take reasonable care, and it does not limit the Company’s rights under Sections 2.9.5 and 19.5 to pause, move or stop work for safety reasons."]});
  list.push({h: "Authority", p: [
    "The person signing confirms they are authorised to sign this Acknowledgement on behalf of the Client, and that any End Client has authorised it where relevant. If they were not authorised, they are personally liable as set out in Section 2.8.4 of the Terms and Conditions."]});
  list.push({h: "Relationship to the Terms and Conditions", p: [
    "Once signed, this Acknowledgement forms part of the Agreement and prevails over the Confirmation Email on equipment liability (Sections 19.1.7 and 31.14). Otherwise the Terms and Conditions apply unchanged. Nothing in it limits any liability that cannot be limited by law (Section 17.0) or the rights of a Consumer (Section 30.7). It is governed by the laws of England and Wales (Section 30)."]});
  list.push({h: "Electronic signature", p: [
    "By signing, the Client agrees to sign this Acknowledgement electronically. The signed PDF includes a signing record, and a copy is emailed to the Client and to the Company."]});
  return list.map((c, i) => ({h: `${i + 1}. ${c.h}`, p: c.p}));
}
const CONSENT = "The signer confirmed they had read the acknowledgement, were authorised to sign it for the Client, agreed to it and agreed to sign it electronically.";

const $ = s => document.querySelector(s);
const form = $("#signForm");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const pad2 = n => String(n).padStart(2, "0");
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; };
const ukDate = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ""); return m ? `${m[3]}/${m[2]}/${m[1]}` : ""; };
const clean = s => String(s || "").replace(/\s+/g, " ").trim();

/* ---------- Show the text on the page ---------- */
(() => {
  const doc = $("#doc");
  const add = (tag, text) => { const el = document.createElement(tag); el.textContent = text; doc.append(el); };
  add("h2", "Equipment Liability Acknowledgement");
  INTRO.forEach(t => add("p", t));
  clauses(null).forEach(c => { add("h2", c.h); c.p.forEach(t => add("p", t)); });
})();

// Prefill from a link in the booking email, e.g. ?client=Acme&event=Summer+Fest,+The+Domeevent=Summer+Fest&date=2026-11-05&name=Jo+Bloggs&role=Producer&email=jo@acme.com
const q = new URLSearchParams(location.search);
const pre = (key, sel, max) => { const v = clean(q.get(key)).slice(0, max); if (v) $(sel).value = v; };
pre("client", "#fClient", 100); pre("event", "#fEvent", 160);
pre("name", "#fName", 80); pre("role", "#fRole", 60); pre("schedule", "#fSchedule", 120);
if (/^\d{4}-\d{2}-\d{2}$/.test(q.get("date") || "")) $("#fEventDate").value = q.get("date");
if (q.get("email") && EMAIL_RE.test(q.get("email"))) $("#fEmail").value = q.get("email").trim();
const radio = n => { const el = document.querySelector(`input[name="${n}"]:checked`); return el ? el.value : ""; };
const qs = q.get("storage"), qh = q.get("hazards");
if (STORAGE[qs]) document.querySelector(`input[name="storage"][value="${qs}"]`).checked = true;
if (HAZARD[qh]) document.querySelector(`input[name="hazard"][value="${qh}"]`).checked = true;
function syncProceed(){
  const s = radio("storage"), h = radio("hazard");
  $("#proceedBox").hidden = !(s && h && needsProceed({storage: s, hazard: h}));
}
document.querySelectorAll('input[name="storage"],input[name="hazard"]').forEach(el => el.addEventListener("change", syncProceed));
syncProceed();

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
const pdfSafe = s => clean(s).replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/…/g, "...").normalize("NFC").replace(/[^\x20-\x7E\xA0-\xFF€]/g, "?");

async function buildPdf(d){
  const { PDFDocument, StandardFonts, rgb } = PDFLib;
  const CL = clauses({storage: d.storage, hazard: d.hazard});
  const docText = [DOC_TITLE, DOC_VERSION, ...INTRO, ...CL.flatMap(c => [c.h, ...c.p])].join("\n");
  const docHash = await sha256Hex(new TextEncoder().encode(docText));
  const pdf = await PDFDocument.create();
  const helv = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.08, 0.13, 0.24), grey = rgb(0.42, 0.46, 0.53), body = rgb(0.2, 0.24, 0.31), rule = rgb(0.89, 0.91, 0.93);
  const PW = 595.28, PH = 841.89, M = 56, TW = PW - M * 2;
  let page, y;
  const newPage = () => { page = pdf.addPage([PW, PH]); y = PH - 64; };
  const need = h => { if (y - h < 64) newPage(); };
  const wrap = (text, font, size, width) => {
    const out = []; let row = "";
    for (const w of pdfSafe(text).split(" ")){
      const next = row ? row + " " + w : w;
      if (font.widthOfTextAtSize(next, size) > width && row){ out.push(row); row = w; } else row = next;
    }
    if (row) out.push(row);
    return out;
  };
  const para = (text, {font = helv, size = 10, color = body, gap = 8, x = M, width = TW, lead = 1.45} = {}) => {
    for (const ln of wrap(text, font, size, width)){
      need(size * lead);
      page.drawText(ln, {x, y: y - size, size, font, color});
      y -= size * lead;
    }
    y -= gap;
  };
  const heading = text => { need(40); y -= 6; para(text, {font: bold, size: 11.5, color: ink, gap: 4}); };
  const kv = (label, value) => {
    const lines = wrap(value || "-", helv, 10.5, TW - 150);
    need(lines.length * 15 + 6);
    page.drawText(pdfSafe(label), {x: M, y: y - 10, size: 9, font: bold, color: grey});
    lines.forEach((ln, i) => page.drawText(ln, {x: M + 150, y: y - 10 - i * 15, size: 10.5, font: helv, color: ink}));
    y -= lines.length * 15 + 6;
  };

  newPage();
  page.drawText(pdfSafe(COMPANY.company), {x: M, y, size: 10, font: bold, color: grey}); y -= 26;
  para(DOC_TITLE, {font: bold, size: 20, color: ink, gap: 4});
  para(`Given under Section 19.1.7 of the Terms and Conditions (${TERMS_VERSION})`, {size: 9.5, color: grey, gap: 14});
  page.drawLine({start: {x: M, y: y + 6}, end: {x: PW - M, y: y + 6}, thickness: 0.7, color: rule}); y -= 8;
  kv("Client", d.client);
  kv("Event & location", d.event);
  kv("Event date", ukDate(d.eventDate));
  if (d.schedule) kv("Equipment schedule", d.schedule);
  kv("Secure storage", STORAGE[d.storage].label);
  kv("Hazardous effects", HAZARD[d.hazard].label);
  if (needsProceed(d)) kv("Instruction to proceed", "Given by the Client");
  kv("Signed for the Client by", `${d.name}, ${d.role}`);
  y -= 6;
  page.drawLine({start: {x: M, y: y + 6}, end: {x: PW - M, y: y + 6}, thickness: 0.7, color: rule}); y -= 12;
  INTRO.forEach(t => para(t));
  for (const c of CL){ heading(c.h); c.p.forEach(t => para(t)); }

  // Signature blocks
  need(190);
  y -= 8;
  para("Signed", {font: bold, size: 11.5, color: ink, gap: 10});
  async function sigBlock(label, img, name, role, date){
    need(112);
    page.drawText(pdfSafe(label), {x: M, y: y - 9, size: 9, font: bold, color: grey}); y -= 14;
    const png = await pdf.embedPng(img.data);
    const k = Math.min(38 / img.h, 240 / img.w, 1.2);
    page.drawImage(png, {x: M, y: y - 40, width: img.w * k, height: img.h * k});
    y -= 44;
    page.drawLine({start: {x: M, y}, end: {x: M + 250, y}, thickness: 0.7, color: ink});
    page.drawText(pdfSafe(`${name}, ${role}`), {x: M, y: y - 14, size: 10.5, font: helv, color: ink});
    page.drawText(pdfSafe(`Date: ${ukDate(date)}`), {x: M, y: y - 29, size: 10.5, font: helv, color: ink});
    y -= 46;
  }
  await sigBlock(`For the Client${d.client ? " - " + d.client : ""}`, d.sigImg, d.name, d.role, d.date);
  await sigBlock(`For ${COMPANY.company}`, await typedPng(COMPANY.name), COMPANY.name, COMPANY.role, d.date);

  // Signing record
  newPage();
  const line = (label, value) => {
    page.drawText(pdfSafe(label), {x: M, y: y, size: 10, font: bold, color: grey});
    const rows = wrap(value, helv, 11, PW - M - 210);
    rows.forEach((r, i) => page.drawText(r, {x: 210, y: y - i * 15, size: 11, font: helv, color: ink}));
    y -= rows.length * 15 + 8;
  };
  page.drawText("Electronic signing record", {x: M, y, size: 18, font: bold, color: ink}); y -= 22;
  page.drawText(pdfSafe(`${DOC_TITLE} - ${COMPANY.company}`), {x: M, y, size: 11, font: helv, color: grey}); y -= 34;
  line("Document reference", d.ref);
  line("Document version", `${DOC_VERSION}, given under Terms and Conditions ${TERMS_VERSION}`);
  line("Client", d.client);
  line("Event & location", `${d.event}, ${ukDate(d.eventDate)}`);
  line("Secure storage", STORAGE[d.storage].label);
  line("Hazardous effects", HAZARD[d.hazard].label);
  line("Instruction to proceed", needsProceed(d) ? "Given by the Client" : "Not required");
  line("Signed by", `${d.name}, ${d.role}`);
  line("Email", d.email);
  line("Signed at", `${d.signedAt} (${d.localTime}, ${d.tz})`);
  line("Signature method", d.method === "draw" ? "Drawn on screen" : "Typed name");
  line("Signed on", location.origin + location.pathname);
  line("Browser", d.ua.slice(0, 200));
  line("Text hash (SHA-256)", docHash.slice(0, 32) + " " + docHash.slice(32));
  line("Countersigned", `Signed electronically for ${COMPANY.company} by ${COMPANY.name}, ${COMPANY.role}, when the Client signed.`);
  line("Consent", CONSENT);

  // Page footers
  const pages = pdf.getPages();
  pages.forEach((p, i) => {
    p.drawText(pdfSafe(`${COMPANY.company} - ${DOC_TITLE}`), {x: M, y: 30, size: 8, font: helv, color: grey});
    const t = `Page ${i + 1} of ${pages.length}`;
    p.drawText(t, {x: PW - M - helv.widthOfTextAtSize(t, 8), y: 30, size: 8, font: helv, color: grey});
  });
  pdf.setTitle(`${DOC_TITLE} - signed by ${pdfSafe(d.name)}`);
  pdf.setAuthor(COMPANY.company);
  pdf.setSubject(`Signed ${d.signedAt}`);
  pdf.setCreationDate(new Date());
  return {bytes: await pdf.save(), docHash};
}
function toBase64(bytes){
  let s = ""; const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) s += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  return btoa(s);
}
const fileName = (client, name) => `${DOC_TITLE} - ${clean(client || name).replace(/[\\/:*?"<>|]+/g, "")} - signed.pdf`;

/* ---------- Submit ---------- */
function showErr(msg){ const el = $("#formErr"); el.textContent = msg; el.hidden = !msg; if (msg) el.scrollIntoView({block: "nearest", behavior: "smooth"}); }
form.addEventListener("submit", async e => {
  e.preventDefault();
  showErr("");
  const d = {
    client: clean($("#fClient").value), event: clean($("#fEvent").value), eventDate: $("#fEventDate").value,
    schedule: clean($("#fSchedule").value), name: clean($("#fName").value), role: clean($("#fRole").value),
    email: $("#fEmail").value.trim(), date: todayISO(), method: mode
  };
  if (d.client.length < 2){ $("#fClient").focus(); return showErr("Enter the client or company name."); }
  if (!d.event){ $("#fEvent").focus(); return showErr("Enter the event and where it is."); }
  if (!d.eventDate){ $("#fEventDate").focus(); return showErr("Enter the event date."); }
  d.storage = radio("storage"); d.hazard = radio("hazard");
  if (!d.storage){ document.querySelector('input[name="storage"]').focus(); return showErr("Choose which secure storage option applies."); }
  if (!d.hazard){ document.querySelector('input[name="hazard"]').focus(); return showErr("Choose whether lasers, pyrotechnics or other hazardous effects are present."); }
  if (d.name.length < 2){ $("#fName").focus(); return showErr("Enter your full name."); }
  if (!d.role){ $("#fRole").focus(); return showErr("Enter your position."); }
  if (!EMAIL_RE.test(d.email)){ $("#fEmail").focus(); return showErr("Enter a valid email address, so we can send you a copy."); }
  d.sigImg = mode === "draw" ? drawnPng() : await typedPng(d.name);
  if (!d.sigImg) return showErr("Draw your signature in the box, or switch to Type.");
  if (needsProceed(d) && !$("#fProceed").checked) return showErr("Tick the box to confirm your instruction to proceed.");
  if (!$("#fAgree").checked) return showErr("Tick the box to confirm you’ve read and agree to the acknowledgement.");
  if ($("#fWebsite").value) return;
  if (!window.PDFLib) return showErr("The page didn’t load properly. Refresh and try again.");

  const btn = $("#submitBtn"); btn.disabled = true; btn.textContent = "Signing…";
  const now = new Date();
  d.signedAt = now.toISOString().replace(/\.\d+Z$/, "Z");
  d.localTime = now.toLocaleString("en-GB");
  d.tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  d.ua = navigator.userAgent;
  d.ref = `FHM-ELA-${d.signedAt.slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  let built;
  try { built = await buildPdf(d); }
  catch (err) { console.error(err); btn.disabled = false; btn.textContent = "Sign acknowledgement"; return showErr("Something went wrong making the signed PDF. Refresh the page and try again."); }
  const blob = new Blob([built.bytes], {type: "application/pdf"});
  const name = fileName(d.client, d.name);
  const url = URL.createObjectURL(blob);
  $("#dlSigned").href = url; $("#dlSigned").download = name;

  btn.textContent = "Sending your copy…";
  let sent = false, problem = "";
  try {
    const res = await fetch(ENDPOINT, {method: "POST", credentials: "omit", body: JSON.stringify({
      docType: "equipment-liability", docTitle: DOC_TITLE,
      name: d.name, role: d.role, business: d.client, email: d.email, date: d.date, method: d.method,
      storage: d.storage, hazards: d.hazard, proceed: needsProceed(d), client: d.client, event: d.event, eventDate: d.eventDate, schedule: d.schedule,
      signedAt: d.signedAt, localTime: d.localTime, tz: d.tz, ua: d.ua.slice(0, 300), ref: d.ref, docHash: built.docHash,
      page: location.origin + location.pathname, filename: name, pdf: toBase64(built.bytes), website: $("#fWebsite").value
    })});
    const out = await res.json();
    sent = !!(out && out.ok);
    if (!sent) problem = (out && out.error) || "";
  } catch (err) { problem = "network"; }

  form.hidden = true;
  $("#done").hidden = false;
  $("#sign").scrollTop = 0;
  const first = d.name.split(" ")[0];
  if (sent){
    $("#doneText").textContent = `Thanks, ${first}. The signed acknowledgement has been emailed to you at ${d.email} and to Fraser Hawkshaw Media. You can also download it now.`;
  } else {
    $("#doneText").textContent = `Thanks, ${first}. Your signed acknowledgement is ready, but it couldn’t be emailed automatically.`;
    const se = $("#sendErr");
    se.hidden = false;
    se.innerHTML = "";
    se.append("Please download it and email it to ");
    const a = document.createElement("a");
    a.href = `mailto:${COMPANY.email}?subject=${encodeURIComponent("Signed Equipment Liability Acknowledgement – " + d.client)}`;
    a.textContent = COMPANY.email; se.append(a, " with the PDF attached.");
    if (problem === "limit") se.append(" (Too many were signed from here today.)");
  }
  $("#done").scrollIntoView({block: "nearest", behavior: "smooth"});
});
})();
