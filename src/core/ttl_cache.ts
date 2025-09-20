class TTLCache<T extends Object> {
  private cache: T | null;
  private expire: Date;
  private ttl: number;

  private addSeconds(seconds: number) {
    this.expire.setSeconds(this.expire.getSeconds() + seconds);
  }
  private subSeconds(seconds: number) {
    this.expire.setSeconds(this.expire.getSeconds() - seconds);
  }

  constructor(
    cache: T | null,
    ttl?: number,
    producer?: () => Promise<T | null>
  ) {
    this.cache = cache;
    this.expire = new Date();
    this.addSeconds(ttl || 0);
    this.ttl = ttl || 0;
    if (!this.producer && producer) {
      this.producer = producer;
    }
  }

  producer: () => Promise<T | null>;

  async get(): Promise<T | null> {
    if (this.expire < new Date() || this.cache === null) {
      if (this.producer) {
        this.cache = await this.producer();
        this.expire = new Date();
        this.addSeconds(this.ttl || 0);
      }
      return this.cache;
    }
    return this.cache;
  }

  set(cache: T) {
    this.cache = cache;
    this.expire = new Date();
    this.addSeconds(this.ttl || 0);
  }

  setWithTTL(cache: T, ttl: number) {
    this.cache = cache;
    this.expire = new Date();
    this.addSeconds(ttl);
    this.ttl = ttl;
  }

  setTTL(ttl: number) {
    this.expire = new Date();
    this.subSeconds(this.ttl);
    this.ttl = ttl;
    this.addSeconds(this.ttl);
  }

  async update() {
    if (this.producer) {
      this.cache = await this.producer();
      this.expire = new Date();
      this.addSeconds(this.ttl || 0);
    }
  }

  get expired(): boolean {
    return this.expire < new Date();
  }

  markExpired() {
    this.subSeconds(this.ttl + 1);
  }
}

export default TTLCache;
