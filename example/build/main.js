(() => {
  var __webpack_modules__ = {
    "./example/src/module2.js": (module) => {
      module.exports = {
        a: 2,
      };
      const loader2 = "11111";
      const loader1 = "https://www.baidu.com";
    },
    "./example/src/module.js": (module) => {
      const a = __webpack_require__("./example/src/module2.js");

      const name = "方海鑫";
      module.export = {
        name,
        a,
      };
      const loader2 = "11111";
      const loader1 = "https://www.baidu.com";
    },
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
    const name = __webpack_require__("./example/src/module.js");

    console.log("1111111", name);
    const loader2 = "11111";
    const loader1 = "https://www.baidu.com";
  })();
})();
