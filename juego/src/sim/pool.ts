/**
 * Object pool genérico: reutiliza objetos en vez de crearlos y destruirlos cada frame
 * (menos trabajo para el recolector de basura en PCs con poca RAM).
 */
export class Pool<T> {
  private readonly free: T[] = [];
  private readonly used = new Set<T>();

  constructor(
    private readonly create: () => T,
    private readonly reset: (item: T) => void,
    private readonly max = 32,
  ) {}

  /** Entrega un objeto libre o crea uno nuevo; devuelve null si se alcanzó el máximo. */
  acquire(): T | null {
    let item = this.free.pop();
    if (item === undefined) {
      if (this.used.size >= this.max) return null;
      item = this.create();
    }
    this.used.add(item);
    return item;
  }

  release(item: T): void {
    if (!this.used.delete(item)) return;
    this.reset(item);
    this.free.push(item);
  }

  get activeCount(): number {
    return this.used.size;
  }

  get freeCount(): number {
    return this.free.length;
  }
}
