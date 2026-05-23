import { ImapFlow } from "imapflow";

export interface IMAPFolder {
  name: string;
  messages: number;
  unseen: number;
}

export interface IMAPData {
  folders: IMAPFolder[];
  totalUnseen: number;
}

const EXTRA_FOLDERS = ["Sent", "Drafts", "Spam", "Trash"];

export async function fetchIMAP(
  host: string,
  port: number,
  user: string,
  password: string,
  extraFolders: string[] = []
): Promise<IMAPData> {
  const client = new ImapFlow({
    host,
    port,
    secure: port === 993,
    auth: { user, pass: password },
    logger: false,
    tls: { rejectUnauthorized: false },
  });

  await client.connect();

  const foldersToCheck = ["INBOX", ...extraFolders];
  const folders: IMAPFolder[] = [];

  for (const name of foldersToCheck) {
    try {
      const status = await client.status(name, { messages: true, unseen: true });
      folders.push({
        name,
        messages: status.messages ?? 0,
        unseen: status.unseen ?? 0,
      });
    } catch {
      // Folder may not exist — skip silently
    }
  }

  await client.logout();

  return {
    folders,
    totalUnseen: folders.reduce((sum, f) => sum + f.unseen, 0),
  };
}
