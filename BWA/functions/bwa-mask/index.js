process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT']
const { fetchhdd, stashhdd, split, putS3, cleanTmp } = require('./utils.js')
const { execSync } = require('child_process')
const fsp = require('fs').promises
const path = require('path')

exports.handler = async ({ s3bucket, files, numSplits }, context) => {

  // NOTE ensure /tmp drive is clean
  // /tmp may have remnants of previous invocation if Amazon reuses a container
  // ...Amazon being sloppy
  await cleanTmp()


  // fetch required files                // notion of prefix does not exist before splitting
  const localfiles = await fetchhdd(s3bucket, files)

  // split reference genome
  const splitpaths = await split(localfiles['reference'], numSplits)

  let retnamedfiles = {}

  // 
  const prefixes = [...Array(splitpaths.length)].map(() => `${Math.ceil(Math.random() * Date.now())}/`)

  // stash each with individual s3 prefix
  for (let i = 0; i < splitpaths.length; i += 1) {
    const prefix = prefixes[i]
    const retnamedfile = await stashhdd({ [`reference${i}`]: splitpaths[i] }, s3bucket, prefix)
    retnamedfiles = {
      ...retnamedfiles,
      ...retnamedfile
    }
  }

  const s3splitkeys = Object.values(retnamedfiles)

  context.succeed({
    s3bucket: s3bucket,
    s3splitkeys: s3splitkeys,
    files: JSON.stringify(files),
    s3prefixes: prefixes,
  })

}
