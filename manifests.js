/* eslint-disable no-undef */
const util = require('util')
const dree = require('dree')
const { writeFileSync, rmSync } = require('fs')
const { trimTrailingSlash, trimLeadingSlash, joinPaths } = require('./lib.js')
/* eslint-enable no-undef */

const appsToPackage = {
  bbVue: {
    importRoot: '/bb-vue/',
    scanRoot: 'src',
    scanIncludeExtensions: ['js', 'ns', 'txt'],
    scanExcludes: [/\/node_modules\//, /.git/, /publishing-key\.txt/, /ticker-ui\.js/],
    entryFile: '/bb-vue/examples/0-getting-started.js',
    manifestFile: 'installManifest.txt',
  },
  nuburn: {
    importRoot: '/nuburn/',
    scanRoot: 'src',
    scanIncludeExtensions: ['js', 'ns', 'txt'],
    scanExcludes: [/\/node_modules\//, /.git/, /publishing-key\.txt/],
    entryFile: '/nuburn/Main.js',
    manifestFile: 'installManifestNuburn.txt',
  },
}

for (let appConfig of Object.values(appsToPackage)) {
  let manifestData = {
    importRoot: appConfig.importRoot,
    entryFile: appConfig.entryFile,
    manifestPaths: [],
  }

  dree.scan(
    `./`,
    {
      extensions: appConfig.scanIncludeExtensions,
      exclude: appConfig.scanExcludes,
      normalize: true,
    },
    (fileNode) => {
      if (fileNode.relativePath.startsWith(joinPaths(appConfig.scanRoot, appConfig.importRoot))) {
        let installPath = fileNode.relativePath.replace(
          `${trimTrailingSlash(appConfig.scanRoot)}/`,
          ''
        )
        manifestData.manifestPaths.push({
          repoPath: `/${trimLeadingSlash(fileNode.relativePath)}`,
          installPath: `/${trimLeadingSlash(installPath)}`,
        })
      }
    }
  )

  rmSync(`./${appConfig.manifestFile}`, { force: true })
  writeFileSync(`./${appConfig.manifestFile}`, JSON.stringify(manifestData, null, '  '))

  console.log(util.inspect(manifestData, { depth: null }))
}
