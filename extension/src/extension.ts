/**
 * Kore VS Code Extension — Entry point.
 *
 * Provides autocomplete, diagnostics, type generation, hover docs, and snippets
 * for the Kore Roblox Luau game framework.
 *
 * REQUIRES a Kore.toml in the workspace root. Without it, only the
 * `kore.initProject` command is available.
 *
 * Works alongside luau-lsp by JohnnyMorganz — when luau-lsp is active,
 * type-based completions are deferred to it (the generated Types.luau provides
 * all the needed type info). Kore-specific features (prefix commands, service
 * name pickers, diagnostics, type generation) are always active.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { CompletionProvider } from './providers/CompletionProvider';
import { DiagnosticProvider } from './providers/DiagnosticProvider';
import { HoverProvider } from './providers/HoverProvider';
import { KoreCodeActionProvider } from './providers/CodeActionProvider';
import { FileWatcher } from './watcher/FileWatcher';
import { writeTypes } from './codegen/TypesWriter';
import { PathResolver } from './require/PathResolver';
import { ModuleIndexer } from './require/ModuleIndexer';
import { serviceRegistry } from './registry/ServiceRegistry';
import { controllerRegistry } from './registry/ControllerRegistry';
import { initLogger, logInfo, logError, logWarn, refreshDebugSetting, setDebugEnabled } from './Logger';
import {
  koreTomlExists,
  getConfig,
  getTypesRequirePath,
  setPathResolver,
  startWatching as startConfigWatching,
  onConfigChanged,
  invalidateCache,
  createKoreToml,
} from './config/KoreConfig';

const LUAU_SELECTOR: vscode.DocumentSelector = { language: 'luau', scheme: 'file' };

let diagnosticProvider: DiagnosticProvider;
let fileWatcher: FileWatcher;
let pathResolver: PathResolver;
let moduleIndexer: ModuleIndexer;
let outputChannel: vscode.OutputChannel;
let koreActive = false;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  outputChannel = vscode.window.createOutputChannel('Kore');
  initLogger(outputChannel);
  logInfo('Extension activating...');

  // Always register kore.initProject — available even without Kore.toml
  context.subscriptions.push(
    vscode.commands.registerCommand('kore.initProject', async () => {
      const created = await createKoreToml();
      if (created) {
        vscode.window.showInformationMessage('Kore: Created Kore.toml. Kore features are now active.');
        if (!koreActive) {
          await activateKoreFeatures(context);
        }
      }
    }),
  );

  // Start watching for Kore.toml changes
  startConfigWatching(context);

  // If Kore.toml exists, activate full features; otherwise prompt
  if (koreTomlExists()) {
    await activateKoreFeatures(context);
  } else {
    logInfo('No Kore.toml found — Kore features disabled. Run "Kore: Init Project" to create one.');
    const choice = await vscode.window.showInformationMessage(
      'Kore: No Kore.toml found in this workspace. Create one to enable Kore features.',
      'Create Kore.toml',
      'Dismiss',
    );
    if (choice === 'Create Kore.toml') {
      const created = await createKoreToml();
      if (created) {
        await activateKoreFeatures(context);
      }
    }

    // Auto-activate when Kore.toml appears
    onConfigChanged(async () => {
      if (!koreActive && koreTomlExists()) {
        await activateKoreFeatures(context);
      }
    });
  }
}

async function activateKoreFeatures(context: vscode.ExtensionContext): Promise<void> {
  if (koreActive) return;
  koreActive = true;

  const cfg = getConfig();
  logInfo(`Kore.toml loaded — services: ${cfg.paths.services}, controllers: ${cfg.paths.controllers}`);

  // Sync debug setting from Kore.toml
  if (cfg.options.debug) {
    setDebugEnabled(true);
  }

  try {
    // 1. Initialize providers
    diagnosticProvider = new DiagnosticProvider();
    fileWatcher = new FileWatcher();
    logInfo('Providers initialized');

    // 2. Scan all files and build registry
    await fileWatcher.scanAll();

    // 3. Write initial Types.luau (if enabled)
    if (cfg.options.generateTypes) {
      await writeTypes();
    }

    // 4. Initialize module indexer for require completions
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const workspaceRoot = workspaceFolder?.uri.fsPath ?? '';
    pathResolver = new PathResolver(workspaceRoot);
    await pathResolver.initialize();
    setPathResolver(pathResolver);
    moduleIndexer = new ModuleIndexer(pathResolver);
    await moduleIndexer.initialize();
    logInfo(`Module indexer ready: ${moduleIndexer.getModules().length} module(s)`);

    // 5. Register providers
    context.subscriptions.push(
      vscode.languages.registerCompletionItemProvider(LUAU_SELECTOR, new CompletionProvider(moduleIndexer), '.', '"', "'", cfg.options.prefix),
      vscode.languages.registerHoverProvider(LUAU_SELECTOR, new HoverProvider()),
      vscode.languages.registerCodeActionsProvider(LUAU_SELECTOR, new KoreCodeActionProvider(), {
        providedCodeActionKinds: [vscode.CodeActionKind.QuickFix],
      }),
    );
    logInfo('Completion provider registered');

    // 6. Start file watchers
    fileWatcher.activate();
    context.subscriptions.push({ dispose: () => fileWatcher.dispose() });
    context.subscriptions.push({ dispose: () => moduleIndexer.dispose() });

    // Watch for Rojo project file changes → reload path resolver + reindex
    const projectWatcher = vscode.workspace.createFileSystemWatcher('**/*.project.json');
    const handleProjectChange = async () => {
      pathResolver.reload();
      await moduleIndexer.rebuildIndex();
      logInfo('Project file changed — reindexed modules');
    };
    context.subscriptions.push(projectWatcher);
    context.subscriptions.push(projectWatcher.onDidChange(handleProjectChange));
    context.subscriptions.push(projectWatcher.onDidCreate(handleProjectChange));
    context.subscriptions.push(projectWatcher.onDidDelete(handleProjectChange));

    // 7. Diagnostics on document change + real-time type regeneration
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
      vscode.workspace.onDidChangeTextDocument(e => {
        fileWatcher.handleDocumentEdit(e.document);
      }),
    );

    // Auto-template: populate new .luau files in services/controllers folders
    context.subscriptions.push(
      vscode.workspace.onDidCreateFiles(async (event) => {
        const currentCfg = getConfig();
        if (!currentCfg.options.autoTemplate) return;
        const servicesPath = currentCfg.paths.services;
        const controllersPath = currentCfg.paths.controllers;
        const koreRequire = currentCfg.require.kore;
        const typesRequire = getTypesRequirePath();

        for (const file of event.files) {
          if (!file.fsPath.endsWith('.luau')) continue;
          try {
            const stat = await vscode.workspace.fs.stat(file);
            if (stat.size > 0) continue;
          } catch { continue; }

          const relative = vscode.workspace.asRelativePath(file, false).replace(/\\/g, '/');
          const name = path.basename(file.fsPath, '.luau');
          let template: string | null = null;

          if (relative.startsWith(servicesPath)) {
            template = [
              `local Kore = require(${koreRequire})`,
              `local Types = require(${typesRequire})`,
              '',
              `local ${name} = Kore.CreateService({`,
              `\tName = "${name}",`,
              `})`,
              '',
              `${name}.Client = {`,
              `\t-- Remote methods and Kore.NetEvent declarations`,
              `}`,
              '',
              `function ${name}:Init(ctx)`,
              `\t-- Sync initialization (no yielding)`,
              `end`,
              '',
              `function ${name}:Start(ctx)`,
              `\t-- Async start (yielding OK)`,
              `end`,
              '',
              `return ${name}`,
              '',
            ].join('\n');
          } else if (relative.startsWith(controllersPath)) {
            template = [
              `local Kore = require(${koreRequire})`,
              `local Types = require(${typesRequire})`,
              '',
              `local ${name} = Kore.CreateController({`,
              `\tName = "${name}",`,
              `})`,
              '',
              `function ${name}:Init(ctx)`,
              `\t-- Sync initialization (no yielding)`,
              `end`,
              '',
              `function ${name}:Start(ctx)`,
              `\t-- Async start (yielding OK)`,
              `end`,
              '',
              `return ${name}`,
              '',
            ].join('\n');
          }

          if (template) {
            const encoder = new TextEncoder();
            await vscode.workspace.fs.writeFile(file, encoder.encode(template));
            logInfo(`Auto-template: created ${name} (${relative.startsWith(servicesPath) ? 'service' : 'controller'})`);
            const doc = await vscode.workspace.openTextDocument(file);
            await vscode.window.showTextDocument(doc);
          }
        }
      }),
    );

    // Re-read config when Kore.toml or VS Code settings change
    onConfigChanged(async (newCfg) => {
      logInfo('Config changed — rescanning...');
      setDebugEnabled(newCfg.options.debug);
      await fileWatcher.scanAll();
      if (newCfg.options.generateTypes) {
        await writeTypes();
      }
    });

    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('kore.debug')) {
          refreshDebugSetting();
          logInfo('Debug setting changed');
        }
        if (e.affectsConfiguration('kore')) {
          invalidateCache();
        }
      }),
    );

    // 8. Register commands
    context.subscriptions.push(
      vscode.commands.registerCommand('kore.refreshTypes', async () => {
        logInfo('Manual refresh triggered via kore.refreshTypes');
        try {
          await fileWatcher.scanAll();
          const currentCfg = getConfig();
          if (currentCfg.options.generateTypes) {
            await writeTypes();
          }
          pathResolver.reload();
          await moduleIndexer.rebuildIndex();
          vscode.window.showInformationMessage('Kore: Types refreshed successfully.');
        } catch (err) {
          logError('Failed to refresh types', err);
          vscode.window.showErrorMessage('Kore: Failed to refresh types. Check Kore output channel.');
        }
      }),

      vscode.commands.registerCommand('kore.reindexModules', async () => {
        try {
          logInfo('Manual reindex triggered via kore.reindexModules');
          pathResolver.reload();
          await moduleIndexer.rebuildIndex();
          vscode.window.showInformationMessage(`Kore: Reindexed ${moduleIndexer.getModules().length} modules.`);
        } catch (err) {
          logError('Failed to reindex modules', err);
          vscode.window.showErrorMessage('Kore: Failed to reindex modules. Check Kore output channel.');
        }
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
          {},
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
                html += `<li>${escapeHtml(m.name)}(${m.params.map(p => `${escapeHtml(p.name)}: ${escapeHtml(p.type)}`).join(', ')})</li>`;
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
                html += `<li>${escapeHtml(m.name)}(${m.params.map(p => `${escapeHtml(p.name)}: ${escapeHtml(p.type)}`).join(', ')})</li>`;
              }
              html += '</ul>';
            }
          }
        }

        html += '</body></html>';
        panel.webview.html = html;
      }),
    );

    // 9. Cleanup
    context.subscriptions.push(diagnosticProvider);

    // Watch for workspace folder changes
    context.subscriptions.push(
      vscode.workspace.onDidChangeWorkspaceFolders(async () => {
        logInfo('Workspace folders changed — rescanning...');
        invalidateCache();
        pathResolver.reload();
        await fileWatcher.scanAll();
        const currentCfg = getConfig();
        if (currentCfg.options.generateTypes) {
          await writeTypes();
        }
        await moduleIndexer.rebuildIndex();
      }),
    );

    logInfo(`Kore activated. Found ${serviceRegistry.size} service(s), ${controllerRegistry.size} controller(s).`);
    if (serviceRegistry.size === 0 && controllerRegistry.size === 0) {
      logWarn('No services or controllers discovered — check Kore.toml paths.');
      logInfo(`  paths.services    = ${cfg.paths.services}`);
      logInfo(`  paths.controllers = ${cfg.paths.controllers}`);
    }
  } catch (err) {
    logError('Kore features failed to activate', err);
    vscode.window.showErrorMessage('Kore: Failed to activate. Check the Kore output channel for details.');
  }
}

export function deactivate(): void {
  if (fileWatcher) {
    fileWatcher.dispose();
  }
  if (moduleIndexer) {
    moduleIndexer.dispose();
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
