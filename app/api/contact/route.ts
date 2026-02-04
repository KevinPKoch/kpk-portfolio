export const runtime = "nodejs";

function clean(v: unknown) {
  return String(v ?? "").trim();
}

export async function POST(req: Request) {
  try {
    const form = await req.formData();

    const name = clean(form.get("name"));
    const email = clean(form.get("email"));
    const message = clean(form.get("message"));

    // Honeypot (falls du im Formular ein hidden field "company" hast)
    const company = clean(form.get("company"));
    if (company) {
      return Response.json({ error: "Submission rejected" }, { status: 400 });
    }

    if (!name || !email || !message) {
      return Response.json({ error: "All fields are required" }, { status: 400 });
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: "Invalid email address" }, { status: 400 });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const CONTACT_TO = process.env.CONTACT_TO || "hello@kevinpkoch.com";

    if (!RESEND_API_KEY) {
      return Response.json(
        { error: "Server not configured (missing RESEND_API_KEY)" },
        { status: 500 }
      );
    }

    // Resend: simplest email sending on Vercel (no extra npm deps)
    const subject = `Portfolio contact: ${name}`;
    const text = `Name: ${name}\nEmail: ${email}\n\n${message}`;

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        // For easiest start, Resend allows onboarding@resend.dev as sender.
        // Later you can verify kevinpkoch.com and use a "from" on your domain.
        from: "Portfolio Contact <onboarding@resend.dev>",
        to: [CONTACT_TO],
        reply_to: email,
        subject,
        text,
      }),
    });

    if (!r.ok) {
      const errText = await r.text().catch(() => "");
      return Response.json(
        { error: "Email send failed", detail: errText.slice(0, 300) },
        { status: 500 }
      );
    }

    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
