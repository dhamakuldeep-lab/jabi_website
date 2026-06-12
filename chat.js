/* Jabi AI chat widget. Set WORKER_URL to your Cloudflare Worker URL to enable. */
(function () {
  var WORKER_URL = "https://jabi-ai.dhama-kuldeep.workers.dev";
  if (WORKER_URL.indexOf("REPLACE") === 0) return; // disabled until configured

  var css = [
    "#jbt{position:fixed;bottom:96px;right:24px;z-index:70;background:linear-gradient(120deg,#00e0a4,#0bb4ff);color:#04121a;border:0;border-radius:999px;padding:14px 22px;font-weight:800;font-size:.95rem;cursor:pointer;box-shadow:0 10px 30px -8px rgba(0,0,0,.6);font-family:'Segoe UI',system-ui,sans-serif}",
    "#jbp{position:fixed;bottom:162px;right:24px;z-index:71;width:360px;max-width:calc(100vw - 32px);height:480px;max-height:70vh;background:#0f1525;border:1px solid #26304a;border-radius:18px;display:none;flex-direction:column;overflow:hidden;box-shadow:0 24px 60px -20px rgba(0,0,0,.8);font-family:'Segoe UI',system-ui,sans-serif}",
    "#jbp.open{display:flex}",
    "#jbh{background:linear-gradient(120deg,#00e0a4,#0bb4ff);color:#04121a;padding:14px 18px;font-weight:800;display:flex;justify-content:space-between;align-items:center}",
    "#jbh button{background:none;border:0;font-size:1.2rem;cursor:pointer;color:#04121a;font-weight:800}",
    "#jbm{position:relative;flex:1;overflow-y:auto;overflow-x:hidden;padding:14px;display:flex;flex-direction:column;gap:10px}",
    ".jb-msg{max-width:85%;padding:10px 14px;border-radius:14px;font-size:.92rem;line-height:1.5;white-space:pre-wrap}",
    ".jb-ai{background:#1a2236;color:#eef2fb;align-self:flex-start;border-bottom-left-radius:4px}",
    ".jb-me{background:linear-gradient(120deg,#00e0a4,#0bb4ff);color:#04121a;align-self:flex-end;border-bottom-right-radius:4px;font-weight:600}",
    "#jbf{display:flex;gap:8px;padding:12px;border-top:1px solid #26304a}",
    "#jbi{flex:1;background:#0a0e1a;border:1.5px solid #26304a;border-radius:10px;color:#eef2fb;padding:10px 12px;font-size:.92rem;font-family:inherit}",
    "#jbi:focus{outline:2px solid #00e0a4;border-color:#00e0a4}",
    "#jbs{background:linear-gradient(120deg,#00e0a4,#0bb4ff);border:0;border-radius:10px;color:#04121a;font-weight:800;padding:0 16px;cursor:pointer}",
    "#jbmic{background:#1a2236;border:1.5px solid #26304a;border-radius:10px;font-size:1.1rem;padding:0 12px;cursor:pointer}",
    "#jbmic.rec{background:#ff5d5d;border-color:#ff5d5d}",
    "#jbh button{margin-left:10px}",
    "@media(max-width:560px){#jbt{right:16px;bottom:86px;padding:12px 18px}#jbp{right:8px;bottom:148px}}"
  ].join("\n");
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  var btn = document.createElement("button"); btn.id = "jbt"; btn.textContent = "🤖 Ask Jabi Guru";
  var panel = document.createElement("div"); panel.id = "jbp";
  panel.innerHTML = '<div id="jbh"><span>Jabi Guru</span><span><button id="jbv" aria-label="Voice" title="Read replies aloud">🔇</button><button id="jbx" aria-label="Close">✕</button></span></div><div id="jbm"></div><div id="jbf"><input id="jbi" placeholder="Type your question here…" maxlength="500"><button id="jbmic" title="Speak your question">🎤</button><button id="jbs">Send</button></div>';
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
      add("assistant", "Namaste! I'm Jabi Guru, your AI guide. Ask me anything about our AI workshops, internships, FDPs or how to book one for your campus or team.");
    }
    if (panel.classList.contains("open")) inp.focus();
  }
  btn.onclick = toggle;
  panel.querySelector("#jbx").onclick = toggle;

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
      var reply = (d.reply || "Sorry, something went wrong. Please try again.").replace(/\*\*/g, "");
      wait.textContent = reply; hist.push({ role: "assistant", content: reply }); speak(reply);
      wait.scrollIntoView({ block: "start", behavior: "auto" });
    }).catch(function () {
      wait.textContent = "Connection problem — please try again, or WhatsApp us at +91 96255 80114.";
    }).finally(function () { busy = false; });
  }
  panel.querySelector("#jbs").onclick = send;
  inp.addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });

  // --- Voice output (read replies aloud) ---
  var voiceOn = false;
  var vbtn = panel.querySelector("#jbv");
  vbtn.onclick = function () {
    voiceOn = !voiceOn;
    vbtn.textContent = voiceOn ? "🔊" : "🔇";
    if (!voiceOn && window.speechSynthesis) speechSynthesis.cancel();
  };
  function speak(text) {
    if (!voiceOn || !window.speechSynthesis) return;
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    var voices = speechSynthesis.getVoices();
    var hasDevanagari = /[\u0900-\u097F]/.test(text);
    var pick = voices.find(function (v) { return hasDevanagari ? v.lang.indexOf("hi") === 0 : v.lang.indexOf("en-IN") === 0; }) ||
               voices.find(function (v) { return v.lang.indexOf("en") === 0; });
    if (pick) u.voice = pick;
    u.rate = 1; speechSynthesis.speak(u);
  }

  // --- Voice input (mic) ---
  var mic = panel.querySelector("#jbmic");
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { mic.style.display = "none"; }
  else {
    var rec = null, listening = false;
    mic.onclick = function () {
      if (listening) { rec.stop(); return; }
      rec = new SR();
      rec.lang = "en-IN"; rec.interimResults = false; rec.maxAlternatives = 1;
      rec.onstart = function () { listening = true; mic.classList.add("rec"); inp.placeholder = "Listening…"; };
      rec.onend = function () { listening = false; mic.classList.remove("rec"); inp.placeholder = "Type your question here…"; };
      rec.onresult = function (e) {
        var t = e.results[0][0].transcript;
        inp.value = t; send();
      };
      rec.onerror = function () { listening = false; mic.classList.remove("rec"); inp.placeholder = "Mic not available — please type"; };
      rec.start();
    };
  }
})();
