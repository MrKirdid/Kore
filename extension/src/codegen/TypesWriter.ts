/**
 * TypesWriter — Writes generated Types.luau to disk on save.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { generateTypes } from './TypesGenerator';

export async function writeTypes(): Promise<void> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) return;

  const config = vscode.workspace.getConfiguration('kore');
  const typesPath = config.get<string>('typesOutputPath', 'src/shared/Kore/Types.luau');
  const rootPath = workspaceFolders[0].uri.fsPath;
  const fullPath = path.join(rootPath, typesPath);

  const content = generateTypes();

  // Ensure directory exists
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(fullPath, content, 'utf-8');

  const debug = config.get<boolean>('debug', false);
  if (debug) {
    const outputChannel = vscode.window.createOutputChannel('Kore');
    outputChannel.appendLine(`[Kore] Types.luau written to ${fullPath}`);
  }
}
