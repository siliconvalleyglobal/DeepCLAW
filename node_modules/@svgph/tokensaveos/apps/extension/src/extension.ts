import * as vscode from 'vscode';
import { compressPrompt } from '@tokensaveos/token-engine';

export function activate(context: vscode.ExtensionContext) {
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBar.text = "$(zap) TokenSaveOS: Active";
  statusBar.tooltip = "Click to open TokenSaveOS Live Analytics Dashboard";
  statusBar.command = "tokensave.openDashboard";
  statusBar.show();

  const optimizeCmd = vscode.commands.registerCommand('tokensave.optimizePrompt', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage("No active editor found.");
      return;
    }
    const selectedText = editor.document.getText(editor.selection);
    if (!selectedText) {
      vscode.window.showWarningMessage("Please select prompt text to optimize.");
      return;
    }
    const res = compressPrompt(selectedText);
    editor.edit((editBuilder: any) => {
      editBuilder.replace(editor.selection, res.compressedText);
    });
    vscode.window.showInformationMessage(`⚡ TokenSaveOS: Saved ${res.tokensSaved} tokens (-${res.compressionRatio}%)!`);
  });

  const dashboardCmd = vscode.commands.registerCommand('tokensave.openDashboard', () => {
    vscode.env.openExternal(vscode.Uri.parse("http://localhost:3005"));
  });

  context.subscriptions.push(statusBar, optimizeCmd, dashboardCmd);
}

export function deactivate() {}
