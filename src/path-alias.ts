import * as path from 'path';
import * as Module from 'module';

const originalResolveFilename = (Module as any).Module
  ._resolveFilename as (
  request: string,
  parent: NodeModule,
  isMain: boolean,
  options?: unknown,
) => string;

(Module as any).Module._resolveFilename = function (
  request: string,
  parent: NodeModule,
  isMain: boolean,
  options?: unknown,
) {
  if (request.startsWith('src/')) {
    const resolved = path.join(__dirname, request.slice(4));
    return originalResolveFilename.call(
      this,
      resolved,
      parent,
      isMain,
      options,
    );
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};
