/**
 * CodeActionProvider — Quick-fix actions for Kore diagnostics.
 *
 * Provides "Did you mean X?" fixes for misspelled service/controller names
 * and name↔filename mismatch fixes.
 */

import * as vscode from 'vscode';
import * as path from 'path';

const DIAGNOSTIC_SOURCE = 'Kore';

export class KoreCodeActionProvider implements vscode.CodeActionProvider {
  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
  ): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];

    for (const diag of context.diagnostics) {
      if (diag.source !== DIAGNOSTIC_SOURCE) continue;

      // "Did you mean X?" suggestions
      const didYouMean = diag.message.match(/Did you mean "([^"]+)"\?/);
      if (didYouMean) {
        const suggestion = didYouMean[1];
        const action = new vscode.CodeAction(
          `Replace with "${suggestion}"`,
          vscode.CodeActionKind.QuickFix,
        );
        const edit = new vscode.WorkspaceEdit();

        // Find the quoted string in the diagnostic range
        const diagText = document.getText(diag.range);
        const quoteMatch = diagText.match(/["']([^"']+)["']/);
        if (quoteMatch && quoteMatch.index !== undefined) {
          const quoteStart = diag.range.start.translate(0, quoteMatch.index + 1);
          const quoteEnd = quoteStart.translate(0, quoteMatch[1].length);
          edit.replace(document.uri, new vscode.Range(quoteStart, quoteEnd), suggestion);
        } else {
          edit.replace(document.uri, diag.range, diagText.replace(/["'][^"']+["']/, `"${suggestion}"`));
        }

        action.edit = edit;
        action.diagnostics = [diag];
        action.isPreferred = true;
        actions.push(action);
      }

      // Name/filename mismatch → rename Name to match filename
      const nameMismatch = diag.message.match(/\.Name "([^"]+)" does not match filename "([^"]+)"/);
      if (nameMismatch) {
        const currentName = nameMismatch[1];
        const fileName = nameMismatch[2];

        const fixAction = new vscode.CodeAction(
          `Rename to "${fileName}" (match filename)`,
          vscode.CodeActionKind.QuickFix,
        );
        const edit = new vscode.WorkspaceEdit();
        const diagText = document.getText(diag.range);
        edit.replace(
          document.uri,
          diag.range,
          diagText.replace(`"${currentName}"`, `"${fileName}"`).replace(`'${currentName}'`, `'${fileName}'`),
        );
        fixAction.edit = edit;
        fixAction.diagnostics = [diag];
        fixAction.isPreferred = true;
        actions.push(fixAction);
      }
    }

    return actions;
  }
}
