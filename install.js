/*







    __    _ __  __
   / /_  (_) /_/ /_  __  ___________  ___  _____     _   ____  _____
  / __ \/ / __/ __ \/ / / / ___/ __ \/ _ \/ ___/____| | / / / / / _ \
 / /_/ / / /_/ /_/ / /_/ / /  / / / /  __/ /  /_____/ |/ / /_/ /  __/
/_.___/_/\__/_.___/\__,_/_/  /_/ /_/\___/_/         |___/\__,_/\___/




*/ /**
 * CONFIGURATION
 * --------------------------------------
 */

/**
 * `bitburner-vue` installs to a unique subdirectory by default. To place it somewhere other than
 * your root directory in BitBurner, set the prefixDirectory config as needed.
 *
 * For example, to install all scripts to a subdirectory called 'vueThing/',
 * modify the uncommented line below to read:
 *
 * let prefixDirectory = 'vueThing/'
 *
 */
let prefixDirectory = ''

/**
 * --------------------------------------
 * DO NOT EDIT BELOW THIS LINE













*/

let requiredHost = 'home'
let repoRoot = 'https://raw.githubusercontent.com/smolgumball/bitburner-vue/main'
let manifestFile = 'installManifest.txt'
let manifestTmpPath = '/tmp/installManifest__bitburner-vue.txt'

export async function main(ns) {
  if (ns.getHostname() !== requiredHost) {
    throw new Error('Run this script from home')
  }

  let manifestPath = joinPath(repoRoot, manifestFile)
  let manifestData = await fetchConfig(ns, manifestPath)
  let manifestLength = manifestData.manifestPaths.length

  for (let i in manifestData.manifestPaths) {
    let { repoPath, installPath } = manifestData.manifestPaths[i]
    repoPath = joinPaths(repoRoot, repoPath)
    try {
      installPath = joinPath(prefixDirectory, installPath)
      await getFileFromGH(ns, repoPath, installPath)
      ns.tprint(`Installed: ${installPath} [${Number(i) + 1}/${manifestLength}]`)
    } catch (e) {
      ns.tprint(`ERROR: Exception while downloading ${repoPath}: `, e.message)
      throw e
    }
  }

  let mainJsPath = joinPath(prefixDirectory, manifestData.entryFile)

  // prettier-ignore
  ns.tprint(`Install complete!

👇👇 Run the following in your home terminal to launch bitburner-vue!

run ${mainJsPath}

`)
}

async function fetchConfig(ns, manifestPath) {
  try {
    await getFileFromGH(ns, manifestPath, manifestTmpPath)
    return JSON.parse(ns.read(manifestTmpPath))
  } catch (e) {
    ns.tprint(`ERROR: Downloading and reading config file failed ${manifestPath}`)
    throw e
  }
}

async function getFileFromGH(ns, repoPath, installPath) {
  await githubReq(ns, repoPath, installPath)
}

async function githubReq(ns, repoPath, installPath) {
  if (isScriptFile(installPath)) {
    ns.print('Cleanup on: ' + installPath)
    await ns.scriptKill(installPath, requiredHost)
    await ns.rm(installPath, requiredHost)
  }

  ns.print('Request to: ' + repoPath)
  await ns.sleep(100)
  await ns.wget(repoPath, installPath, requiredHost)
}

// Path helpers
// ---

function joinPath(pathA, pathB) {
  return `${trimPathTrailing(pathA)}/${trimPathLeading(pathB)}`
}

function trimPath(path) {
  return `${trimPathTrailing(trimPathLeading(path))}`
}

function trimPathTrailing(path) {
  if (path && path.startsWith('/')) {
    return path.slice(1)
  }
  return path
}

function trimPathLeading(path) {
  if (path && path.endsWith('/')) {
    return path.slice(0, -1)
  }
  return path
}

// Reflection helpers
// ---

function isScriptFile(path) {
  return path.endsWith('ns') || path.endsWith('js')
}

// Installer script forked from:
// https://github.com/lethern/Bitburner_git_fetch
