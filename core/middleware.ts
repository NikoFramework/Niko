/**
 *
 *           插件中间件
 *
 */

export default function InitializeMiddleware() {
    return Middleware.Initialize();
}

export class Middleware {
  // Initialize single instance
  public static Initialize() {
    if (!Middleware.instance) {
      Middleware.instance = new Middleware();
    }

    return Middleware.instance;
  }

  private static instance: Middleware;
  private constructor() {}

  public Patch() {
    
  }
}
