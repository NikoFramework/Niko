export default new (class {
  public LockObjectProperty<T extends object>(originObject: T, key: keyof T, data?: any) {
    const value = originObject[key];
    if (typeof value == "function") {
      this.LockObjectDynamicProperty(originObject, key, data);
      return;
    }

    this.LockObjectStaticProperty(originObject, key, data);
  }

  public LockObjectStaticProperty<T extends object>(originObject: T, key: keyof T, data?: any) {
    Object.defineProperty(originObject, key, {
      value: data ?? originObject[key],
      writable: false,
      enumerable: true,
      configurable: true,
    });

    if (typeof data == "object") {
      this.LockObject(originObject[key] as object);
    }
  }

  public LockObjectDynamicProperty<T extends object>(originObject: T, key: keyof T, data?: any) {
    const value = data ?? originObject[key];
    Object.defineProperty(originObject, key, {
      set: () => {},
      get: typeof value == "function" ? (value as any) : () => value,
      enumerable: true,
      configurable: true,
    });
  }

  public LockObject<T extends object>(originObject: T) {
    const keys = Object.keys(originObject);
    for (const key of keys) {
      this.LockObjectProperty(originObject, key as keyof T);
    }
  }

  public LockObjectStatic<T extends object>(originObject: T) {
    const keys = Object.keys(originObject);
    for (const key of keys) {
      this.LockObjectStaticProperty(originObject, key as keyof T);
    }
  }

  public LockObjectDynamic<T extends object>(originObject: T) {
    const keys = Object.keys(originObject);
    for (const key of keys) {
      this.LockObjectDynamicProperty(originObject, key as keyof T);
    }
  }
})();
