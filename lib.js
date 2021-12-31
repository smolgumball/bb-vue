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

module.exports = { joinPath, trimPath, trimPathTrailing, trimPathLeading }
