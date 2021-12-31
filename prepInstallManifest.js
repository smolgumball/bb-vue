const util = require('util')
const dree = require('dree')
const { writeFileSync, rmSync } = require('fs')
const { trimPathTrailing, trimPathLeading } = require('./lib.js')

const config = {
  scanRoot: 'src',
  scanIncludeExtensions: ['js', 'ns', 'txt'],
  importRoot: '/bitburner-vue/',
  entryFile: '/bitburner-vue/main.js',
  manifestFile: 'installManifest.txt',
}

let manifestData = {
  importRoot: config.importRoot,
  entryFile: config.entryFile,
  manifestPaths: [],
}

dree.scan(
  `./`,
  {
    extensions: config.scanIncludeExtensions,
    normalize: true,
  },
  (fileNode) => {
    if (fileNode.relativePath.startsWith(trimPathTrailing(config.scanRoot))) {
      let installPath = fileNode.relativePath.replace(`${trimPathTrailing(config.scanRoot)}/`, '')
      manifestData.manifestPaths.push({
        repoPath: `/${trimPathLeading(fileNode.relativePath)}`,
        installPath: `/${trimPathLeading(installPath)}`,
      })
    }
  }
)

rmSync(`./${config.manifestFile}`, { force: true })
writeFileSync(`./${config.manifestFile}`, JSON.stringify(manifestData, null, '  '))

console.log(util.inspect(manifestData, { depth: null }))

module.exports = config
