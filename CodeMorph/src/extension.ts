import * as vscode from "vscode";
import axios from "axios";

/* =======================
   HELPER: Register Features
   ======================= */
function registerRenameListener(context: vscode.ExtensionContext) {
  const disposable = vscode.workspace.onDidRenameFiles(async (event) => {
    for (const file of event.files) {
      const oldPath = file.oldUri.fsPath;
      const newPath = file.newUri.fsPath;

      try {
        await convertWithAI(oldPath, newPath, context);
      } catch (err: any) {
        vscode.window.showErrorMessage(err.message || "CodeMorph error");
      }
    }
  });

  context.subscriptions.push(disposable);
}

/* =======================
   HELPER: Get Auth Token
   ======================= */
async function getAuthToken(context: vscode.ExtensionContext) {
  return await context.secrets.get("codemorph_token");
}

/* =======================
   AI Conversion (Protected)
   ======================= */
async function convertWithAI(
  oldPath: string,
  newPath: string,
  context: vscode.ExtensionContext
) {
  const authToken = await getAuthToken(context);

  if (!authToken) {
    throw new Error("Login required to use CodeMorph");
  }

  await axios.post(
    "https://codemorph.me/api/convert",
    { oldPath, newPath },
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );
}

/* =======================
   EXTENSION ACTIVATE
   ======================= */
export async function activate(context: vscode.ExtensionContext) {
  console.log("CodeMorph activated");

  /* -------- OAuth Callback -------- */
  vscode.window.registerUriHandler({
    async handleUri(uri) {
      if (uri.path !== "/auth") return;

      const params = new URLSearchParams(uri.query);
      const token = params.get("token");

      if (!token) {
        vscode.window.showErrorMessage("Authentication failed");
        return;
      }

      await context.secrets.store("codemorph_token", token);

      vscode.window.showInformationMessage("CodeMorph signed in successfully 🎉");

      // Enable features AFTER login
      registerRenameListener(context);
    },
  });

  /* -------- Enforce Login -------- */
  const authToken = await getAuthToken(context);

  if (!authToken) {
    const choice = await vscode.window.showInformationMessage(
      "Sign in to CodeMorph to enable code conversion",
      "Sign In"
    );

    if (choice === "Sign In") {
      vscode.env.openExternal(
        vscode.Uri.parse("https://codemorph.me/login")
      );
    }

    // IMPORTANT: Do not activate features
    return;
  }

  /* -------- Logged in → Enable features -------- */
  registerRenameListener(context);
}

/* =======================
   EXTENSION DEACTIVATE
   ======================= */
export function deactivate() {}
