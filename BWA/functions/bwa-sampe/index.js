process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT']
const { fetchhdd, stashhdd, filterUnmapped, cleanTmp } = require('./utils.js')
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

exports.handler = async ({ s3bucket, files, s3prefix, r1s3key, r2s3key, sai1s3key, sai2s3key }, context) => {

  // NOTE ensure /tmp drive is clean
  // /tmp may have remnants of previous invocation if Amazon reuses a container
  // ...Amazon being sloppy
  await cleanTmp()

  files = JSON.parse(files)

  // fetch general files: reference genome, bwt, amb, ann ...
  const localfiles = await fetchhdd(s3bucket, files, s3prefix)

  // fetch split files 
  const splitlocalfiles  = await fetchhdd(s3bucket, { r1: r1s3key, r2: r2s3key, sai1: sai1s3key, sai2: sai2s3key })

  let retnamedfiles = {
    sam: `${localfiles['reference']}.sam`
  }

  execSync(`bwa sampe ${localfiles['reference']} ${splitlocalfiles['sai1']} ${splitlocalfiles['sai2']} ${splitlocalfiles['r1']}  ${splitlocalfiles['r2']} > ${retnamedfiles['sam']}`)
  await filterUnmapped(retnamedfiles['sam'], retnamedfiles['sam'])

  // stash sam file
  retnamedfiles = await stashhdd(retnamedfiles, s3bucket, s3prefix)

  retnamedfiles = {
    ...files,
    ...retnamedfiles
  }

  context.succeed({
    s3bucket: s3bucket,
    files: JSON.stringify(retnamedfiles),
    s3prefix: s3prefix,
    s3samkey: retnamedfiles['sam']
  })
}