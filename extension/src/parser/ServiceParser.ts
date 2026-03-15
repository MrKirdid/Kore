/**
 * ServiceParser — Parses a Luau service file into ServiceInfo.
 */

import * as path from 'path';
import {
  extractName,
  extractDependencies,
  extractFunctions,
  extractClientTable,
  extractNetEvents,
  extractMiddleware,
  extractRateLimits,
  extractBatching,
} from './LuauAST';
import {
  ServiceInfo,
  ServiceMethod,
  ServiceNetEvent,
  ServiceMiddleware,
  ServiceRateLimit,
} from '../registry/ServiceRegistry';

export function parseService(source: string, filePath: string): ServiceInfo | null {
  const name = extractName(source);
  if (!name) return null;

  const dependencies = extractDependencies(source);

  // Extract top-level methods (excluding lifecycle and special keys)
  const allFunctions = extractFunctions(source);
  const lifecycleNames = new Set(['Init', 'Start', 'Destroy']);
  const methods: ServiceMethod[] = [];

  for (const fn of allFunctions) {
    if (lifecycleNames.has(fn.name)) continue;
    // Filter out 'self' from params
    const params = fn.params.filter(p => p !== 'self');
    methods.push({
      name: fn.name,
      params,
      returnType: fn.hasReturn ? 'any' : null,
    });
  }

  // Parse Client table
  const clientSource = extractClientTable(source);
  const clientMethods: ServiceMethod[] = [];
  const netEvents: ServiceNetEvent[] = [];
  let middleware: ServiceMiddleware[] = [];
  let rateLimits: ServiceRateLimit[] = [];
  let hasBatching = false;

  if (clientSource) {
    const clientFunctions = extractFunctions(clientSource);
    for (const fn of clientFunctions) {
      if (fn.name === 'Middleware' || fn.name === 'RateLimit') continue;
      // Filter out 'self' and 'player' from client method params
      const params = fn.params.filter(p => p !== 'self' && p !== 'player');
      clientMethods.push({
        name: fn.name,
        params,
        returnType: fn.hasReturn ? 'any' : null,
      });
    }

    const events = extractNetEvents(clientSource);
    for (const eventName of events) {
      netEvents.push({ name: eventName });
    }

    const mws = extractMiddleware(clientSource);
    middleware = mws.map(mw => ({
      remoteName: mw.name,
      hasInbound: mw.hasInbound,
      hasOutbound: mw.hasOutbound,
    }));

    const rls = extractRateLimits(clientSource);
    rateLimits = rls.map(rl => ({
      remoteName: rl.name,
      maxCalls: rl.maxCalls,
      perSeconds: rl.perSeconds,
    }));

    hasBatching = extractBatching(clientSource);
  }

  return {
    name,
    filePath,
    methods,
    clientMethods,
    netEvents,
    middleware,
    rateLimits,
    dependencies,
    hasBatching,
    config: null,
  };
}
