import "server-only";

const SENDGRID_API_URL = "https://api.sendgrid.com/v3/mail/send";

function isAllowedRecipient(to: string, allowlist: string[]) {
  if (allowlist.length === 0) return false;
  return allowlist.includes(to.trim().toLowerCase());
}

export async function POST(request: Request) {
  let to: unknown;
  let subject: unknown;
  let text: unknown;
  let html: unknown;
  let dryRun: unknown;

  try {
    const body = await request.json();
    to = body?.to;
    subject = body?.subject;
    text = body?.text;
    html = body?.html;
    dryRun = body?.dry_run;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!to || typeof to !== "string") {
    return new Response(JSON.stringify({ ok: false, error: "Missing to" }), {
      status: 400,
    });
  }
  if (!subject || typeof subject !== "string") {
    return new Response(JSON.stringify({ ok: false, error: "Missing subject" }), {
      status: 400,
    });
  }
  if (!text || typeof text !== "string") {
    return new Response(JSON.stringify({ ok: false, error: "Missing text" }), {
      status: 400,
    });
  }
  if (typeof html !== "undefined" && typeof html !== "string") {
    return new Response(JSON.stringify({ ok: false, error: "Invalid html" }), {
      status: 400,
    });
  }

  const dry_run = typeof dryRun === "boolean" ? dryRun : true;

  if (dry_run) {
    return new Response(
      JSON.stringify({
        ok: true,
        dry_run: true,
        preview: {
          to,
          subject,
          has_html: typeof html === "string" && html.length > 0,
          text,
        },
      }),
      { status: 200 }
    );
  }

  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;
  const fromName = process.env.SENDGRID_FROM_NAME;

  if (!fromEmail) {
    return new Response(
      JSON.stringify({ ok: false, error: "SENDGRID_FROM_EMAIL not configured" }),
      { status: 500 }
    );
  }

  const allowlist = String(process.env.SENDGRID_ALLOWED_RECIPIENTS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (!isAllowedRecipient(to, allowlist)) {
    return new Response(
      JSON.stringify({
        ok: false,
        error:
          "Recipient not allowlisted. Add email to SENDGRID_ALLOWED_RECIPIENTS to enable sending.",
        to,
        allowlist,
      }),
      { status: 403 }
    );
  }

  const payload: any = {
    personalizations: [
      {
        to: [{ email: to }],
        subject,
      },
    ],
    from: {
      email: fromEmail,
      ...(fromName ? { name: fromName } : {}),
    },
    content: [
      {
        type: "text/plain",
        value: text,
      },
      ...(typeof html === "string"
        ? [
            {
              type: "text/html",
              value: html,
            },
          ]
        : []),
    ],
  };

  if (!apiKey) {
    return new Response(
      JSON.stringify({ ok: false, error: "SENDGRID_API_KEY not configured" }),
      { status: 500 }
    );
  }

  try {
    const res = await fetch(SENDGRID_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return new Response(
        JSON.stringify({
          ok: false,
          error: `SendGrid error: ${res.status}`,
          details: text || null,
        }),
        { status: 502 }
      );
    }

    return new Response(JSON.stringify({ ok: true, dry_run: false }), {
      status: 200,
    });
  } catch (error) {
    const msg =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : JSON.stringify(error);
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
    });
  }
}
