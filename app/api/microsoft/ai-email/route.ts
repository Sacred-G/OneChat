import { NextRequest, NextResponse } from "next/server";

// AI-powered email assistance endpoint
// Uses OpenAI to help compose, summarize, and organize emails
export async function POST(request: NextRequest) {
  const { OPENAI_API_KEY } = process.env;
  if (!OPENAI_API_KEY) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { action, emailBody, emailSubject, context, tone, instructions } = body;

  let systemPrompt = "";
  let userPrompt = "";

  switch (action) {
    case "compose": {
      systemPrompt =
        "You are a professional email assistant. Write clear, concise, and well-structured emails. Match the requested tone and style.";
      userPrompt = `Write an email with the following details:\nTone: ${tone || "professional"}\nInstructions: ${instructions}\n${context ? `Context: ${context}` : ""}`;
      break;
    }

    case "reply": {
      systemPrompt =
        "You are a professional email assistant. Write a reply to the given email. Be concise and address all points raised in the original email.";
      userPrompt = `Write a reply to this email:\nSubject: ${emailSubject}\nBody: ${emailBody}\n\nTone: ${tone || "professional"}\n${instructions ? `Additional instructions: ${instructions}` : ""}`;
      break;
    }

    case "summarize": {
      systemPrompt =
        "You are an email assistant. Provide a brief, clear summary of the email content. Highlight key action items if any.";
      userPrompt = `Summarize this email:\nSubject: ${emailSubject}\nBody: ${emailBody}`;
      break;
    }

    case "improve": {
      systemPrompt =
        "You are a professional writing assistant. Improve the given email draft for clarity, tone, and professionalism while preserving the original intent.";
      userPrompt = `Improve this email draft:\nSubject: ${emailSubject || "(no subject)"}\nBody: ${emailBody}\n\nTone: ${tone || "professional"}\n${instructions ? `Additional instructions: ${instructions}` : ""}`;
      break;
    }

    case "categorize": {
      systemPrompt =
        'You are an email organization assistant. Categorize emails into appropriate folders/labels. Return a JSON object with fields: category (string), priority (high/medium/low), suggestedAction (archive/reply/flag/delete/none), and reason (string).';
      userPrompt = `Categorize this email:\nSubject: ${emailSubject}\nFrom: ${context}\nBody preview: ${emailBody}`;
      break;
    }

    case "sort-inbox": {
      const { emails: emailList, folders: folderList } = body;
      if (!emailList || !folderList) {
        return NextResponse.json({ error: "emails and folders required" }, { status: 400 });
      }

      const sortSystemPrompt = `You are an intelligent email organizer. Given a list of emails and available folders, decide which folder each email should be moved to.

Rules:
- Only move emails if they clearly belong in a specific folder. If unsure, assign "skip" as the folder.
- Match emails to folders based on subject, sender, and preview content.
- Common patterns: newsletters → Newsletters, receipts/orders → Shopping/Receipts, social notifications → Social, work-related → Work, etc.
- Return ONLY a valid JSON array of objects with fields: emailId (string), folderId (string or "skip"), reason (string, brief).
- Do NOT include any markdown formatting, code fences, or extra text. Return raw JSON only.`;

      const emailSummaries = emailList.map((e: any, i: number) =>
        `${i + 1}. ID: ${e.id}\n   Subject: ${e.subject}\n   From: ${e.from}\n   Preview: ${e.preview}`
      ).join("\n\n");

      const folderSummaries = folderList.map((f: any) =>
        `- "${f.name}" (ID: ${f.id})`
      ).join("\n");

      const sortUserPrompt = `Available folders:\n${folderSummaries}\n\nEmails to sort:\n${emailSummaries}`;

      try {
        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "system", content: sortSystemPrompt },
              { role: "user", content: sortUserPrompt },
            ],
            temperature: 0.3,
            max_tokens: 4000,
          }),
        });

        if (!res.ok) {
          const err = await res.text();
          return NextResponse.json({ error: err }, { status: res.status });
        }

        const data = await res.json();
        let content = data.choices?.[0]?.message?.content || "[]";
        // Strip markdown code fences if present
        content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
        const assignments = JSON.parse(content);
        return NextResponse.json({ assignments });
      } catch (err: any) {
        return NextResponse.json(
          { error: err?.message || "AI sort failed" },
          { status: 500 }
        );
      }
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";

    return NextResponse.json({ result: content });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "AI request failed" },
      { status: 500 }
    );
  }
}
