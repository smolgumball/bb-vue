const argsSchema = [['host', 'home']]

export function autocomplete(data) {
  data.flags(argsSchema)
  return []
}

export async function main(ns) {
  let options = ns.flags(argsSchema)
  ns.tprint(options)
  let startsWith = options['_'][0]
  let endsWith = options['_'][1]
  let files = ns.ls(options.host)
  let filesToRemove = []

  if (startsWith && !endsWith) {
    filesToRemove.push(...files.filter((f) => f.startsWith(startsWith)))
  }

  if (!startsWith && endsWith) {
    filesToRemove.push(...files.filter((f) => f.endsWith(startsWith)))
  }

  if (startsWith && endsWith) {
    filesToRemove.push(...files.filter((f) => f.startsWith(endsWith) && f.endsWith(endsWith)))
  }

  if (!startsWith && !endsWith) {
    filesToRemove = files
  }

  // Ensure only delete-able types are queued for deletion
  filesToRemove = filesToRemove.filter((f) => ['js', 'ns', 'txt'].some((ext) => f.endsWith(ext)))

  if (!filesToRemove.length) {
    ns.tprint(
      `No files found matching filters: --include-start=${startsWith}, ` +
        `--include-end=${endsWith}, --host=${options.host}`
    )
  }

  let confirmedDelete = await ns.prompt(`
rmDeep used these filters to queue these files for deletion:

Filters:
  > Starts with: ${startsWith || '[not set]'}
  > Ends with: ${endsWith || '[not set]'}
  > Host: ${options.host || '[not set]'}

Files:
${toJson(filesToRemove)}

Are you SURE you would like to DELETE these files?
This cannot be undone unless you have previously made backups.
`)

  if (confirmedDelete) {
    filesToRemove.forEach((toRm) => {
      ns.scriptKill(toRm, options.host)
      ns.rm(toRm)
    })
    ns.tprint(`Deleted ${filesToRemove.length} files from '${options.host}'`)
  } else {
    ns.tprint(`Aborted deletion of ${filesToRemove.length} files from '${options.host}'`)
  }
}

function toJson(value) {
  return JSON.stringify(value, null, ' ')
}
