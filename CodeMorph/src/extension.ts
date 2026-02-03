import * as vscode from "vscode";
import { AccountViewProvider } from "./AccountViewProvider";
import { CONVERT_API_URL, WEBSITE_URL } from "./config";

import { EXTENSION_LANGUAGE_MAP, Language } from "./languages";
import { ALLOWED_CONVERSIONS } from "./conversions";

let isConversionRunning = false;
let extensionContext: vscode.ExtensionContext;
let outputChannel: vscode.OutputChannel;
let accountProvider: AccountViewProvider;
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

export function activate(context: vscode.ExtensionContext) {
  extensionContext = context;

  outputChannel = vscode.window.createOutputChannel("CodeMorph");
  outputChannel.show(true);
  context.subscriptions.push(outputChannel);

  console.log("DEBUG: Activating CodeMorph extension");

  // ───────────── Account View ─────────────
  accountProvider = new AccountViewProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      AccountViewProvider.viewType,
      accountProvider
    )
  );
  console.log("DEBUG: AccountViewProvider registered");

  // ───────────── Logout Command ─────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("codemorph.logout", async () => {
      console.log("DEBUG: Logout command triggered");
      await context.secrets.delete("codemorph_token");
      vscode.window.showInformationMessage("Logged out of CodeMorph");
      accountProvider?.refresh();
    })
  );

  // ───────────── Login Redirect Handler ─────────────
  context.subscriptions.push(
    vscode.window.registerUriHandler({
      async handleUri(uri) {
        console.log("DEBUG: URI handler called with:", uri.toString());
        const params = new URLSearchParams(uri.query);
        let token = params.get("token");

        if (!token) {
          vscode.window.showErrorMessage("CodeMorph login failed.");
          console.error("DEBUG: No token found in URI");
          return;
        }

        token = decodeURIComponent(token);
        console.log("DEBUG: Token from URI:", token);

        await context.secrets.store("codemorph_token", token);
        console.log("DEBUG: Token stored in VS Code secrets");

        vscode.window.showInformationMessage(
          "Logged into CodeMorph successfully."
        );

        console.log("DEBUG: Refreshing AccountViewProvider after login");
        accountProvider?.refresh();
      },
    })
  );

  // ───────────── Activation Command ─────────────
  context.subscriptions.push(
    vscode.commands.registerCommand("codemorph.start", () => {
      console.log("DEBUG: CodeMorph start command executed");
      vscode.window.showInformationMessage("CodeMorph Activated");
    })
  );

  // ───────────── File Rename Listener ─────────────
  context.subscriptions.push(
    vscode.workspace.onDidRenameFiles(async (event) => {
      console.log("DEBUG: onDidRenameFiles event triggered", event.files);
      const loggedIn = await ensureLoggedIn();
      if (!loggedIn) {
        console.log("DEBUG: User not logged in. Conversion aborted.");
        return;
      }

      for (const file of event.files) {
        if (
          file.newUri.fsPath.endsWith(".git") ||
          file.oldUri.fsPath.endsWith(".git")
        ) {
          continue;
        }

        const fromExt = getExtension(file.oldUri);
        const toExt = getExtension(file.newUri);

        if (!fromExt || !toExt || fromExt === toExt) continue;
        if (!isSupportedConversion(fromExt, toExt)) continue;

        await new Promise((res) => setTimeout(res, 300));

        try {
          await vscode.workspace.fs.stat(file.newUri);
        } catch {
          continue;
        }

        await handleConversion(
          file.newUri,
          EXTENSION_LANGUAGE_MAP[fromExt],
          EXTENSION_LANGUAGE_MAP[toExt]
        );
      }
    })
  );

  console.log("DEBUG: CodeMorph extension activated");
}

// ───────────── Helpers ─────────────

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
  const token = await extensionContext.secrets.get("codemorph_token");
  console.log("DEBUG: getAuthToken token:", token);
  return token;
}

