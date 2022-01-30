import util from 'util'
import dree from 'dree'
import { writeFileSync, rmSync } from 'fs'
import { joinPaths, trimLeadingSlash, trimTrailingSlash } from './lib.js'

const appsToPackage = {
  bbVue: {
    importRoot: '/bb-vue/',
    scanRoot: 'src',
    scanIncludeExtensions: ['js', 'ns', 'txt'],
    scanExcludes: [/.*node_modules\/.*/, /.*\.git\/.*/, /.*publishing-key\.txt.*/],
    entryFile: '/bb-vue/examples/0-getting-started.js',
    manifestFile: 'installManifest.txt',
  },
  nuburn: {
    importRoot: '/nuburn/',
    scanRoot: 'src',
    scanIncludeExtensions: ['js', 'ns', 'txt'],
    scanExcludes: [/.*node_modules\/.*/, /.*\.git\/.*/, /.*publishing-key\.txt.*/],
    entryFile: '/nuburn/start.js',
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
