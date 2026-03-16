import * as vscode from 'vscode';
import * as path from 'path';
import { ModuleInfo } from './types';
import { PathResolver } from './PathResolver';
import { logInfo, logError, logDebug } from '../Logger';

/**
 * Indexes all requireable modules in the workspace.
 * Scans .luau files and Wally .lua package link files.
 */
export class ModuleIndexer {
  private modules: ModuleInfo[] = [];
  private watchers: vscode.Disposable[] = [];

  constructor(private pathResolver: PathResolver) {}

  async initialize(): Promise<void> {
    await this.rebuildIndex();
    this.setupWatchers();
  }

  async rebuildIndex(): Promise<void> {
    this.modules = [];
    const start = Date.now();

    try {
      // All .luau files (excluding _Index)
      const luauFiles = await vscode.workspace.findFiles(
        '**/*.luau',
        '{**/node_modules/**,**/_Index/**}',
      );

      // Wally .lua package link files (top-level only, not _Index)
      const wallyFiles = await vscode.workspace.findFiles(
        '{**/Packages/*.lua,**/ServerPackages/*.lua,**/DevPackages/*.lua}',
        '**/_Index/**',
      );

      for (const file of luauFiles) {
        this.indexFile(file, false);
      }
      for (const file of wallyFiles) {
        this.indexFile(file, true);
      }

      logInfo(`ModuleIndexer: Indexed ${this.modules.length} modules in ${Date.now() - start}ms`);
    } catch (e) {
      logError('ModuleIndexer: Indexing failed', e);
    }
  }

  private indexFile(uri: vscode.Uri, isWallyPackage: boolean): void {
    const fsPath = uri.fsPath;
    const fileName = path.basename(fsPath);

    if (fileName.startsWith('.')) return;
    if (fsPath.includes(`${path.sep}_Index${path.sep}`) || fsPath.includes('/_Index/')) return;

    // Skip server/client scripts (they're Script/LocalScript, not ModuleScript)
    // But allow init.server.luau / init.client.luau (represent parent folder)
    const lower = fileName.toLowerCase();
    const isScript =
      ((lower.endsWith('.server.luau') || lower.endsWith('.server.lua')) && !lower.startsWith('init.')) ||
      ((lower.endsWith('.client.luau') || lower.endsWith('.client.lua')) && !lower.startsWith('init.'));
    if (isScript) return;

    // Derive module name
    let name = fileName
      .replace(/\.server\.luau$/i, '')
      .replace(/\.client\.luau$/i, '')
      .replace(/\.server\.lua$/i, '')
      .replace(/\.client\.lua$/i, '')
      .replace(/\.luau$/i, '')
      .replace(/\.lua$/i, '');

    // init files use parent folder name
    if (name.toLowerCase() === 'init') {
      name = path.basename(path.dirname(fsPath));
    }

    const workspaceFolder = vscode.workspace.workspaceFolders?.find(f => fsPath.startsWith(f.uri.fsPath));
    const relativePath = workspaceFolder
      ? path.relative(workspaceFolder.uri.fsPath, fsPath)
      : fsPath;

    const instanceSegments = this.pathResolver.resolveSegments(fsPath);
    const instancePath = 'game.' + instanceSegments.join('.');

    this.modules.push({ name, fsPath, instanceSegments, instancePath, relativePath, isWallyPackage });
  }

  private setupWatchers(): void {
    this.disposeWatchers();

    const luauWatcher = vscode.workspace.createFileSystemWatcher('**/*.luau');
    const luaWatcher = vscode.workspace.createFileSystemWatcher(
      '{**/Packages/*.lua,**/ServerPackages/*.lua,**/DevPackages/*.lua}',
    );

    const shouldIndex = (uri: vscode.Uri): boolean =>
      !uri.fsPath.includes(`${path.sep}_Index${path.sep}`) && !uri.fsPath.includes('/_Index/');

    const onLuauCreate = luauWatcher.onDidCreate(uri => { if (shouldIndex(uri)) this.indexFile(uri, false); });
    const onLuauDelete = luauWatcher.onDidDelete(uri => { this.modules = this.modules.filter(m => m.fsPath !== uri.fsPath); });
    const onLuauChange = luauWatcher.onDidChange(uri => {
      if (shouldIndex(uri)) {
        this.modules = this.modules.filter(m => m.fsPath !== uri.fsPath);
        this.indexFile(uri, false);
      }
    });

    const onLuaCreate = luaWatcher.onDidCreate(uri => { if (shouldIndex(uri)) this.indexFile(uri, true); });
    const onLuaDelete = luaWatcher.onDidDelete(uri => { this.modules = this.modules.filter(m => m.fsPath !== uri.fsPath); });
    const onLuaChange = luaWatcher.onDidChange(uri => {
      if (shouldIndex(uri)) {
        this.modules = this.modules.filter(m => m.fsPath !== uri.fsPath);
        this.indexFile(uri, true);
      }
    });

    this.watchers.push(
      luauWatcher, onLuauCreate, onLuauDelete, onLuauChange,
      luaWatcher, onLuaCreate, onLuaDelete, onLuaChange,
    );
  }

  private disposeWatchers(): void {
    for (const w of this.watchers) w.dispose();
    this.watchers = [];
  }

  getModules(): ModuleInfo[] {
    return this.modules;
  }

  dispose(): void {
    this.disposeWatchers();
    this.modules = [];
  }
}
