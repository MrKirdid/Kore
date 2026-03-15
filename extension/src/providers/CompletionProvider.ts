/**
 * CompletionProvider — Autocomplete for GetService/GetController and snippets.
 */

import * as vscode from 'vscode';
import { serviceRegistry } from '../registry/ServiceRegistry';
import { controllerRegistry } from '../registry/ControllerRegistry';
import { FuzzyMatcher } from '../fuzzy/FuzzyMatcher';

export class CompletionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    _context: vscode.CompletionContext
  ): vscode.CompletionItem[] {
    const lineText = document.lineAt(position).text;
    const textBefore = lineText.substring(0, position.character);

    const items: vscode.CompletionItem[] = [];

    // GetService("...") completion
    const getServiceMatch = textBefore.match(/GetService\s*\(\s*["']([^"']*)$/);
    if (getServiceMatch) {
      const query = getServiceMatch[1];
      const names = serviceRegistry.getAllNames();
      const config = vscode.workspace.getConfiguration('kore');
      const threshold = config.get<number>('fuzzyThreshold', 0.4);
      const matcher = new FuzzyMatcher(names, threshold);

      if (query.length > 0) {
        const results = matcher.search(query);
        for (const result of results) {
          const info = serviceRegistry.get(result.name);
          if (!info) continue;

          const item = new vscode.CompletionItem(result.name, vscode.CompletionItemKind.Value);
          item.detail = 'Kore Service';
          item.sortText = String(result.score).padStart(10, '0');

          const methodList = info.clientMethods.map(m => `  ${m.name}(${m.params.join(', ')})`).join('\n');
          const eventList = info.netEvents.map(e => `  ${e.name} (RemoteEvent)`).join('\n');
          const doc = `**${info.name}**\n\nMethods:\n${methodList || '  (none)'}\n\nEvents:\n${eventList || '  (none)'}`;
          item.documentation = new vscode.MarkdownString(doc);

          items.push(item);
        }
      } else {
        for (const name of names) {
          const info = serviceRegistry.get(name);
          if (!info) continue;

          const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Value);
          item.detail = 'Kore Service';

          const methodList = info.clientMethods.map(m => `  ${m.name}(${m.params.join(', ')})`).join('\n');
          const eventList = info.netEvents.map(e => `  ${e.name} (RemoteEvent)`).join('\n');
          const doc = `**${info.name}**\n\nMethods:\n${methodList || '  (none)'}\n\nEvents:\n${eventList || '  (none)'}`;
          item.documentation = new vscode.MarkdownString(doc);

          items.push(item);
        }
      }

      return items;
    }

    // GetController("...") completion
    const getControllerMatch = textBefore.match(/GetController\s*\(\s*["']([^"']*)$/);
    if (getControllerMatch) {
      const query = getControllerMatch[1];
      const names = controllerRegistry.getAllNames();
      const config = vscode.workspace.getConfiguration('kore');
      const threshold = config.get<number>('fuzzyThreshold', 0.4);
      const matcher = new FuzzyMatcher(names, threshold);

      if (query.length > 0) {
        const results = matcher.search(query);
        for (const result of results) {
          const info = controllerRegistry.get(result.name);
          if (!info) continue;

          const item = new vscode.CompletionItem(result.name, vscode.CompletionItemKind.Value);
          item.detail = 'Kore Controller';
          item.sortText = String(result.score).padStart(10, '0');

          const methodList = info.methods.map(m => `  ${m.name}(${m.params.join(', ')})`).join('\n');
          const doc = `**${info.name}**\n\nMethods:\n${methodList || '  (none)'}`;
          item.documentation = new vscode.MarkdownString(doc);

          items.push(item);
        }
      } else {
        for (const name of names) {
          const info = controllerRegistry.get(name);
          if (!info) continue;

          const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Value);
          item.detail = 'Kore Controller';

          const methodList = info.methods.map(m => `  ${m.name}(${m.params.join(', ')})`).join('\n');
          const doc = `**${info.name}**\n\nMethods:\n${methodList || '  (none)'}`;
          item.documentation = new vscode.MarkdownString(doc);

          items.push(item);
        }
      }

      return items;
    }

    // Snippet completions
    const enableSnippets = vscode.workspace.getConfiguration('kore').get<boolean>('enableSnippets', true);
    if (!enableSnippets) return items;

    const filePath = document.uri.fsPath;
    const servicesPath = vscode.workspace.getConfiguration('kore').get<string>('servicesPath', 'src/server/services');
    const controllersPath = vscode.workspace.getConfiguration('kore').get<string>('controllersPath', 'src/client/controllers');

    // ::preset snippet
    if (textBefore.trimStart() === '::preset') {
      if (filePath.includes(servicesPath)) {
        const snippet = new vscode.CompletionItem('::preset', vscode.CompletionItemKind.Snippet);
        snippet.insertText = new vscode.SnippetString(
          'return {\n' +
          '\tName = "${1:ServiceName}",\n\n' +
          '\tClient = {\n\t\t$2\n\t},\n\n' +
          '\tInit = function(self, ctx)\n\t\t$0\n\tend,\n\n' +
          '\tStart = function(self, ctx)\n\n\tend,\n' +
          '}'
        );
        snippet.detail = 'Kore Service preset';
        items.push(snippet);
      } else if (filePath.includes(controllersPath)) {
        const snippet = new vscode.CompletionItem('::preset', vscode.CompletionItemKind.Snippet);
        snippet.insertText = new vscode.SnippetString(
          'return {\n' +
          '\tName = "${1:ControllerName}",\n\n' +
          '\tInit = function(self, ctx)\n\t\t$0\n\tend,\n\n' +
          '\tStart = function(self, ctx)\n\n\tend,\n' +
          '}'
        );
        snippet.detail = 'Kore Controller preset';
        items.push(snippet);
      }
    }

    // :AddService snippet
    if (textBefore.match(/:AddService$/)) {
      const snippet = new vscode.CompletionItem(':AddService', vscode.CompletionItemKind.Snippet);
      snippet.insertText = new vscode.SnippetString(
        'Kore:AddService({\n' +
        '\tName = "${1:ServiceName}",\n' +
        '\tClient = {},\n' +
        '\tInit = function(self, ctx) $0 end,\n' +
        '\tStart = function(self, ctx) end,\n' +
        '})'
      );
      snippet.detail = 'Add Kore Service';
      items.push(snippet);
    }

    // :AddController snippet
    if (textBefore.match(/:AddController$/)) {
      const snippet = new vscode.CompletionItem(':AddController', vscode.CompletionItemKind.Snippet);
      snippet.insertText = new vscode.SnippetString(
        'Kore:AddController({\n' +
        '\tName = "${1:ControllerName}",\n' +
        '\tInit = function(self, ctx) $0 end,\n' +
        '\tStart = function(self, ctx) end,\n' +
        '})'
      );
      snippet.detail = 'Add Kore Controller';
      items.push(snippet);
    }

    return items;
  }
}
