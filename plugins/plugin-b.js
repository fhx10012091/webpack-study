class PluginB {
    apply(compiler){
        compiler.hooks.done.tap('Plugin B', () => {
            console.log('pluginB')
        })
    }
}

module.exports = PluginB;