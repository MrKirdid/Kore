import * as path from 'path';
import * as fs from 'fs';
import { logInfo, logError } from '../Logger';

interface RojoTreeNode {
  $className?: string;
  $path?: string;
  [key: string]: RojoTreeNode | string | undefined;
}

interface RojoProject {
  name: string;
  tree: RojoTreeNode;
}

/**
 * Resolves file system paths to Roblox Instance path segments
 * using Rojo project files (*.project.json).
 */
export class PathResolver {
  private project: RojoProject | null = null;
  private cache = new Map<string, string[]>();

  constructor(private workspaceRoot: string) {}

  async initialize(): Promise<void> {
    this.project = this.findBestProjectFile();
    if (this.project) {
      logInfo(`PathResolver: Using project "${this.project.name}"`);
    } else {
      logInfo('PathResolver: No Rojo project found, using folder conventions');
    }
  }

  /**
   * Find the best *.project.json file in the workspace root.
   * Prefers files with $className: DataModel (full game tree).
   */
  private findBestProjectFile(): RojoProject | null {
    let files: string[];
    try {
      files = fs.readdirSync(this.workspaceRoot).filter(f => f.endsWith('.project.json'));
    } catch {
      return null;
    }

    // Sort to prefer dev.project.json first (usually the full game tree)
    files.sort((a, b) => {
      if (a.startsWith('dev')) return -1;
      if (b.startsWith('dev')) return 1;
      return 0;
    });

    let fallback: RojoProject | null = null;
    for (const filename of files) {
      const filePath = path.join(this.workspaceRoot, filename);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const project: RojoProject = JSON.parse(content);
        if (project.tree?.$className === 'DataModel') {
          return project;
        }
        if (!fallback) {
          fallback = project;
        }
      } catch (e) {
        logError(`Failed to parse ${filename}`, e);
      }
    }
    return fallback;
  }

  /**
   * Resolve a file system path to Roblox Instance path segments.
   * e.g. ["ReplicatedStorage", "Shared", "Packages", "Module"]
   */
  resolveSegments(fsPath: string): string[] {
    if (this.cache.has(fsPath)) {
      return this.cache.get(fsPath)!;
    }

    let segments: string[];
    if (this.project?.tree) {
      segments = this.resolveFromRojoTree(fsPath) ?? this.resolveFromConvention(fsPath);
    } else {
      segments = this.resolveFromConvention(fsPath);
    }

    this.cache.set(fsPath, segments);
    return segments;
  }

  private resolveFromRojoTree(fsPath: string): string[] | null {
    const relativePath = path.relative(this.workspaceRoot, fsPath).replace(/\\/g, '/');
    return this.searchTree(this.project!.tree, relativePath, []);
  }

  private searchTree(node: RojoTreeNode, target: string, segments: string[]): string[] | null {
    if (node.$path) {
      const nodePath = node.$path.replace(/\\/g, '/');
      if (target === nodePath || target.startsWith(nodePath + '/')) {
        const remaining = target === nodePath ? '' : target.substring(nodePath.length + 1);
        const parts = remaining ? remaining.split('/') : [];
        return [...segments, ...this.processSegments(parts)];
      }
    }

    for (const key of Object.keys(node)) {
      if (key.startsWith('$')) continue;
      const child = node[key];
      if (child && typeof child === 'object') {
        const result = this.searchTree(child as RojoTreeNode, target, [...segments, key]);
        if (result) return result;
      }
    }
    return null;
  }

  private processSegments(segments: string[]): string[] {
    const result: string[] = [];
    for (const segment of segments) {
      const clean = this.stripExtensions(segment);
      if (clean.toLowerCase() === 'init') continue;
      result.push(clean);
    }
    return result;
  }

  private stripExtensions(name: string): string {
    return name
      .replace(/\.server\.luau$/i, '')
      .replace(/\.client\.luau$/i, '')
      .replace(/\.server\.lua$/i, '')
      .replace(/\.client\.lua$/i, '')
      .replace(/\.luau$/i, '')
      .replace(/\.lua$/i, '');
  }

  private resolveFromConvention(fsPath: string): string[] {
    const relativePath = path.relative(this.workspaceRoot, fsPath);
    const parts = relativePath.split(path.sep);
    const processed: string[] = [];
    for (const seg of parts) {
      const clean = this.stripExtensions(seg);
      if (clean.toLowerCase() === 'init') continue;
      processed.push(clean);
    }

    const serviceMap: Record<string, string[]> = {
      src: ['ReplicatedStorage'],
      server: ['ServerScriptService'],
      client: ['StarterPlayer', 'StarterPlayerScripts'],
      shared: ['ReplicatedStorage'],
    };

    if (processed.length > 0) {
      const mapped = serviceMap[processed[0].toLowerCase()];
      if (mapped) {
        processed.splice(0, 1, ...mapped);
      }
    }
    return processed;
  }

  clearCache(): void {
    this.cache.clear();
  }

  reload(): void {
    this.cache.clear();
    this.project = this.findBestProjectFile();
  }
}
