var inherit = require('inherit'),
    fs = require('fs'),
    vm = require('vm');

module.exports = inherit(require('../lib/tech/file-assemble-tech'), {
    getName: function() {
        return 'js-module';
    },
    getDestSuffixes: function() {
        return ['js'];
    },
    getSourceSuffixes: function() {
        return ['js'];
    },
    _buildChunks: function(sourceFiles) {
        return sourceFiles.map(function(file) {
            return fs.readFileSync(file.fullname, "utf8");
        });
    },
    getBuildResult: function(sourceFiles, suffix) {
        var res = this._buildChunks(sourceFiles),
            amdFilename = this.node.resolvePath(this.node.getTargetName('amd.js')),
            amd = {};
        if (fs.existsSync(amdFilename)) {
            amd = vm.runInThisContext(fs.readFileSync(amdFilename, 'utf-8'));
        } else {
            this.node.getLogger().logWarningAction('notFound', this.node.getPath() + '/' + this.node.getTargetName('amd.js'));
        }
        this.wrapModule(res, amd);
        return res.join('\n')
    },
    wrapModule: function(res, amd) {
        var modules = [],
            args = [],
            provides = [];
        provides.push({
            module: this.node.getTargetName(),
            value: 'true'
        });
        amd.requires && amd.requires.forEach(function(item) {
            modules.push('\'' + item.module + '\'');
            return args.push(item.arg);
        });
        amd.provides && amd.provides.forEach(function(item) {
            return provides.push(item);
        });
        res.unshift('require([' + modules.join(', ') + '], function(' + args.join(', ') + ') {\n');
        provides.forEach(function(provide) {
            return res.push('require.provide(\'' + provide.module + '\', ' + provide.value + ');\n');
        });
        return res.push('\n});');
    }    
});
