import { NextRequest, NextResponse } from "next/server";
import { getFreshMsAccessToken } from "@/lib/microsoft-auth";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

async function graphFetch(path: string, accessToken: string, options?: RequestInit) {
  const res = await fetch(`${GRAPH_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  return res;
}

// Well-known folder name map
const WELL_KNOWN_FOLDERS: Record<string, string> = {
  inbox: "inbox",
  sent: "sentitems",
  drafts: "drafts",
  archive: "archive",
  deleted: "deleteditems",
  junk: "junkemail",
};

// GET /api/microsoft/emails?folder=inbox&search=query&top=25&skip=0
// GET /api/microsoft/emails?listFolders=true  — list all mail folders
// GET /api/microsoft/emails?id=messageId      — fetch single message
export async function GET(request: NextRequest) {
  const { accessToken } = await getFreshMsAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const url = new URL(request.url);

  // List all mail folders
  if (url.searchParams.get("listFolders") === "true") {
    const res = await graphFetch(
      `/me/mailFolders?$top=100&$select=id,displayName,parentFolderId,totalItemCount,unreadItemCount,childFolderCount`,
      accessToken
    );
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }
    const data = await res.json();
    // Also fetch child folders for inbox
    const allFolders = data.value || [];
    const inboxFolder = allFolders.find((f: any) => f.displayName?.toLowerCase() === "inbox");
    if (inboxFolder && inboxFolder.childFolderCount > 0) {
      const childRes = await graphFetch(
        `/me/mailFolders/${inboxFolder.id}/childFolders?$top=100&$select=id,displayName,parentFolderId,totalItemCount,unreadItemCount,childFolderCount`,
        accessToken
      );
      if (childRes.ok) {
        const childData = await childRes.json();
        allFolders.push(...(childData.value || []));
      }
    }
    return NextResponse.json({ folders: allFolders });
  }

  const folder = url.searchParams.get("folder") || "inbox";
  const search = url.searchParams.get("search") || "";
  const top = url.searchParams.get("top") || "25";
  const skip = url.searchParams.get("skip") || "0";
  const messageId = url.searchParams.get("id");

  // Fetch single message
  if (messageId) {
    const res = await graphFetch(
      `/me/messages/${messageId}?$select=id,subject,from,toRecipients,ccRecipients,bccRecipients,body,receivedDateTime,isRead,flag,hasAttachments,attachments,parentFolderId,importance`,
      accessToken
    );
    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }
    const message = await res.json();
    return NextResponse.json({ message });
  }

  // Resolve folder: well-known name or custom folder ID
  const graphFolder = WELL_KNOWN_FOLDERS[folder.toLowerCase()] || folder;
  let path = `/me/mailFolders/${graphFolder}/messages?$top=${top}&$skip=${skip}&$orderby=receivedDateTime desc&$select=id,subject,from,toRecipients,ccRecipients,bodyPreview,receivedDateTime,isRead,flag,hasAttachments,importance,parentFolderId`;

  if (search) {
    path += `&$search="${encodeURIComponent(search)}"`;
  }

  const res = await graphFetch(path, accessToken);
  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json({
    emails: data.value || [],
    nextLink: data["@odata.nextLink"] || null,
    count: data["@odata.count"] || null,
  });
}

// POST /api/microsoft/emails
// Actions: send, reply, forward, move, markRead, markUnread, flag, delete
export async function POST(request: NextRequest) {
  const { accessToken } = await getFreshMsAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await request.json();
  const { action } = body;

  switch (action) {
    case "send": {
      const { to, cc, bcc, subject, bodyContent, bodyType } = body;
      const message = {
        subject,
        body: {
          contentType: bodyType || "Text",
          content: bodyContent,
        },
        toRecipients: (to || []).map((email: string) => ({
          emailAddress: { address: email },
        })),
        ccRecipients: (cc || []).map((email: string) => ({
          emailAddress: { address: email },
        })),
        bccRecipients: (bcc || []).map((email: string) => ({
          emailAddress: { address: email },
        })),
      };

      const res = await graphFetch("/me/sendMail", accessToken, {
        method: "POST",
        body: JSON.stringify({ message, saveToSentItems: true }),
      });

      if (!res.ok && res.status !== 202) {
        const err = await res.text();
        return NextResponse.json({ error: err }, { status: res.status });
      }
      return NextResponse.json({ success: true });
    }

    case "reply": {
      const { messageId, comment } = body;
      const res = await graphFetch(`/me/messages/${messageId}/reply`, accessToken, {
        method: "POST",
        body: JSON.stringify({ comment }),
      });
      if (!res.ok && res.status !== 202) {
        const err = await res.text();
        return NextResponse.json({ error: err }, { status: res.status });
      }
      return NextResponse.json({ success: true });
    }

    case "forward": {
      const { messageId, toRecipients, comment } = body;
      const res = await graphFetch(`/me/messages/${messageId}/forward`, accessToken, {
        method: "POST",
        body: JSON.stringify({
          comment,
          toRecipients: (toRecipients || []).map((email: string) => ({
            emailAddress: { address: email },
          })),
        }),
      });
      if (!res.ok && res.status !== 202) {
        const err = await res.text();
        return NextResponse.json({ error: err }, { status: res.status });
      }
      return NextResponse.json({ success: true });
    }

    case "move": {
      const { messageId, destinationFolder } = body;
      const folderMap: Record<string, string> = {
        inbox: "inbox",
        archive: "archive",
        deleted: "deleteditems",
        junk: "junkemail",
        drafts: "drafts",
      };
      const destinationId = folderMap[destinationFolder] || destinationFolder;
      const res = await graphFetch(`/me/messages/${messageId}/move`, accessToken, {
        method: "POST",
        body: JSON.stringify({ destinationId }),
      });
      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: err }, { status: res.status });
      }
      const moved = await res.json();
      return NextResponse.json({ message: moved });
    }

    case "markRead":
    case "markUnread": {
      const { messageId } = body;
      const res = await graphFetch(`/me/messages/${messageId}`, accessToken, {
        method: "PATCH",
        body: JSON.stringify({ isRead: action === "markRead" }),
      });
      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: err }, { status: res.status });
      }
      return NextResponse.json({ success: true });
    }

    case "flag": {
      const { messageId, flagStatus } = body;
      const res = await graphFetch(`/me/messages/${messageId}`, accessToken, {
        method: "PATCH",
        body: JSON.stringify({
          flag: { flagStatus: flagStatus || "flagged" },
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: err }, { status: res.status });
      }
      return NextResponse.json({ success: true });
    }

    case "delete": {
      const { messageId } = body;
      const res = await graphFetch(`/me/messages/${messageId}`, accessToken, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) {
        const err = await res.text();
        return NextResponse.json({ error: err }, { status: res.status });
      }
      return NextResponse.json({ success: true });
    }

    case "createFolder": {
      const { folderName, parentFolderId } = body;
      if (!folderName) {
        return NextResponse.json({ error: "folderName required" }, { status: 400 });
      }
      const parentPath = parentFolderId
        ? `/me/mailFolders/${parentFolderId}/childFolders`
        : `/me/mailFolders`;
      const res = await graphFetch(parentPath, accessToken, {
        method: "POST",
        body: JSON.stringify({ displayName: folderName }),
      });
      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: err }, { status: res.status });
      }
      const folder = await res.json();
      return NextResponse.json({ folder });
    }

    case "renameFolder": {
      const { folderId, newName } = body;
      if (!folderId || !newName) {
        return NextResponse.json({ error: "folderId and newName required" }, { status: 400 });
      }
      const res = await graphFetch(`/me/mailFolders/${folderId}`, accessToken, {
        method: "PATCH",
        body: JSON.stringify({ displayName: newName }),
      });
      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: err }, { status: res.status });
      }
      const folder = await res.json();
      return NextResponse.json({ folder });
    }

    case "deleteFolder": {
      const { folderId } = body;
      if (!folderId) {
        return NextResponse.json({ error: "folderId required" }, { status: 400 });
      }
      const res = await graphFetch(`/me/mailFolders/${folderId}`, accessToken, {
        method: "DELETE",
      });
      if (!res.ok && res.status !== 204) {
        const err = await res.text();
        return NextResponse.json({ error: err }, { status: res.status });
      }
      return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
