declare module "@napi-rs/canvas/geometry.js" {
  export class DOMMatrix {
    constructor(init?: unknown);
  }
  export class DOMPoint {
    constructor(x?: number, y?: number, z?: number, w?: number);
  }
  export class DOMRect {
    constructor(x?: number, y?: number, width?: number, height?: number);
  }
}
