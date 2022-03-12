const {SyncHook} = require('tapable')
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const generator = require('@babel/generator').default;
const t = require('@babel/types');
const {toUnixPath, tryExtension, getSourceCode} = require('./utils/index')
const fs = require('fs');
const path = require('path');
class Compiler{
    constructor(options){
        this.options = options;
        this.rootPath = this.options.context || toUnixPath(process.cwd())
        this.hooks = {
            run: new SyncHook(),
            emit: new SyncHook(),
            done: new SyncHook()
        }
        this.entries = new Set()
        this.modules = new Set()
        this.chunks = new Set()
        this.assets = {}
        this.files = new Set()

    }

    run(callback){
        this.hooks.run.call();
        const entry = this.getEntry();
        this.buildEntryModule(entry);
        this.exportFile(callback);
    }

    exportFile(callback){
        const output = this.options.output;
        this.chunks.forEach(chunk => {
            const parseFileName = output.filename.replace('[name]', chunk.name);
            this.assets[parseFileName] = getSourceCode(chunk);
        })
        this.hooks.emit.call()
        if(!fs.existsSync(output.path)){
            fs.mkdirSync(output.path)
        }
        this.files = Object.keys(this.assets);

        Object.keys(this.assets).forEach(filename => {
            const filePath = path.join(output.path, filename)
            fs.writeFileSync(filePath, this.assets[filename])
        })
        this.hooks.done.call()
        callback(null, {
            toJson: () => {
                return {
                    entries: this.entries,
                    modules: this.modules,
                    files: this.files,
                    chunks: this.chunks,
                    assets: this.assets
                }
            }
        })
    }

    getEntry(){
        let entry = Object.create(null);
        const {entry: optionsEntry} = this.options
        if(typeof optionsEntry == 'string'){
            entry['main'] = optionsEntry;
        }else{
            entry = optionsEntry;
        }

        Object.keys(entry).forEach(key => {
            const value = entry[key];
            if(!path.isAbsolute(value)){
                entry[key] = toUnixPath(path.join(this.rootPath, value));
            }
        })
        return entry;
    }

    buildEntryModule(entry){
        Object.keys(entry).forEach(entryName => {
            const entryPath = entry[entryName];
            const entryObj = this.buildModule(entryName, entryPath);
            this.entries.add(entryObj)
            this.buildUpChunk(entryName, entryObj);
        })
        console.log('2',this.entries);
        console.log('3', this.modules);
        console.log('4', this.chunks);
    }

    buildUpChunk(entryName, entryObj){
        const chunk = {
            name: entryName,
            entryModule: entryObj,
            modules: Array.from(this.modules).filter(i => i.name.includes(entryName)),
        }
        this.chunks.add(chunk);
    }

    buildModule(moduleName, modulePath){
        const originSourceCode = (this.originSourceCode = fs.readFileSync(modulePath, 'utf-8'))
        this.moduleCode = originSourceCode;
        this.handleLoader(modulePath);
        const moudle = this.handleWebpackCompiler(moduleName, modulePath);
        return moudle;
    }

    handleWebpackCompiler(moduleName, modulePath){
        const moduleId = './' + path.posix.relative(this.rootPath, modulePath)
        const module = {
            id: moduleId,
            dependencies: new Set(),
            name: [moduleName],
        }
        const ast = parser.parse(this.moduleCode, {
            sourceType: 'module'
        })
        traverse(ast, {
            CallExpression: (nodePath) => {
                const node = nodePath.node;
                if(node.callee.name === 'require'){
                    const requirePath = node.arguments[0].value;
                    const moduleDirName = path.posix.dirname(modulePath);
                    const abolutePath = tryExtension(path.posix.join(moduleDirName, requirePath), this.options.resolve.extensions, requirePath,moduleDirName)
                    const moduleId = './' + path.posix.relative(this.rootPath, abolutePath)
                    node.callee = t.identifier('__webpack_require__')
                    node.arguments = [t.stringLiteral(moduleId)]
                    let modules = Array.from(this.modules).map(i => i.id);
                    if(!modules.includes(moduleId)){
                        module.dependencies.add(moduleId)
                    }else{
                        this.modules.forEach(value => {
                            if(value.id === moduleId){
                                value.name.push(moduleName);
                            }
                        })
                    }
                }
            }
        })
        const {code} = generator(ast)
        module._source = code
        module.dependencies.forEach(dependency => {
            const depModule = this.buildModule(moduleName, dependency)
            this.modules.add(depModule);
        })
        return module;
    }

    handleLoader(modulePath){
        let matchLoaders = [];
        let rules = this.options.module.rules;
        rules.forEach(loader => {
            let loaderTest = loader.test
            if(loaderTest.test(modulePath)){
                if(loader.loader){
                    matchLoaders.push(loader.loader);
                }else if(loader.use){
                    matchLoaders.push(...loader.use);
                }
            }
        })
        for(let i = matchLoaders.length - 1; i>=0;i--){
            let loaderFn = require(matchLoaders[i]);
            this.moduleCode = loaderFn(this.moduleCode);
        }
    }
}

module.exports =Compiler;