/* eslint-disable no-undef */
const util = require('util')
const dree = require('dree')
const { writeFileSync, rmSync } = require('fs')
const { trimTrailingSlash, trimLeadingSlash, joinPaths } = require('./lib.js')
/* eslint-enable no-undef */

const config = {
  scanRoot: 'src',
  scanIncludeExtensions: ['js', 'ns', 'txt'],
  scanExcludes: [/\/node_modules\//, /.git/, /publishing-key\.txt/],
  importRoot: '/bb-vue/',
  entryFile: '/bb-vue/examples/0-getting-started.js',
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
    exclude: config.scanExcludes,
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

// eslint-disable-next-line no-undef
module.exports = config
