/**
 * TypesWriter — Writes generated Types.luau to disk on save.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { generateTypes } from './TypesGenerator';
import { getConfig } from '../config/KoreConfig';
import { logInfo, logError } from '../Logger';

export async function writeTypes(): Promise<void> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    logError('Cannot write Types.luau — no workspace folders');
    return;
  }

  const cfg = getConfig();
  const typesPath = cfg.paths.types;
  const rootPath = workspaceFolders[0].uri.fsPath;
  const fullPath = path.join(rootPath, typesPath);

  try {
    const content = generateTypes();

    // Ensure directory exists
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logInfo(`Created directory: ${dir}`);
    }

    fs.writeFileSync(fullPath, content, 'utf-8');
    logInfo(`Types.luau written to ${fullPath} (${content.length} bytes)`);
  } catch (err) {
    logError(`Failed to write Types.luau to ${fullPath}`, err);
  }
}
