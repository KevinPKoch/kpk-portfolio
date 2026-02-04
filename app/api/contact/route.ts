export const runtime = "nodejs";

function clean(v: unknown) {
  return String(v ?? "").trim();
}

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

type ContactPayload = {
  name: string;
  email: string;
  message: string;
  company?: string; // honeypot
};

async function readPayload(req: Request): Promise<ContactPayload> {
  const contentType = req.headers.get("content-type") || "";

  // ✅ Supports multipart/form-data (FormData)
  if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
    const form = await req.formData();
    return {
      name: clean(form.get("name")),
      email: clean(form.get("email")),
      message: clean(form.get("message")),
      company: clean(form.get("company")),
    };
  }

  // ✅ Supports JSON body
  if (contentType.includes("application/json")) {
    const json = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    return {
      name: clean(json.name),
      email: clean(json.email),
      message: clean(json.message),
      company: clean(json.company),
    };
  }

  // Fallback: try FormData, then JSON
  try {
    const form = await req.formData();
    return {
      name: clean(form.get("name")),
      email: clean(form.get("email")),
      message: clean(form.get("message")),
      company: clean(form.get("company")),
    };
  } catch {
    const json = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    return {
      name: clean(json.name),
      email: clean(json.email),
      message: clean(json.message),
      company: clean(json.company),
    };
  }
}

export async function POST(req: Request) {
  try {
    const { name, email, message, company } = await readPayload(req);

    // Honeypot (spam bot trap)
    if (company) {
      return Response.json({ error: "Submission rejected" }, { status: 400 });
    }

    if (!name || !email || !message) {
      return Response.json({ error: "All fields are required" }, { status: 400 });
    }

    if (!isEmail(email)) {
      return Response.json({ error: "Invalid email address" }, { status: 400 });
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const CONTACT_TO = process.env.CONTACT_TO || "hello@kevinpkoch.com";

    // Optional: set this in Vercel once your domain is verified in Resend
    // e.g. "Kevin Koch <hello@kevinpkoch.com>"
    const CONTACT_FROM = process.env.CONTACT_FROM || "Portfolio Contact <onboarding@resend.dev>";

    if (!RESEND_API_KEY) {
      return Response.json(
        { error: "Server not configured (missing RESEND_API_KEY)" },
        { status: 500 }
      );
    }

    const subject = `Portfolio contact: ${name}`;
    const text = `Name: ${name}\nEmail: ${email}\n\n${message}`;

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: CONTACT_FROM,
        to: [CONTACT_TO],
        reply_to: email,
        subject,
        text,
      }),
    });

    if (!r.ok) {
      const errText = await r.text().catch(() => "");
      return Response.json(
        {
          error: "Email send failed",
          detail: errText.slice(0, 600),
        },
        { status: 500 }
      );
    }

    return Response.json({ ok: true });
  } catch (e) {
    // keep response stable, but helpful
    return Response.json(
      { error: "Unexpected server error", detail: clean((e as Error)?.message) },
      { status: 500 }
    );
  }
}
