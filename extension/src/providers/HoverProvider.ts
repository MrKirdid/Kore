/**
 * HoverProvider — Hover documentation for Kore APIs, GetService, and GetController.
 */

import * as vscode from 'vscode';
import { serviceRegistry } from '../registry/ServiceRegistry';
import { controllerRegistry } from '../registry/ControllerRegistry';

const KORE_API_DOCS: Record<string, string> = {
  'Configure': '```\nKore.Configure(config)\n```\nConfigure Kore settings before Start(). Options: Debug, Destroy, Log.',
  'Start': '```\nKore.Start() -> Promise\n```\nBoot Kore. Auto-discovers services/controllers, resolves dependencies, runs Init then Start.',
  'AddService': '```\nKore:AddService(serviceTable)\n```\nRegister a service (server only). Service table must have a Name field.',
  'AddController': '```\nKore:AddController(controllerTable)\n```\nRegister a controller (client only). Controller table must have a Name field.',
  'GetService': '```\nKore.GetService(name) -> Service | ServiceClient\n```\nRetrieve a service by name. Server returns real instance, client returns typed proxy.',
  'GetController': '```\nKore.GetController(name) -> Controller\n```\nRetrieve a controller by name (client only).',
  'DestroyService': '```\nKore.DestroyService(name)\n```\nDynamic destroy (requires Destroy = "dynamic"). Calls Destroy(), cleans Janitor, removes remotes.',
  'DestroyController': '```\nKore.DestroyController(name)\n```\nDynamic destroy (requires Destroy = "dynamic"). Calls Destroy(), cleans Janitor.',
  'NetEvent': '```\nKore.NetEvent\n```\nSentinel value for declaring server-to-client event remotes in Client tables.',
  'Signal': '```\nKore.Signal.new(config?)\n```\nLightweight signal. Optional networking via { Network = true, Owner = "Server"|"Client"|"Both" }.',
  'Promise': '```\nKore.Promise\n```\nRe-export of evaera/promise. Full Promise/A+ implementation.',
  'Log': '```\nKore.Log\n```\nStructured logger. Levels: Debug, Info, Warn, Error. Tagged per service.',
  'Timer': '```\nKore.Timer\n```\nDebounce, Throttle, Delay, Every, Heartbeat/Stepped/RenderStepped wrappers.',
  'Tween': '```\nKore.Tween.new(instance)\n```\nBuilder pattern tween. Chain :Property(), :Duration(), :Easing(), :Play() -> Promise.',
  'Curve': '```\nKore.Curve.new(keyframes)\n```\nKeyframe curve sampler. Call :Sample(t) or :SampleSmooth(t).',
  'Data': '```\nKore.Data\n```\nProfileStore bridge. Load, Get, OnLoaded, Save, Release.',
  'Thread': '```\nKore.Thread\n```\nWeave wrapper for parallel Luau. Pool(count, script), Kernel(actor). Experimental.',
  'Mock': '```\nKore.Mock\n```\nTest isolation. Mock.Service(def), Mock.Controller(def) — no Kore.Start() needed.',
  'Janitor': '```\nKore.Janitor\n```\nCleanup management. Auto-created on every service/controller.',
  'Fusion': '```\nKore.Fusion\n```\nRe-export of elttob/fusion.',
  'Util': '```\nKore.Util\n```\nUtility modules: Table, String, Math.',
  'Symbol': '```\nKore.Symbol(name) -> Symbol\n```\nCreate/retrieve a unique opaque sentinel value. Interned by name.',
};

export class HoverProvider implements vscode.HoverProvider {
  provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): vscode.Hover | null {
    const range = document.getWordRangeAtPosition(position, /[\w.]+/);
    if (!range) return null;

    const word = document.getText(range);

    // Check for Kore.GetService("Name") hover
    const line = document.lineAt(position).text;
    const getServiceMatch = line.match(/GetService\s*\(\s*["']([^"']+)["']\s*\)/);
    if (getServiceMatch) {
      const name = getServiceMatch[1];
      const info = serviceRegistry.get(name);
      if (info) {
        const methods = info.clientMethods.map(m => `- \`${m.name}(${m.params.join(', ')})\``).join('\n');
        const events = info.netEvents.map(e => `- \`${e.name}\` (RemoteEvent)`).join('\n');
        const remoteTypes = info.clientMethods.map(m =>
          `- \`${m.name}\` (${m.returnType ? 'RemoteFunction' : 'RemoteEvent'})`
        ).join('\n');

        const md = new vscode.MarkdownString();
        md.appendMarkdown(`### ${info.name}\n\n`);
        md.appendMarkdown(`**Methods:**\n${methods || '(none)'}\n\n`);
        md.appendMarkdown(`**Client remotes:**\n${remoteTypes || '(none)'}\n\n`);
        if (events) {
          md.appendMarkdown(`**Events:**\n${events}\n`);
        }
        return new vscode.Hover(md, range);
      }
    }

    // Check for Kore.GetController("Name") hover
    const getControllerMatch = line.match(/GetController\s*\(\s*["']([^"']+)["']\s*\)/);
    if (getControllerMatch) {
      const name = getControllerMatch[1];
      const info = controllerRegistry.get(name);
      if (info) {
        const methods = info.methods.map(m => `- \`${m.name}(${m.params.join(', ')})\``).join('\n');
        const md = new vscode.MarkdownString();
        md.appendMarkdown(`### ${info.name}\n\n`);
        md.appendMarkdown(`**Methods:**\n${methods || '(none)'}\n`);
        return new vscode.Hover(md, range);
      }
    }

    // Check for Kore.* API hover
    const koreApiMatch = word.match(/^Kore\.(\w+)$/);
    if (koreApiMatch) {
      const apiName = koreApiMatch[1];
      const doc = KORE_API_DOCS[apiName];
      if (doc) {
        return new vscode.Hover(new vscode.MarkdownString(doc), range);
      }
    }

    return null;
  }
}
