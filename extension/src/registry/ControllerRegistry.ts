/**
 * ControllerRegistry — In-memory registry of all discovered controllers.
 */

export interface ControllerMethod {
  name: string;
  params: string[];
  returnType: string | null;
}

export interface ControllerInfo {
  name: string;
  filePath: string;
  methods: ControllerMethod[];
  dependencies: string[];
  config: Record<string, unknown> | null;
}

class ControllerRegistry {
  private controllers: Map<string, ControllerInfo> = new Map();

  register(info: ControllerInfo): void {
    this.controllers.set(info.name, info);
  }

  unregister(name: string): void {
    this.controllers.delete(name);
  }

  get(name: string): ControllerInfo | undefined {
    return this.controllers.get(name);
  }

  getAll(): ControllerInfo[] {
    return Array.from(this.controllers.values());
  }

  getAllNames(): string[] {
    return Array.from(this.controllers.keys());
  }

  has(name: string): boolean {
    return this.controllers.has(name);
  }

  getByFilePath(filePath: string): ControllerInfo | undefined {
    for (const ctrl of this.controllers.values()) {
      if (ctrl.filePath === filePath) {
        return ctrl;
      }
    }
    return undefined;
  }

  clear(): void {
    this.controllers.clear();
  }

  get size(): number {
    return this.controllers.size;
  }
}

export const controllerRegistry = new ControllerRegistry();
export default ControllerRegistry;
