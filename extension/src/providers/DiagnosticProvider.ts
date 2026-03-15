/**
 * DiagnosticProvider — Kore-specific diagnostics for service and controller files.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import { serviceRegistry } from '../registry/ServiceRegistry';
import { controllerRegistry } from '../registry/ControllerRegistry';
import { FuzzyMatcher } from '../fuzzy/FuzzyMatcher';
import {
  extractName,
  extractDependencies,
  extractClientTable,
  extractNetEvents,
  extractMiddleware,
  extractRateLimits,
  extractFunctions,
} from '../parser/LuauAST';

const DIAGNOSTIC_SOURCE = 'Kore';

export class DiagnosticProvider {
  private diagnosticCollection: vscode.DiagnosticCollection;

  constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection(DIAGNOSTIC_SOURCE);
  }

  update(document: vscode.TextDocument): void {
    const config = vscode.workspace.getConfiguration('kore');
    if (!config.get<boolean>('enableDiagnostics', true)) {
      this.diagnosticCollection.delete(document.uri);
      return;
    }

    const diagnostics: vscode.Diagnostic[] = [];
    const source = document.getText();
    const filePath = document.uri.fsPath;
    const servicesPath = config.get<string>('servicesPath', 'src/server/services');
    const controllersPath = config.get<string>('controllersPath', 'src/client/controllers');

    const isService = filePath.includes(servicesPath);
    const isController = filePath.includes(controllersPath);

    if (isService) {
      this.checkService(document, source, filePath, diagnostics);
    } else if (isController) {
      this.checkController(document, source, filePath, diagnostics);
    }

    // Check GetService/GetController calls anywhere
    this.checkGetServiceCalls(document, source, diagnostics);
    this.checkGetControllerCalls(document, source, diagnostics);

    this.diagnosticCollection.set(document.uri, diagnostics);
  }

  private checkService(
    document: vscode.TextDocument,
    source: string,
    filePath: string,
    diagnostics: vscode.Diagnostic[]
  ): void {
    const name = extractName(source);
    if (!name) return;

    const fileName = path.basename(filePath, '.luau');

    // Name mismatch
    if (name !== fileName) {
      const nameMatch = source.match(/Name\s*=\s*["']([^"']+)["']/);
      if (nameMatch && nameMatch.index !== undefined) {
        const pos = document.positionAt(nameMatch.index);
        const range = new vscode.Range(pos, pos.translate(0, nameMatch[0].length));
        diagnostics.push(new vscode.Diagnostic(
          range,
          `Service.Name "${name}" does not match filename "${fileName}"`,
          vscode.DiagnosticSeverity.Warning
        ));
      }
    }

    // Duplicate name check
    const existing = serviceRegistry.get(name);
    if (existing && existing.filePath !== filePath) {
      const nameMatch = source.match(/Name\s*=\s*["']([^"']+)["']/);
      if (nameMatch && nameMatch.index !== undefined) {
        const pos = document.positionAt(nameMatch.index);
        const range = new vscode.Range(pos, pos.translate(0, nameMatch[0].length));
        diagnostics.push(new vscode.Diagnostic(
          range,
          `Duplicate service Name "${name}" — also defined in ${path.basename(existing.filePath)}`,
          vscode.DiagnosticSeverity.Error
        ));
      }
    }

    // Check dependencies
    const deps = extractDependencies(source);
    const allServiceNames = serviceRegistry.getAllNames();
    const matcher = new FuzzyMatcher(allServiceNames);

    for (const dep of deps) {
      if (!serviceRegistry.has(dep)) {
        const depMatch = new RegExp(`["']${this.escapeRegex(dep)}["']`).exec(source);
        if (depMatch && depMatch.index !== undefined) {
          const pos = document.positionAt(depMatch.index);
          const range = new vscode.Range(pos, pos.translate(0, depMatch[0].length));

          let message = `Dependencies entry "${dep}" is not a known service name`;
          const suggestions = matcher.search(dep);
          if (suggestions.length > 0) {
            message += `. Did you mean "${suggestions[0].name}"?`;
          }

          diagnostics.push(new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Warning));
        }
      }
    }

    // Check Client table
    const clientSource = extractClientTable(source);
    if (clientSource) {
      const clientFunctions = extractFunctions(clientSource);
      const clientMethodNames = new Set(clientFunctions.map(f => f.name));

      // Middleware keys vs Client methods
      const middleware = extractMiddleware(clientSource);
      for (const mw of middleware) {
        if (!clientMethodNames.has(mw.name)) {
          diagnostics.push(this.createSimpleDiagnostic(
            document, source, mw.name,
            `Middleware key "${mw.name}" has no matching Client method`,
            vscode.DiagnosticSeverity.Warning
          ));
        }
      }

      // RateLimit keys vs Client methods
      const rateLimits = extractRateLimits(clientSource);
      for (const rl of rateLimits) {
        if (!clientMethodNames.has(rl.name)) {
          diagnostics.push(this.createSimpleDiagnostic(
            document, source, rl.name,
            `RateLimit key "${rl.name}" has no matching Client method`,
            vscode.DiagnosticSeverity.Warning
          ));
        }
      }
    }

    // NetEvent outside Client table
    const netEventOutside = source.match(/Kore\.NetEvent/g);
    if (netEventOutside && !clientSource) {
      diagnostics.push(this.createSimpleDiagnostic(
        document, source, 'Kore.NetEvent',
        'Kore.NetEvent used outside the Client table',
        vscode.DiagnosticSeverity.Warning
      ));
    }
  }

  private checkController(
    document: vscode.TextDocument,
    source: string,
    filePath: string,
    diagnostics: vscode.Diagnostic[]
  ): void {
    const name = extractName(source);
    if (!name) return;

    const fileName = path.basename(filePath, '.luau');

    // Name mismatch
    if (name !== fileName) {
      const nameMatch = source.match(/Name\s*=\s*["']([^"']+)["']/);
      if (nameMatch && nameMatch.index !== undefined) {
        const pos = document.positionAt(nameMatch.index);
        const range = new vscode.Range(pos, pos.translate(0, nameMatch[0].length));
        diagnostics.push(new vscode.Diagnostic(
          range,
          `Controller.Name "${name}" does not match filename "${fileName}"`,
          vscode.DiagnosticSeverity.Warning
        ));
      }
    }

    // Duplicate name
    const existing = controllerRegistry.get(name);
    if (existing && existing.filePath !== filePath) {
      const nameMatch = source.match(/Name\s*=\s*["']([^"']+)["']/);
      if (nameMatch && nameMatch.index !== undefined) {
        const pos = document.positionAt(nameMatch.index);
        const range = new vscode.Range(pos, pos.translate(0, nameMatch[0].length));
        diagnostics.push(new vscode.Diagnostic(
          range,
          `Duplicate controller Name "${name}" — also defined in ${path.basename(existing.filePath)}`,
          vscode.DiagnosticSeverity.Error
        ));
      }
    }

    // Check dependencies
    const deps = extractDependencies(source);
    const allNames = [...controllerRegistry.getAllNames(), ...serviceRegistry.getAllNames()];
    const matcher = new FuzzyMatcher(allNames);

    for (const dep of deps) {
      if (!controllerRegistry.has(dep) && !serviceRegistry.has(dep)) {
        const depMatch = new RegExp(`["']${this.escapeRegex(dep)}["']`).exec(source);
        if (depMatch && depMatch.index !== undefined) {
          const pos = document.positionAt(depMatch.index);
          const range = new vscode.Range(pos, pos.translate(0, depMatch[0].length));

          let message = `Dependencies entry "${dep}" is not a known name`;
          const suggestions = matcher.search(dep);
          if (suggestions.length > 0) {
            message += `. Did you mean "${suggestions[0].name}"?`;
          }

          diagnostics.push(new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Warning));
        }
      }
    }
  }

  private checkGetServiceCalls(
    document: vscode.TextDocument,
    source: string,
    diagnostics: vscode.Diagnostic[]
  ): void {
    const pattern = /GetService\s*\(\s*["']([^"']+)["']\s*\)/g;
    let match;

    while ((match = pattern.exec(source)) !== null) {
      const name = match[1];
      if (!serviceRegistry.has(name)) {
        const pos = document.positionAt(match.index);
        const range = new vscode.Range(pos, pos.translate(0, match[0].length));

        let message = `Kore.GetService called with unknown name "${name}"`;
        const allNames = serviceRegistry.getAllNames();
        if (allNames.length > 0) {
          const matcher = new FuzzyMatcher(allNames);
          const suggestions = matcher.search(name);
          if (suggestions.length > 0) {
            message += `. Did you mean "${suggestions[0].name}"?`;
          }
        }

        diagnostics.push(new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Warning));
      }
    }
  }

  private checkGetControllerCalls(
    document: vscode.TextDocument,
    source: string,
    diagnostics: vscode.Diagnostic[]
  ): void {
    const pattern = /GetController\s*\(\s*["']([^"']+)["']\s*\)/g;
    let match;

    while ((match = pattern.exec(source)) !== null) {
      const name = match[1];
      if (!controllerRegistry.has(name)) {
        const pos = document.positionAt(match.index);
        const range = new vscode.Range(pos, pos.translate(0, match[0].length));

        let message = `Kore.GetController called with unknown name "${name}"`;
        const allNames = controllerRegistry.getAllNames();
        if (allNames.length > 0) {
          const matcher = new FuzzyMatcher(allNames);
          const suggestions = matcher.search(name);
          if (suggestions.length > 0) {
            message += `. Did you mean "${suggestions[0].name}"?`;
          }
        }

        diagnostics.push(new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Warning));
      }
    }
  }

  private createSimpleDiagnostic(
    document: vscode.TextDocument,
    source: string,
    searchText: string,
    message: string,
    severity: vscode.DiagnosticSeverity
  ): vscode.Diagnostic {
    const index = source.indexOf(searchText);
    if (index >= 0) {
      const pos = document.positionAt(index);
      const range = new vscode.Range(pos, pos.translate(0, searchText.length));
      return new vscode.Diagnostic(range, message, severity);
    }
    return new vscode.Diagnostic(new vscode.Range(0, 0, 0, 0), message, severity);
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  dispose(): void {
    this.diagnosticCollection.dispose();
  }
}
