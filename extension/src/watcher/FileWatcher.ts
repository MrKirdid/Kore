/**
 * FileWatcher — Watches services/ and controllers/ for changes.
 * On save/create/delete/rename: re-parses, updates registry, rewrites Types.luau.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { parseService } from '../parser/ServiceParser';
import { parseController } from '../parser/ControllerParser';
import { serviceRegistry } from '../registry/ServiceRegistry';
import { controllerRegistry } from '../registry/ControllerRegistry';
import { writeTypes } from '../codegen/TypesWriter';

export class FileWatcher {
  private watchers: vscode.FileSystemWatcher[] = [];
  private outputChannel: vscode.OutputChannel;

  constructor(outputChannel: vscode.OutputChannel) {
    this.outputChannel = outputChannel;
  }

  activate(): void {
    const config = vscode.workspace.getConfiguration('kore');
    const servicesPath = config.get<string>('servicesPath', 'src/server/services');
    const controllersPath = config.get<string>('controllersPath', 'src/client/controllers');

    // Watch services
    const serviceWatcher = vscode.workspace.createFileSystemWatcher(`**/${servicesPath}/**/*.luau`);
    serviceWatcher.onDidChange(uri => this.handleServiceChange(uri));
    serviceWatcher.onDidCreate(uri => this.handleServiceChange(uri));
    serviceWatcher.onDidDelete(uri => this.handleServiceDelete(uri));
    this.watchers.push(serviceWatcher);

    // Watch controllers
    const controllerWatcher = vscode.workspace.createFileSystemWatcher(`**/${controllersPath}/**/*.luau`);
    controllerWatcher.onDidChange(uri => this.handleControllerChange(uri));
    controllerWatcher.onDidCreate(uri => this.handleControllerChange(uri));
    controllerWatcher.onDidDelete(uri => this.handleControllerDelete(uri));
    this.watchers.push(controllerWatcher);

    this.log('File watchers activated');
  }

  async scanAll(): Promise<void> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return;

    const config = vscode.workspace.getConfiguration('kore');
    const servicesPath = config.get<string>('servicesPath', 'src/server/services');
    const controllersPath = config.get<string>('controllersPath', 'src/client/controllers');

    serviceRegistry.clear();
    controllerRegistry.clear();

    for (const folder of workspaceFolders) {
      const servicesDir = path.join(folder.uri.fsPath, servicesPath);
      const controllersDir = path.join(folder.uri.fsPath, controllersPath);

      await this.scanDirectory(servicesDir, 'service');
      await this.scanDirectory(controllersDir, 'controller');
    }

    this.log(`Scan complete: ${serviceRegistry.size} services, ${controllerRegistry.size} controllers`);
  }

  private async scanDirectory(dirPath: string, type: 'service' | 'controller'): Promise<void> {
    if (!fs.existsSync(dirPath)) return;

    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      if (!file.endsWith('.luau')) continue;
      if (file.startsWith('.')) continue;

      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) continue;

      const source = fs.readFileSync(filePath, 'utf-8');

      if (type === 'service') {
        const info = parseService(source, filePath);
        if (info) {
          serviceRegistry.register(info);
          this.log(`Registered service: ${info.name}`);
        }
      } else {
        const info = parseController(source, filePath);
        if (info) {
          controllerRegistry.register(info);
          this.log(`Registered controller: ${info.name}`);
        }
      }
    }
  }

  private async handleServiceChange(uri: vscode.Uri): Promise<void> {
    const filePath = uri.fsPath;
    const source = fs.readFileSync(filePath, 'utf-8');

    // Remove old entry for this file path
    const existing = serviceRegistry.getByFilePath(filePath);
    if (existing) {
      serviceRegistry.unregister(existing.name);
    }

    const info = parseService(source, filePath);
    if (info) {
      serviceRegistry.register(info);
      this.log(`Updated service: ${info.name}`);
    }

    await writeTypes();
  }

  private async handleServiceDelete(uri: vscode.Uri): Promise<void> {
    const existing = serviceRegistry.getByFilePath(uri.fsPath);
    if (existing) {
      serviceRegistry.unregister(existing.name);
      this.log(`Removed service: ${existing.name}`);

      // Warn about dangling references
      vscode.window.showWarningMessage(
        `Kore: Service "${existing.name}" was deleted. Check for GetService("${existing.name}") references.`
      );
    }

    await writeTypes();
  }

  private async handleControllerChange(uri: vscode.Uri): Promise<void> {
    const filePath = uri.fsPath;
    const source = fs.readFileSync(filePath, 'utf-8');

    const existing = controllerRegistry.getByFilePath(filePath);
    if (existing) {
      controllerRegistry.unregister(existing.name);
    }

    const info = parseController(source, filePath);
    if (info) {
      controllerRegistry.register(info);
      this.log(`Updated controller: ${info.name}`);
    }

    await writeTypes();
  }

  private async handleControllerDelete(uri: vscode.Uri): Promise<void> {
    const existing = controllerRegistry.getByFilePath(uri.fsPath);
    if (existing) {
      controllerRegistry.unregister(existing.name);
      this.log(`Removed controller: ${existing.name}`);

      vscode.window.showWarningMessage(
        `Kore: Controller "${existing.name}" was deleted. Check for GetController("${existing.name}") references.`
      );
    }

    await writeTypes();
  }

  private log(message: string): void {
    const config = vscode.workspace.getConfiguration('kore');
    if (config.get<boolean>('debug', false)) {
      this.outputChannel.appendLine(`[Kore] ${message}`);
    }
  }

  dispose(): void {
    for (const watcher of this.watchers) {
      watcher.dispose();
    }
    this.watchers = [];
  }
}
