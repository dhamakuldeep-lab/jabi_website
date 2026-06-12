/* Jabi AI chat widget. Set WORKER_URL to your Cloudflare Worker URL to enable. */
(function () {
  var WORKER_URL = "https://jabi-ai.dhama-kuldeep.workers.dev";
  if (WORKER_URL.indexOf("REPLACE") === 0) return; // disabled until configured

  var css = [
    "#jbt{position:fixed;bottom:24px;left:24px;z-index:70;background:linear-gradient(120deg,#00e0a4,#0bb4ff);color:#04121a;border:0;border-radius:999px;padding:14px 22px;font-weight:800;font-size:.95rem;cursor:pointer;box-shadow:0 10px 30px -8px rgba(0,0,0,.6);font-family:'Segoe UI',system-ui,sans-serif}",
    "#jbp{position:fixed;bottom:90px;left:24px;z-index:71;width:360px;max-width:calc(100vw - 32px);height:480px;max-height:70vh;background:#0f1525;border:1px solid #26304a;border-radius:18px;display:none;flex-direction:column;overflow:hidden;box-shadow:0 24px 60px -20px rgba(0,0,0,.8);font-family:'Segoe UI',system-ui,sans-serif}",
    "#jbp.open{display:flex}",
    "#jbh{background:linear-gradient(120deg,#00e0a4,#0bb4ff);color:#04121a;padding:14px 18px;font-weight:800;display:flex;justify-content:space-between;align-items:center}",
    "#jbh button{background:none;border:0;font-size:1.2rem;cursor:pointer;color:#04121a;font-weight:800}",
    "#jbm{flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px}",
    ".jb-msg{max-width:85%;padding:10px 14px;border-radius:14px;font-size:.92rem;line-height:1.5;white-space:pre-wrap}",
    ".jb-ai{background:#1a2236;color:#eef2fb;align-self:flex-start;border-bottom-left-radius:4px}",
    ".jb-me{background:linear-gradient(120deg,#00e0a4,#0bb4ff);color:#04121a;align-self:flex-end;border-bottom-right-radius:4px;font-weight:600}",
    "#jbf{display:flex;gap:8px;padding:12px;border-top:1px solid #26304a}",
    "#jbi{flex:1;background:#0a0e1a;border:1.5px solid #26304a;border-radius:10px;color:#eef2fb;padding:10px 12px;font-size:.92rem;font-family:inherit}",
    "#jbi:focus{outline:2px solid #00e0a4;border-color:#00e0a4}",
    "#jbs{background:linear-gradient(120deg,#00e0a4,#0bb4ff);border:0;border-radius:10px;color:#04121a;font-weight:800;padding:0 16px;cursor:pointer}",
    "@media(max-width:560px){#jbt{left:16px;bottom:16px;padding:12px 18px}#jbp{left:8px;bottom:76px}}"
  ].join("\n");
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  var btn = document.createElement("button"); btn.id = "jbt"; btn.textContent = "🤖 Ask Jabi AI";
  var panel = document.createElement("div"); panel.id = "jbp";
  panel.innerHTML = '<div id="jbh"><span>Jabi AI Assistant</span><button aria-label="Close">✕</button></div><div id="jbm"></div><div id="jbf"><input id="jbi" placeholder="Ask about our workshops…" maxlength="500"><button id="jbs">Send</button></div>';
  document.body.appendChild(btn); document.body.appendChild(panel);

  var hist = [], busy = false;
  var box = panel.querySelector("#jbm"), inp = panel.querySelector("#jbi");

  function add(role, text) {
    var d = document.createElement("div");
    d.className = "jb-msg " + (role === "user" ? "jb-me" : "jb-ai");
    d.textContent = text; box.appendChild(d); box.scrollTop = box.scrollHeight; return d;
  }
  function toggle() {
    panel.classList.toggle("open");
    if (panel.classList.contains("open") && !hist.length) {
      add("assistant", "Namaste! I'm Jabi AI. Ask me anything about our AI workshops, internships, FDPs or how to book one for your campus or team.");
    }
    if (panel.classList.contains("open")) inp.focus();
  }
  btn.onclick = toggle;
  panel.querySelector("#jbh button").onclick = toggle;

  function send() {
    var t = inp.value.trim();
    if (!t || busy) return;
    inp.value = ""; add("user", t); hist.push({ role: "user", content: t });
    busy = true;
    var wait = add("assistant", "…");
    fetch(WORKER_URL, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: hist })
    }).then(function (r) { return r.json(); }).then(function (d) {
      var reply = d.reply || "Sorry, something went wrong. Please try again.";
      wait.textContent = reply; hist.push({ role: "assistant", content: reply });
      box.scrollTop = box.scrollHeight;
    }).catch(function () {
      wait.textContent = "Connection problem — please try again, or WhatsApp us at +91 96255 80114.";
    }).finally(function () { busy = false; });
  }
  panel.querySelector("#jbs").onclick = send;
  inp.addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });
})();
