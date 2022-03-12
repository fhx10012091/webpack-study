class PluginA {
    apply(compiler){
        compiler.hooks.run.tap('Plugin A', () => {
            console.log('pluginA')
        })
    }
}

module.exports = PluginA;