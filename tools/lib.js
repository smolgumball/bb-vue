export function joinPaths(pathA, pathB) {
  return `${trimTrailingSlash(pathA)}/${trimLeadingSlash(pathB)}`
}

export function trimPath(path) {
  return `${trimTrailingSlash(trimLeadingSlash(path))}`
}

export function trimLeadingSlash(path) {
  if (path && path.startsWith('/')) {
    return path.slice(1)
  }
  return path
}

export function trimTrailingSlash(path) {
  if (path && path.endsWith('/')) {
    return path.slice(0, -1)
  }
  return path
}
