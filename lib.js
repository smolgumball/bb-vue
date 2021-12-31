function joinPaths(pathA, pathB) {
  return `${trimTrailingSlash(pathA)}/${trimLeadingSlash(pathB)}`
}

function trimPath(path) {
  return `${trimTrailingSlash(trimLeadingSlash(path))}`
}

function trimLeadingSlash(path) {
  if (path && path.startsWith('/')) {
    return path.slice(1)
  }
  return path
}

function trimTrailingSlash(path) {
  if (path && path.endsWith('/')) {
    return path.slice(0, -1)
  }
  return path
}

module.exports = { joinPaths, trimPath, trimLeadingSlash, trimTrailingSlash }
