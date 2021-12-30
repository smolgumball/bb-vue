const util = require('util')
const dree = require('dree')
const { writeFileSync, rmSync } = require('fs')

const config = {
  rootDirName: 'src',
  includeExtensions: ['js', 'txt'],
  treeFile: 'installTree.txt',
}

let toSave = { paths: [] }
dree.scan(
  `./`,
  {
    extensions: config.includeExtensions,
    normalize: true,
  },
  (fileNode) => {
    if (fileNode.relativePath.startsWith(config.rootDirName)) {
      toSave.paths.push(fileNode.relativePath)
    }
  }
)

rmSync(`./${config.treeFile}`, { force: true })
writeFileSync(`./${config.treeFile}`, JSON.stringify(toSave, null, '  '))

console.log(util.inspect(toSave, { depth: null }))

module.exports = config
