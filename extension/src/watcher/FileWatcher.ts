/**
 * FileWatcher — Watches for services/controllers across the entire workspace.
 * On save/create/delete/rename: re-parses, updates registry, rewrites Types.luau.
 *
 * Discovery strategy:
 *   1. Scan configured directories (servicesPath / controllersPath) with type hints.
 *   2. Scan ALL .luau files workspace-wide — content-based classification detects
 *      Kore.CreateService / Kore.CreateController / Kore.AddService / Kore.AddController
 *      regardless of project structure.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { parseService } from '../parser/ServiceParser';
import { parseController } from '../parser/ControllerParser';
import { serviceRegistry } from '../registry/ServiceRegistry';
import { controllerRegistry } from '../registry/ControllerRegistry';
import { writeTypes } from '../codegen/TypesWriter';
import { getConfig } from '../config/KoreConfig';
import { logInfo, logError, logDebug, logWarn } from '../Logger';

/** Quick regex tests to classify a file's content without full parsing. */
const SERVICE_PATTERN = /(?:Kore\s*\.\s*(?:CreateService|AddService))\s*\(/;
const CONTROLLER_PATTERN = /(?:Kore\s*\.\s*(?:CreateController|AddController))\s*\(/;

export class FileWatcher {
  private watchers: vscode.FileSystemWatcher[] = [];
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private static readonly DEBOUNCE_MS = 500;

  activate(): void {
    const cfg = getConfig();
    const servicesPath = cfg.paths.services;
    const controllersPath = cfg.paths.controllers;

    logInfo(`Watching services at: **/${servicesPath}/**/*.luau`);
    logInfo(`Watching controllers at: **/${controllersPath}/**/*.luau`);

    // Directory-specific watchers (fast path for conventional layouts)
    const serviceWatcher = vscode.workspace.createFileSystemWatcher(`**/${servicesPath}/**/*.luau`);
    serviceWatcher.onDidChange(uri => this.handleServiceChange(uri));
    serviceWatcher.onDidCreate(uri => this.handleServiceChange(uri));
    serviceWatcher.onDidDelete(uri => this.handleServiceDelete(uri));
    this.watchers.push(serviceWatcher);

    const controllerWatcher = vscode.workspace.createFileSystemWatcher(`**/${controllersPath}/**/*.luau`);
    controllerWatcher.onDidChange(uri => this.handleControllerChange(uri));
    controllerWatcher.onDidCreate(uri => this.handleControllerChange(uri));
    controllerWatcher.onDidDelete(uri => this.handleControllerDelete(uri));
    this.watchers.push(controllerWatcher);

    // Global watcher — catches services/controllers outside the configured dirs
    const globalWatcher = vscode.workspace.createFileSystemWatcher('**/*.luau');
    globalWatcher.onDidChange(uri => this.handleGlobalChange(uri));
    globalWatcher.onDidCreate(uri => this.handleGlobalChange(uri));
    globalWatcher.onDidDelete(uri => this.handleGlobalDelete(uri));
    this.watchers.push(globalWatcher);

    logInfo('File watchers activated (directory + global)');
  }

  async scanAll(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      logWarn('No workspace folders found — cannot scan for services/controllers');
      return;
    }

    const cfg = getConfig();
    const servicesPath = cfg.paths.services;
    const controllersPath = cfg.paths.controllers;
    const typesPath = cfg.paths.types;

    serviceRegistry.clear();
    controllerRegistry.clear();

    // Phase 1 — Scan configured directories with type hints
    for (const folder of workspaceFolders) {
      const servicesDir = path.join(folder.uri.fsPath, servicesPath);
      const controllersDir = path.join(folder.uri.fsPath, controllersPath);

      logInfo(`Scanning services in: ${servicesDir}`);
      await this.scanDirectory(servicesDir, 'service');

      logInfo(`Scanning controllers in: ${controllersDir}`);
      await this.scanDirectory(controllersDir, 'controller');
    }

    // Phase 2 — Content-based global scan (picks up anything the dir scan missed)
    logInfo('Running content-based global scan...');
    const files = await vscode.workspace.findFiles('**/*.luau', '{**/node_modules/**,**/.git/**}');

    for (const file of files) {
      // Skip files already registered (from Phase 1)
      if (serviceRegistry.getByFilePath(file.fsPath)) continue;
      if (controllerRegistry.getByFilePath(file.fsPath)) continue;
      // Skip the generated Types.luau itself
      const relPath = vscode.workspace.asRelativePath(file, false).replace(/\\/g, '/');
      if (relPath === typesPath) continue;

      try {
        const source = fs.readFileSync(file.fsPath, 'utf-8');
        this.tryRegisterFromContent(source, file.fsPath);
      } catch (err) {
        logDebug(`Global scan: could not read ${file.fsPath}`);
      }
    }

    logInfo(`Scan complete: ${serviceRegistry.size} service(s), ${controllerRegistry.size} controller(s)`);
  }

  /**
   * Attempt to register a file as a service and/or controller based on its content.
   */
  private tryRegisterFromContent(source: string, filePath: string): void {
    if (SERVICE_PATTERN.test(source)) {
      const info = parseService(source, filePath);
      if (info && !serviceRegistry.has(info.name)) {
        serviceRegistry.register(info);
        logInfo(`  Registered service (content-scan): ${info.name} (${path.basename(filePath)})`);
      }
    }
    if (CONTROLLER_PATTERN.test(source)) {
      const info = parseController(source, filePath);
      if (info && !controllerRegistry.has(info.name)) {
        controllerRegistry.register(info);
        logInfo(`  Registered controller (content-scan): ${info.name} (${path.basename(filePath)})`);
      }
    }
  }

  private async scanDirectory(dirPath: string, type: 'service' | 'controller'): Promise<void> {
    if (!fs.existsSync(dirPath)) {
      logWarn(`Directory does not exist: ${dirPath}`);
      return;
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.')) continue;
      const fullPath = path.join(dirPath, entry.name);

      // Recurse into subdirectories
      if (entry.isDirectory()) {
        await this.scanDirectory(fullPath, type);
        continue;
      }

      if (!entry.name.endsWith('.luau')) continue;

      try {
        const source = fs.readFileSync(fullPath, 'utf-8');

        if (type === 'service') {
          const info = parseService(source, fullPath);
          if (info) {
            serviceRegistry.register(info);
            logInfo(`  Registered service: ${info.name} (${entry.name})`);
          } else {
            logDebug(`  Skipped ${entry.name} — no Name field found`);
          }
        } else {
          const info = parseController(source, fullPath);
          if (info) {
            controllerRegistry.register(info);
            logInfo(`  Registered controller: ${info.name} (${entry.name})`);
          } else {
            logDebug(`  Skipped ${entry.name} — no Name field found`);
          }
        }
      } catch (err) {
        logError(`Failed to parse ${fullPath}`, err);
      }
    }
  }

  private updateService(source: string, filePath: string): void {
    const existing = serviceRegistry.getByFilePath(filePath);
    if (existing) {
      serviceRegistry.unregister(existing.name);
    }

    const info = parseService(source, filePath);
    if (info) {
      serviceRegistry.register(info);
      logInfo(`Updated service: ${info.name}`);
    } else {
      logDebug(`Service parse returned nothing for: ${path.basename(filePath)}`);
    }
  }

  private updateController(source: string, filePath: string): void {
    const existing = controllerRegistry.getByFilePath(filePath);
    if (existing) {
      controllerRegistry.unregister(existing.name);
    }

    const info = parseController(source, filePath);
    if (info) {
      controllerRegistry.register(info);
      logInfo(`Updated controller: ${info.name}`);
    } else {
      logDebug(`Controller parse returned nothing for: ${path.basename(filePath)}`);
    }
  }

  /**
   * Handle a real-time document edit (onDidChangeTextDocument).
   * Debounces and reads from the editor buffer, not disk.
   * Uses content-based classification so services/controllers outside the
   * configured directories are still picked up.
   */
  handleDocumentEdit(document: vscode.TextDocument): void {
    if (document.languageId !== 'luau') return;

    const filePath = document.uri.fsPath;

    // Fast path: check directory-based classification
    let type = this.classifyFileByPath(filePath);

    // Slow path: peek at content for service/controller patterns
    if (!type) {
      const source = document.getText();
      type = this.classifyFileByContent(source);
    }

    if (!type) return;

    // Debounce: cancel any pending timer for this file
    const existing = this.debounceTimers.get(filePath);
    if (existing) clearTimeout(existing);

    this.debounceTimers.set(filePath, setTimeout(async () => {
      this.debounceTimers.delete(filePath);
      try {
        const source = document.getText();
        if (type === 'service') {
          this.updateService(source, filePath);
        } else {
          this.updateController(source, filePath);
        }
        const currentCfg = getConfig();
        if (currentCfg.options.generateTypes) {
          await writeTypes();
        }
        logDebug(`Types.luau regenerated (live edit: ${path.basename(filePath)})`);
      } catch (err) {
        logError(`Error handling live edit for ${filePath}`, err);
      }
    }, FileWatcher.DEBOUNCE_MS));
  }

  /**
   * Classify by directory path (fast, used for focused watchers).
   */
  private classifyFileByPath(filePath: string): 'service' | 'controller' | null {
    const cfg = getConfig();
    const servicesPath = cfg.paths.services;
    const controllersPath = cfg.paths.controllers;

    // Normalise to forward slashes for consistent matching
    const norm = filePath.replace(/\\/g, '/');
    if (norm.includes(`/${servicesPath}/`)) return 'service';
    if (norm.includes(`/${controllersPath}/`)) return 'controller';
    return null;
  }

  /**
   * Classify by file content (robust, catches services/controllers anywhere).
   */
  private classifyFileByContent(source: string): 'service' | 'controller' | null {
    if (SERVICE_PATTERN.test(source)) return 'service';
    if (CONTROLLER_PATTERN.test(source)) return 'controller';
    return null;
  }

  private async handleServiceChange(uri: vscode.Uri): Promise<void> {
    try {
      const filePath = uri.fsPath;
      logDebug(`Service file changed: ${filePath}`);

      // Prefer editor buffer if the document is open; fall back to disk
      const openDoc = vscode.workspace.textDocuments.find(d => d.uri.fsPath === filePath);
      const source = openDoc ? openDoc.getText() : fs.readFileSync(filePath, 'utf-8');

      this.updateService(source, filePath);
      const cfg = getConfig();
      if (cfg.options.generateTypes) {
        await writeTypes();
      }
    } catch (err) {
      logError(`Error handling service change for ${uri.fsPath}`, err);
    }
  }

  private async handleServiceDelete(uri: vscode.Uri): Promise<void> {
    try {
      const existing = serviceRegistry.getByFilePath(uri.fsPath);
      if (existing) {
        serviceRegistry.unregister(existing.name);
        logInfo(`Removed service: ${existing.name}`);

        vscode.window.showWarningMessage(
          `Kore: Service "${existing.name}" was deleted. Check for GetService("${existing.name}") references.`
        );
      }

      const cfg = getConfig();
      if (cfg.options.generateTypes) {
        await writeTypes();
      }
    } catch (err) {
      logError(`Error handling service delete for ${uri.fsPath}`, err);
    }
  }

  private async handleControllerChange(uri: vscode.Uri): Promise<void> {
    try {
      const filePath = uri.fsPath;
      logDebug(`Controller file changed: ${filePath}`);

      // Prefer editor buffer if the document is open; fall back to disk
      const openDoc = vscode.workspace.textDocuments.find(d => d.uri.fsPath === filePath);
      const source = openDoc ? openDoc.getText() : fs.readFileSync(filePath, 'utf-8');

      this.updateController(source, filePath);
      const cfg = getConfig();
      if (cfg.options.generateTypes) {
        await writeTypes();
      }
    } catch (err) {
      logError(`Error handling controller change for ${uri.fsPath}`, err);
    }
  }

  private async handleControllerDelete(uri: vscode.Uri): Promise<void> {
    try {
      const existing = controllerRegistry.getByFilePath(uri.fsPath);
      if (existing) {
        controllerRegistry.unregister(existing.name);
        logInfo(`Removed controller: ${existing.name}`);

        vscode.window.showWarningMessage(
          `Kore: Controller "${existing.name}" was deleted. Check for GetController("${existing.name}") references.`
        );
      }

      const cfg = getConfig();
      if (cfg.options.generateTypes) {
        await writeTypes();
      }
    } catch (err) {
      logError(`Error handling controller delete for ${uri.fsPath}`, err);
    }
  }

  /**
   * Global watcher callback — content-based classification for files
   * outside the configured service/controller directories.
   */
  private async handleGlobalChange(uri: vscode.Uri): Promise<void> {
    const filePath = uri.fsPath;
    // Skip if already handled by directory-specific watchers
    if (this.classifyFileByPath(filePath)) return;

    try {
      const openDoc = vscode.workspace.textDocuments.find(d => d.uri.fsPath === filePath);
      const source = openDoc ? openDoc.getText() : fs.readFileSync(filePath, 'utf-8');
      const type = this.classifyFileByContent(source);
      if (!type) return;

      logDebug(`Global watcher: ${type} change detected in ${path.basename(filePath)}`);
      if (type === 'service') {
        this.updateService(source, filePath);
      } else {
        this.updateController(source, filePath);
      }
      const cfg = getConfig();
      if (cfg.options.generateTypes) {
        await writeTypes();
      }
    } catch {
      // Not a service/controller or can't read — ignore
    }
  }

  private async handleGlobalDelete(uri: vscode.Uri): Promise<void> {
    const filePath = uri.fsPath;
    if (this.classifyFileByPath(filePath)) return;

    const svc = serviceRegistry.getByFilePath(filePath);
    if (svc) {
      serviceRegistry.unregister(svc.name);
      logInfo(`Removed service (global): ${svc.name}`);
      const cfg = getConfig();
      if (cfg.options.generateTypes) {
        await writeTypes();
      }
      return;
    }

    const ctrl = controllerRegistry.getByFilePath(filePath);
    if (ctrl) {
      controllerRegistry.unregister(ctrl.name);
      logInfo(`Removed controller (global): ${ctrl.name}`);
      const cfg = getConfig();
      if (cfg.options.generateTypes) {
        await writeTypes();
      }
    }
  }

  dispose(): void {
    for (const watcher of this.watchers) {
      watcher.dispose();
    }
    this.watchers = [];
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }
}
