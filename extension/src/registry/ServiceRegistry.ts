/**
 * ServiceRegistry — In-memory registry of all discovered services.
 */

export interface MethodParam {
  name: string;
  type: string;
}

export interface ServiceMethod {
  name: string;
  params: MethodParam[];
  returnType: string | null;
}

export interface ServiceNetEvent {
  name: string;
}

export interface ServiceMiddleware {
  remoteName: string;
  hasInbound: boolean;
  hasOutbound: boolean;
}

export interface ServiceRateLimit {
  remoteName: string;
  maxCalls: number;
  perSeconds: number;
}

export interface ServiceInfo {
  name: string;
  filePath: string;
  methods: ServiceMethod[];
  clientMethods: ServiceMethod[];
  netEvents: ServiceNetEvent[];
  middleware: ServiceMiddleware[];
  rateLimits: ServiceRateLimit[];
  dependencies: string[];
  hasBatching: boolean;
  config: Record<string, unknown> | null;
}

class ServiceRegistry {
  private services: Map<string, ServiceInfo> = new Map();

  register(info: ServiceInfo): void {
    this.services.set(info.name, info);
  }

  unregister(name: string): void {
    this.services.delete(name);
  }

  get(name: string): ServiceInfo | undefined {
    return this.services.get(name);
  }

  getAll(): ServiceInfo[] {
    return Array.from(this.services.values());
  }

  getAllNames(): string[] {
    return Array.from(this.services.keys());
  }

  has(name: string): boolean {
    return this.services.has(name);
  }

  getByFilePath(filePath: string): ServiceInfo | undefined {
    for (const svc of this.services.values()) {
      if (svc.filePath === filePath) {
        return svc;
      }
    }
    return undefined;
  }

  clear(): void {
    this.services.clear();
  }

  get size(): number {
    return this.services.size;
  }
}

export const serviceRegistry = new ServiceRegistry();
export default ServiceRegistry;