async function ensureLoggedIn(): Promise<boolean> {
  const token = await getAuthToken();
  if (token) return true;

  const choice = await vscode.window.showInformationMessage(
    "Please log in to continue using CodeMorph.",
    { modal: true },
    "Login"
  );

  if (choice === "Login") {
    console.log("DEBUG: Opening login URL in browser");
    vscode.env.openExternal(vscode.Uri.parse(WEBSITE_URL));
  }

  return false;
}

// ───────────── Conversion Logic ─────────────
async function handleConversion(
  fileUri: vscode.Uri,
  fromLang: Language,
  toLang: Language
) {
  const loggedIn = await ensureLoggedIn();
  if (!loggedIn) return;

  if (isConversionRunning) {
    vscode.window.showWarningMessage("CodeMorph is already converting.");
    return;
  }

  isConversionRunning = true;

  try {
    console.log("DEBUG: Starting conversion for file:", fileUri.fsPath);

    const bytes = await vscode.workspace.fs.readFile(fileUri);
    const sourceCode = Buffer.from(bytes).toString("utf8");

    if (!sourceCode.trim()) {
      vscode.window.showWarningMessage("File is empty.");
      return;
    }

    const choice = await vscode.window.showInformationMessage(
      `Convert ${fromLang.toUpperCase()} → ${toLang.toUpperCase()}?`,
      { modal: true },
      "Convert"
    );

    if (choice !== "Convert") return;

    const addComments = await vscode.window.showQuickPick(["Yes", "No"], {
      placeHolder: "Add comments?",
    });

    if (!addComments) return;

    const fileName =
      fileUri.path.split("/").pop()?.replace(/\.[^/.]+$/, "") || "Main";

    const converted = await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Converting...",
        cancellable: false,
      },
      () =>
        convertWithAI(
          sourceCode,
          fromLang,
          toLang,
          addComments === "Yes",
          fileName
        )
    );

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
    console.log("DEBUG: Conversion applied successfully");
  } catch (e: any) {
    vscode.window.showErrorMessage(`Conversion failed: ${e.message}`);
    console.error("DEBUG: Conversion error:", e);
  } finally {
    isConversionRunning = false;
  }
}

async function convertWithAI(
  code: string,
  from: Language,
  to: Language,
  withComments: boolean,
  fileName?: string
): Promise<string> {
  const authToken = await getAuthToken();
  if (!authToken) throw new Error("Login required.");

  const backendUrl = CONVERT_API_URL;
  console.log("DEBUG: Converting with AI. Backend URL:", backendUrl);

  const javaHint =
    to === "java" && fileName
      ? `
If the source code already defines a class, preserve it and do not introduce an extra Main class.
`
      : "";

  const prompt = `
${javaHint}
Convert the following ${from} code to ${to}.
${withComments ? "Add comments only where necessary." : "Do NOT add comments."}
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
    body: JSON.stringify({ prompt, fromLang: from, toLang: to }),
  });

  const rawText = await res.text();
  console.log("DEBUG: Raw conversion response:", rawText);

  let parsed: any;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error("Backend returned invalid JSON");
  }

  if (!parsed.reply) {
    if (parsed.error === "insufficient_credits") {
      const choice = await vscode.window.showInformationMessage(
        "You have insufficient credits. Purchase more?",
        { modal: true },
        "Yes",
        "No"
      );

      if (choice === "Yes") {
        vscode.env.openExternal(vscode.Uri.parse(`${WEBSITE_URL}/payments`));
      }

      throw new Error("Insufficient credits");
    }

    throw new Error("No result returned");
  }

  return stripMarkdown(parsed.reply);
}

function stripMarkdown(code: string): string {
  const fenced = code.match(/```[\s\S]*?```/);
  if (!fenced) return code.trim();

  return fenced[0].replace(/```[a-zA-Z0-9]*/g, "").replace(/```/g, "").trim();
}

export function deactivate() {
  console.log("DEBUG: CodeMorph extension deactivated");
}
