/**
 * ControllerParser — Parses a Luau controller file into ControllerInfo.
 */

import {
  extractName,
  extractDependencies,
  extractFunctions,
} from './LuauAST';
import { ControllerInfo, ControllerMethod } from '../registry/ControllerRegistry';

export function parseController(source: string, filePath: string): ControllerInfo | null {
  const name = extractName(source);
  if (!name) return null;

  const dependencies = extractDependencies(source);

  const allFunctions = extractFunctions(source);
  const lifecycleNames = new Set(['Init', 'Start', 'Destroy']);
  const methods: ControllerMethod[] = [];

  for (const fn of allFunctions) {
    if (lifecycleNames.has(fn.name)) continue;
    const params = fn.params.filter(p => p.name !== 'self');
    methods.push({
      name: fn.name,
      params,
      returnType: fn.returnType,
    });
  }

  return {
    name,
    filePath,
    methods,
    dependencies,
    config: null,
  };
}
