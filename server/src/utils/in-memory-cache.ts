// in-memory cache for one-process.
export class Cache<T> {
  static instances: Record<string, Cache<unknown>> = {};

  /**
   * Create an Cache instance or get an exist instance by name.
   */
  static create<U>(name: string) {
    if (Cache.instances[name]) {
      // eslint-disable-next-line no-console
      console.warn(`Cache ${name} is exist!`);
      return Cache.instances[name] as Cache<U>;
    }
    // eslint-disable-next-line no-return-assign
    return (Cache.instances[name] = new Cache<U>(name));
  }

  static get(name: string) {
    return Cache.instances[name];
  }

  static remove(name: string) {
    if (Cache.instances[name]) {
      delete Cache.instances[name];
    }
  }

  private constructor(private _name: string) {}
  private cache: Record<string, T> = Object.create(null);
  private timers: Record<string, NodeJS.Timeout> = Object.create(null);
  private _hits = 0;

  get hits() {
    return this._hits;
  }

  /**
   * 获取所有键
   *
   * @readonly
   * @memberof Cache
   */
  get keys() {
    return Object.keys(this.cache);
  }

  /**
   * 获取缓存的值
   * @param key
   */
  get(key: string) {
    const ret = this.cache[key];
    return ret;
  }

  /**
   * 设置缓存
   * @param key 键
   * @param value 值
   * @param expire 缓存的超时时间
   */
  set(key: string, value: T, expire?: number) {
    if (expire) {
      this.timers[key] = setTimeout(() => {
        this.unset(key);
      }, expire);
    }
    this.cache[key] = value;
    return value;
  }

  /**
   * 清楚某个缓存
   * @param key 键
   */
  unset(key: string) {
    if (this.timers[key]) {
      clearTimeout(this.timers[key]);
      delete this.timers[key];
    }
    delete this.cache[key];
    return this.cache;
  }

  /**
   * 获取Cache JSON
   */
  toJSON() {
    return { ...this.cache };
  }

  toString() {
    return JSON.stringify(this.toJSON());
  }
}

const defaultCache = Cache.create('default');
export default defaultCache;
