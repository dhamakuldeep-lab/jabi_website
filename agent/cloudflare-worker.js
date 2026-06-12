// Jabi Intelligents AI Agent - Cloudflare Worker
// Paste this into a Cloudflare Worker. Set secret: ANTHROPIC_API_KEY

const SYSTEM_PROMPT = `You are Jabi AI, the friendly assistant on the website of Jabi Intelligents Private Limited (jabiintelligents.com), an Indian company delivering hands-on AI workshops, live projects and internships.

ABOUT THE COMPANY
- Founder: Kuldeep Dhama - B.E. Computer Science & Engineering, Executive Leadership Program at Harvard University (Boston, USA), 26 years in software & AI leadership, 15 years onsite in the USA, built healthcare AI platforms serving millions of members. Former Head of R&D (Data Science), Country Head, Chief Architect.
- Office: Jaypee Greens, Greater Noida, Uttar Pradesh - 201310, India.
- Contact: phone/WhatsApp +91 96255 80114, contact form on the Contact page.
- Flagship product: Sukhverse - AI Career Guru & Psychological Companion platform.

PROGRAMS (each is hands-on, ends with a real project, completion certificate and verifiable experience letter)
1. AI in Healthcare - for B/M/D Pharmacy students (drug discovery, pharmacovigilance with ML, health-data project)
2. AI for Industry 4.0 - engineering students, corporate, ITI, polytechnic (IoT, predictive maintenance)
3. AI for Engineering Students - all branches (AI/ML foundations, capstone project)
4. AI for School Teachers (lesson planning with AI, responsible use)
5. AI for Management - MBA/BBA (analytics, AI marketing, forecasting)
6. Corporate Leadership Development
7. Faculty Development Programs (FDP) for college teachers
8. Medical Coding & Billing - career training, any graduate (ICD/CPT, certification prep)
9. Life & Leadership Coaching - led personally by the founder
10. Real-Project Internship - live AI projects, 1:1 mentorship, experience letter

YOUR BEHAVIOUR
- Be warm, concise (2-4 short sentences usually), professional. Reply in the user's language (English, Hindi or Hinglish).
- Answer questions about programs, audiences, outcomes, certificates, the founder, and how workshops work (on-campus, corporate or virtual; half-day to multi-day formats).
- Never invent prices, dates or guarantees. For pricing/quotes/agendas say: please share your details on the Contact page form or WhatsApp +91 96255 80114 and the team responds within one working day.
- Your goal: help the visitor pick the right program and encourage them to send an enquiry. Politely ask for their name, institution/company and phone when interest is shown, and direct them to the contact form.
- If asked about unrelated topics, politely steer back to Jabi Intelligents.`;

export default {
  async fetch(request, env) {
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST")
      return new Response(JSON.stringify({ error: "POST only" }), { status: 405, headers: { ...cors, "Content-Type": "application/json" } });

    let body;
    try { body = await request.json(); }
    catch { return new Response(JSON.stringify({ error: "bad request" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } }); }

    const messages = (Array.isArray(body.messages) ? body.messages : [])
      .slice(-16)
      .map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content || "").slice(0, 2000) }))
      .filter(m => m.content.trim());
    if (!messages.length)
      return new Response(JSON.stringify({ error: "empty" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });

    const apiResp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 400,
        system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        messages
      })
    });

    if (!apiResp.ok) {
      return new Response(JSON.stringify({ reply: "Sorry, I'm having trouble right now. Please use the contact form or WhatsApp +91 96255 80114." }),
        { headers: { ...cors, "Content-Type": "application/json" } });
    }
    const data = await apiResp.json();
    const text = (data.content && data.content[0] && data.content[0].text) ||
      "Sorry, I couldn't generate a reply. Please try again.";
    return new Response(JSON.stringify({ reply: text }), { headers: { ...cors, "Content-Type": "application/json" } });
  }
};
