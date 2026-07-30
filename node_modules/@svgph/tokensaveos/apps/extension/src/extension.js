"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const token_engine_1 = require("@tokensaveos/token-engine");
function activate(context) {
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
        const res = (0, token_engine_1.compressPrompt)(selectedText);
        editor.edit(editBuilder => {
            editBuilder.replace(editor.selection, res.compressedText);
        });
        vscode.window.showInformationMessage(`⚡ TokenSaveOS: Saved ${res.tokensSaved} tokens (-${res.compressionRatio}%)!`);
    });
    const dashboardCmd = vscode.commands.registerCommand('tokensave.openDashboard', () => {
        vscode.env.openExternal(vscode.Uri.parse("http://localhost:3005"));
    });
    context.subscriptions.push(statusBar, optimizeCmd, dashboardCmd);
}
function deactivate() { }
