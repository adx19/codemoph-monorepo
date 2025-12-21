import * as vscode from "vscode";
import { EXTENSION_LANGUAGE_MAP, Language } from "./languages";
import { ALLOWED_CONVERSIONS } from "./conversions";

let isConversionRunning = false;
let extensionContext: vscode.ExtensionContext;

const fetch = async (url: string, options?: any) => {
  const mod = await import("node-fetch");
  return mod.default(url, options);
};

export function activate(context: vscode.ExtensionContext) {
  extensionContext = context;

  vscode.window.registerUriHandler({
    async handleUri(uri) {
      const params = new URLSearchParams(uri.query);
      let token = params.get("token");

      if (!token) {
        vscode.window.showErrorMessage("CodeMorph login failed.");
        return;
      }

      try {
        token = decodeURIComponent(token);
      } catch {}

      await context.secrets.store("codemorph_token", token);
      vscode.window.showInformationMessage("Logged into CodeMorph successfully.");
    }
  });

  context.subscriptions.push(
    vscode.commands.registerCommand("codemorph.start", () => {
      vscode.window.showInformationMessage("CodeMorph Activated");
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidRenameFiles(async (event) => {
      for (const file of event.files) {
        const fromExt = getExtension(file.oldUri);
        const toExt = getExtension(file.newUri);

        if (!fromExt || !toExt || fromExt === toExt) continue;
        if (!isSupportedConversion(fromExt, toExt)) continue;

        // ⭐ IMPORTANT — wait for VS Code to finish renaming
        await new Promise(res => setTimeout(res, 300));

        await handleConversion(
          file.newUri,
          EXTENSION_LANGUAGE_MAP[fromExt],
          EXTENSION_LANGUAGE_MAP[toExt]
        );
      }
    })
  );
}

function getExtension(uri: vscode.Uri): string | null {
  const parts = uri.path.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : null;
}

function isSupportedConversion(fromExt: string, toExt: string): boolean {
  const fromLang = EXTENSION_LANGUAGE_MAP[fromExt];
  const toLang = EXTENSION_LANGUAGE_MAP[toExt];
  if (!fromLang || !toLang) return false;
  return ALLOWED_CONVERSIONS[fromLang]?.includes(toLang) ?? false;
}

async function getAuthToken(): Promise<string | undefined> {
  return await extensionContext.secrets.get("codemorph_token");
}

async function handleConversion(
  fileUri: vscode.Uri,
  fromLang: Language,
  toLang: Language
) {
  if (isConversionRunning) {
    vscode.window.showWarningMessage("CodeMorph is already converting.");
    return;
  }

  isConversionRunning = true;

  try {
    const bytes = await vscode.workspace.fs.readFile(fileUri);
    const sourceCode = Buffer.from(bytes).toString("utf8");

    if (!sourceCode.trim()) {
      vscode.window.showWarningMessage("File is empty.");
      return;
    }

    const choice = await vscode.window.showInformationMessage(
      `Convert ${fromLang.toUpperCase()} → ${toLang.toUpperCase()}?`,
      { modal: true },
      "Convert",
      "Cancel"
    );

    if (choice !== "Convert") return;

    const addComments = await vscode.window.showQuickPick(["Yes", "No"], {
      placeHolder: "Add comments?",
    });

    if (!addComments) return;

    const converted = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Converting...",
        cancellable: false,
      },
      async () =>
        await convertWithAI(
          sourceCode,
          fromLang,
          toLang,
          addComments === "Yes"
        )
    );

    // 🔥 NEW: Directly overwrite renamed file
    const doc = await vscode.workspace.openTextDocument(fileUri);
    await vscode.window.showTextDocument(doc);

    const edit = new vscode.WorkspaceEdit();
    const lastLine = Math.max(0, doc.lineCount - 1);
    const fullRange = new vscode.Range(
      new vscode.Position(0, 0),
      doc.lineAt(lastLine).range.end
    );

    edit.replace(fileUri, fullRange, converted);
    await vscode.workspace.applyEdit(edit);

    vscode.window.showInformationMessage("Conversion applied successfully!");

  } catch (e: any) {
    vscode.window.showErrorMessage(`Conversion failed: ${e.message}`);
  } finally {
    isConversionRunning = false;
  }
}

async function convertWithAI(
  code: string,
  from: Language,
  to: Language,
  withComments: boolean
): Promise<string> {
  const authToken = await getAuthToken();
  const backendUrl = "https://codemoph-monorepo-production.up.railway.app";

  if (!authToken) {
    throw new Error("Login required. Open CodeMorph website and login.");
  }

  const prompt = `
Convert the following ${from} code to ${to}.
${withComments ? "Add comments." : "Do NOT add comments."}
Return ONLY valid ${to} code.

CODE:
${code}
`;

  const res = await fetch(`${backendUrl}/convert`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      prompt,
      fromLang: from,
      toLang: to,
    }),
  });

  type ConvertResponse = {
    reply?: string;
    message?: string;
    debug?: string;
  };

  let d: ConvertResponse = {};

  try {
    d = (await res.json()) as ConvertResponse;
  } catch {
    d = {};
  }

  if (!res.ok) {
    throw new Error(d.message || d.debug || "Conversion failed.");
  }

  if (!d.reply) {
    throw new Error("No result returned.");
  }

  const cleaned = stripMarkdown(d.reply);
  console.log("REPLY AFTER STRIP ===>", cleaned);

  return cleaned;
}

function stripMarkdown(code: string): string {
  const fenced = code.match(/```[\s\S]*?```/);

  if (fenced) {
    return fenced[0]
      .replace(/```[a-zA-Z0-9]*/g, "")
      .replace(/```/g, "")
      .trim();
  }

  return code.trim();
}

export function deactivate() {}
