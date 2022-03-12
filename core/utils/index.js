const fs = require("fs");
function toUnixPath(path) {
  return path.replace(/\\/g, "/");
}

function tryExtension(modulePath, extensions, originModulePath, moduleContext) {
  extensions.unshift("");
  for (let extension of extensions) {
    if (fs.existsSync(modulePath + extension)) {
      return modulePath + extension;
    }
  }
  throw new Error(`No module, Error: Can't resolve ${originModulePath} in  ${moduleContext}`);
}
function getSourceCode(chunk) {
  const { name, entryModule, modules } = chunk;
  return `
    (() => {
      var __webpack_modules__ = {
        ${modules
          .map((module) => {
            return `
            '${module.id}': (module) => {
              ${module._source}
        }
          `;
          })
          .join(",")}
      };
      var __webpack_module_cache__ = {};
  
      function __webpack_require__(moduleId) {
        var cachedModule = __webpack_module_cache__[moduleId];
        if (cachedModule !== undefined) {
          return cachedModule.exports;
        }
        var module = (__webpack_module_cache__[moduleId] = {
          exports: {},
        });
  
        __webpack_modules__[moduleId](module, module.exports, __webpack_require__);
  

        return module.exports;
      }
  
      var __webpack_exports__ = {};
      // This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
      (() => {
        ${entryModule._source}
      })();
    })();
    `;
}

exports.getSourceCode = getSourceCode;

exports.toUnixPath = toUnixPath;

exports.tryExtension = tryExtension;
