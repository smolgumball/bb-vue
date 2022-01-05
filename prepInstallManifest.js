const util = require('util')
const dree = require('dree')
const { writeFileSync, rmSync } = require('fs')
const { trimTrailingSlash, trimLeadingSlash, joinPaths } = require('./lib.js')

const config = {
  scanRoot: 'src',
  scanIncludeExtensions: ['js', 'ns', 'txt'],
  importRoot: '/bb-vue/',
  entryFile: '/bb-vue/getting-started.js',
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
    if (fileNode.relativePath.startsWith(joinPaths(config.scanRoot, config.importRoot))) {
      let installPath = fileNode.relativePath.replace(`${trimTrailingSlash(config.scanRoot)}/`, '')
      manifestData.manifestPaths.push({
        repoPath: `/${trimLeadingSlash(fileNode.relativePath)}`,
        installPath: `/${trimLeadingSlash(installPath)}`,
      })
    }
  }
)

rmSync(`./${config.manifestFile}`, { force: true })
writeFileSync(`./${config.manifestFile}`, JSON.stringify(manifestData, null, '  '))

console.log(util.inspect(manifestData, { depth: null }))

module.exports = config
