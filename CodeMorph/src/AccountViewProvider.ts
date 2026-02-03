import * as vscode from "vscode";
import { AUTH_API_URL, CONVERT_API_URL, WEBSITE_URL } from "./config";

interface CurrentUser {
  name: string;
  email: string;
}

export class AccountViewProvider implements vscode.WebviewViewProvider {
  static readonly viewType = "codemorph.accountView";

  private _view?: vscode.WebviewView;

  constructor(private context: vscode.ExtensionContext) { }

  async resolveWebviewView(view: vscode.WebviewView) {
    console.log("RESOLVE CALLED");
    this._view = view;

    view.webview.options = { enableScripts: true };
    view.webview.html = await this.getHtml();

    view.webview.onDidReceiveMessage(async (msg) => {
      if (msg.command === "login") {
        vscode.env.openExternal(
          vscode.Uri.parse(WEBSITE_URL)
        );
      }

      if (msg.command === "logout") {
        await this.context.secrets.delete("codemorph_token");
        vscode.window.showInformationMessage("Logged out of CodeMorph");
        view.webview.html = await this.getHtml();
      }
    });
  }

  public async refresh() {
    console.log("REFRESH CALLED", this._view);
  if (this._view) {
    this._view.webview.html = await this.getHtml();
  }
}

  private async getCurrentUser(): Promise<CurrentUser | null> {
    const token = await this.context.secrets.get("codemorph_token");
    if (!token) return null;

    try {
      const res = await fetch(`${CONVERT_API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        await this.context.secrets.delete("codemorph_token");
        return null;
      }

      return (await res.json()) as CurrentUser;
    } catch (err) {
      console.error("Failed to fetch current user", err);
      return null;
    }
  }


  private async getHtml(): Promise<string> {
    const user = await this.getCurrentUser();

    return `
      <html>
        <body>
          <h3>CodeMorph Account</h3>

          ${user
        ? `
                <p><b>${user.name}</b></p>
                <p>${user.email}</p>
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
