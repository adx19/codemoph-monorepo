import * as vscode from "vscode";
import { AUTH_API_URL, WEBSITE_URL } from "./config";

interface CurrentUser {
  email: string;
  id: string;
}

export class AccountViewProvider implements vscode.WebviewViewProvider {
  static readonly viewType = "codemorph.accountView";

  private _view?: vscode.WebviewView;

  constructor(private context: vscode.ExtensionContext) {}

  async resolveWebviewView(view: vscode.WebviewView) {
    console.log("DEBUG: resolveWebviewView called");
    this._view = view;

    view.webview.options = { enableScripts: true };
    view.webview.html = await this.getHtml();

    view.webview.onDidReceiveMessage(async (msg) => {
      console.log("DEBUG: Message from webview:", msg);

      if (msg.command === "login") {
        console.log("DEBUG: Login button clicked");
        vscode.env.openExternal(vscode.Uri.parse(WEBSITE_URL));
      }

      if (msg.command === "logout") {
        console.log("DEBUG: Logout button clicked");
        await this.context.secrets.delete("codemorph_token");
        vscode.window.showInformationMessage("Logged out of CodeMorph");
        view.webview.html = await this.getHtml();
      }
    });
  }

  public async refresh() {
    console.log("DEBUG: refresh() called. Webview exists?", !!this._view);
    if (this._view) {
      this._view.webview.html = await this.getHtml();
    } else {
      console.warn("DEBUG: Cannot refresh, webview not initialized yet.");
    }
  }

  private async getCurrentUser(): Promise<CurrentUser | null> {
    const token = await this.context.secrets.get("codemorph_token");
    console.log("DEBUG: Token from secrets:", token);

    if (!token) return null;

    const url = `${AUTH_API_URL}/me`;
    console.log("DEBUG: Fetching current user from:", url);

    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("DEBUG: Fetch response status:", res.status);

      if (!res.ok) {
        console.error("DEBUG: Fetch returned non-OK status:", res.status);
        console.log("DEBUG: Deleting token due to invalid response");
        await this.context.secrets.delete("codemorph_token");
        return null;
      }

      const data = await res.json();
      console.log("DEBUG: Current user data:", data);
      return data as CurrentUser;
    } catch (err) {
      console.error("DEBUG: Fetch failed with error:", err);
      return null;
    }
  }

  private async getHtml(): Promise<string> {
    const user = await this.getCurrentUser();
    console.log("DEBUG: getHtml user:", user);

    return `
      <html>
        <body>
          <h3>CodeMorph Account</h3>

          ${
            user
              ? `
                <p><b>${user.email}</b></p>
                <p>${user.id}</p>
                <p>Status: <span style="color:green">Logged In</span></p>
              `
              : `
                <p>Status: <span style="color:red">Not Logged In</span></p>
              `
          }

          <button onclick="login()">Login / Switch Account</button>
          <button onclick="logout()">Logout</button>

          <script>
            const vscode = acquireVsCodeApi();
            function login() {
              vscode.postMessage({ command: "login" });
            }
            function logout() {
              vscode.postMessage({ command: "logout" });
            }
          </script>
        </body>
      </html>
    `;
  }
}
