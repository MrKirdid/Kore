/**
 * Kore VS Code Extension — Entry point.
 *
 * Provides autocomplete, diagnostics, type generation, hover docs, and snippets
 * for the Kore Roblox Luau game framework.
 *
 * Targets luau-lsp by JohnnyMorganz. Does NOT target Roblox LSP.
 */

import * as vscode from 'vscode';
import { CompletionProvider } from './providers/CompletionProvider';
import { DiagnosticProvider } from './providers/DiagnosticProvider';
import { HoverProvider } from './providers/HoverProvider';
import { FileWatcher } from './watcher/FileWatcher';
import { writeTypes } from './codegen/TypesWriter';
import { serviceRegistry } from './registry/ServiceRegistry';
import { controllerRegistry } from './registry/ControllerRegistry';

const LUAU_SELECTOR: vscode.DocumentSelector = { language: 'luau', scheme: 'file' };

let diagnosticProvider: DiagnosticProvider;
let fileWatcher: FileWatcher;
let outputChannel: vscode.OutputChannel;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  outputChannel = vscode.window.createOutputChannel('Kore');
  outputChannel.appendLine('[Kore] Extension activating...');

  // 1. Initialize providers
  diagnosticProvider = new DiagnosticProvider();
  fileWatcher = new FileWatcher(outputChannel);

  // 2. Scan all files and build registry
  await fileWatcher.scanAll();

  // 3. Write initial Types.luau
  await writeTypes();

  // 4. Register providers
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(LUAU_SELECTOR, new CompletionProvider(), '"', "'", ':'),
    vscode.languages.registerHoverProvider(LUAU_SELECTOR, new HoverProvider()),
  );

  // 5. Start file watchers
  fileWatcher.activate();
  context.subscriptions.push({ dispose: () => fileWatcher.dispose() });

  // 6. Diagnostics on document change
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(doc => {
      if (doc.languageId === 'luau') {
        diagnosticProvider.update(doc);
      }
    }),
    vscode.workspace.onDidOpenTextDocument(doc => {
      if (doc.languageId === 'luau') {
        diagnosticProvider.update(doc);
      }
    }),
  );

  // 7. Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('kore.refreshTypes', async () => {
      await fileWatcher.scanAll();
      await writeTypes();
      vscode.window.showInformationMessage('Kore: Types refreshed successfully.');
    }),

    vscode.commands.registerCommand('kore.openDocs', () => {
      vscode.env.openExternal(vscode.Uri.parse('https://github.com/mrkirdid/kore'));
    }),

    vscode.commands.registerCommand('kore.showRegistry', () => {
      const services = serviceRegistry.getAll();
      const controllers = controllerRegistry.getAll();

      const panel = vscode.window.createWebviewPanel(
        'koreRegistry',
        'Kore: Service Registry',
        vscode.ViewColumn.One,
        {}
      );

      let html = '<html><body style="font-family: sans-serif; padding: 20px;">';
      html += '<h1>Kore Service Registry</h1>';

      html += '<h2>Services</h2>';
      if (services.length === 0) {
        html += '<p>No services discovered.</p>';
      } else {
        for (const svc of services) {
          html += `<h3>${escapeHtml(svc.name)}</h3>`;
          html += `<p><strong>File:</strong> ${escapeHtml(svc.filePath)}</p>`;
          if (svc.dependencies.length > 0) {
            html += `<p><strong>Dependencies:</strong> ${svc.dependencies.map(escapeHtml).join(', ')}</p>`;
          }
          if (svc.clientMethods.length > 0) {
            html += '<p><strong>Client Methods:</strong></p><ul>';
            for (const m of svc.clientMethods) {
              html += `<li>${escapeHtml(m.name)}(${m.params.map(escapeHtml).join(', ')})</li>`;
            }
            html += '</ul>';
          }
          if (svc.netEvents.length > 0) {
            html += '<p><strong>Net Events:</strong></p><ul>';
            for (const e of svc.netEvents) {
              html += `<li>${escapeHtml(e.name)}</li>`;
            }
            html += '</ul>';
          }
        }
      }

      html += '<h2>Controllers</h2>';
      if (controllers.length === 0) {
        html += '<p>No controllers discovered.</p>';
      } else {
        for (const ctrl of controllers) {
          html += `<h3>${escapeHtml(ctrl.name)}</h3>`;
          html += `<p><strong>File:</strong> ${escapeHtml(ctrl.filePath)}</p>`;
          if (ctrl.dependencies.length > 0) {
            html += `<p><strong>Dependencies:</strong> ${ctrl.dependencies.map(escapeHtml).join(', ')}</p>`;
          }
          if (ctrl.methods.length > 0) {
            html += '<p><strong>Methods:</strong></p><ul>';
            for (const m of ctrl.methods) {
              html += `<li>${escapeHtml(m.name)}(${m.params.map(escapeHtml).join(', ')})</li>`;
            }
            html += '</ul>';
          }
        }
      }

      html += '</body></html>';
      panel.webview.html = html;
    }),
  );

  // 8. Cleanup
  context.subscriptions.push(diagnosticProvider);

  outputChannel.appendLine(`[Kore] Extension activated. ${serviceRegistry.size} services, ${controllerRegistry.size} controllers.`);
}

export function deactivate(): void {
  if (fileWatcher) {
    fileWatcher.dispose();
  }
  if (diagnosticProvider) {
    diagnosticProvider.dispose();
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
