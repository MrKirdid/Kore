/**
 * Logger — Shared output channel and logging for the Kore extension.
 *
 * Always logs errors/warnings regardless of debug setting.
 * Debug-level messages are gated behind kore.debug.
 */

import * as vscode from 'vscode';

let outputChannel: vscode.OutputChannel | undefined;
let debugEnabled = false;

function timestamp(): string {
  return new Date().toISOString().slice(11, 23); // HH:mm:ss.SSS
}

export function initLogger(channel: vscode.OutputChannel): void {
  outputChannel = channel;
  refreshDebugSetting();
}

export function refreshDebugSetting(): void {
  debugEnabled = vscode.workspace.getConfiguration('kore').get<boolean>('debug', false);
}

/** Set debug state directly (e.g. from Kore.toml). */
export function setDebugEnabled(enabled: boolean): void {
  debugEnabled = enabled;
}

export function isDebug(): boolean {
  return debugEnabled;
}

/** Always logged. */
export function logInfo(message: string): void {
  outputChannel?.appendLine(`[${timestamp()}] [INFO]  ${message}`);
}

/** Always logged. Shows the output channel so the user notices. */
export function logError(message: string, error?: unknown): void {
  const suffix = error instanceof Error ? `: ${error.message}` : error ? `: ${String(error)}` : '';
  outputChannel?.appendLine(`[${timestamp()}] [ERROR] ${message}${suffix}`);
  if (error instanceof Error && error.stack) {
    outputChannel?.appendLine(error.stack);
  }
  outputChannel?.show(true); // reveal channel on errors
}

/** Always logged. */
export function logWarn(message: string): void {
  outputChannel?.appendLine(`[${timestamp()}] [WARN]  ${message}`);
}

/** Only logged when kore.debug is true. */
export function logDebug(message: string): void {
  if (!debugEnabled) return;
  outputChannel?.appendLine(`[${timestamp()}] [DEBUG] ${message}`);
}
