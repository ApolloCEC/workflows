process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT']
const { fetchram, fetchhdd, stashram, stashhdd, filterUnmapped, cleanTmp } = require('./utils.js')
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

/*  {
  s3bucket=jak-bwa-bucket, 
  s3prefix=441655/, 
  s3samkeys=["118230/NC_000913.3-hipA7.fasta.sam","947036/NC_000913.3-hipA7.fasta.sam","441655/NC_000913.3-hipA7.fasta.sam"]}
*/

exports.handler = async ({ s3bucket, s3samkeys, s3prefix }, context) => {

  // NOTE ensure /tmp drive is clean
  // /tmp may have remnants of previous invocation if Amazon reuses a container
  // ...Amazon being sloppy
  await cleanTmp()


    // TODO do also this in RAM
  let retnamedfiles = { 'mergedsam': '/tmp/merged.sam' }
  for (let i = 0; i < s3samkeys.length; i += 1) {
    const { sambuf } = await fetchram(s3bucket, { sambuf: s3samkeys[i] })
    // if i is 0, get header
    const samcontents = sambuf.toString('utf-8')

    if (i === 0) {
      // read first sam file and get its header
      const samheader = samcontents 
        .split('\n')
        .filter(l => /^@/.test(l) === true)
        .join('\n')
      // write header
      fs.appendFileSync('/tmp/merged.sam', samheader, { encoding: 'utf-8' })
      fs.appendFileSync('/tmp/merged.sam', '\n', { encoding: 'utf-8' })
    }

    // one by one
    // fetch sam, append, delete
    //const contents = sambuf.toString('utf-8')
    const contents = samcontents   
      .split('\n')
      .filter(l => /^@/.test(l) === false)
      .join('\n')
    fs.appendFileSync('/tmp/merged.sam', contents, { encoding: 'utf-8' })

 //   fs.unlinkSync(samlocalpath)
  }

  // // fetch required files
  // const localfiles = await fetch(s3bucket, s3keys, s3prefix)


  // // read first sam file and get its header
  // const samheader = fs.readFileSync(Object.values(localfiles)[0], { encoding: 'utf-8' })
  //   .split('\n')
  //   .filter(l => /^@/.test(l) === true)
  //   .join('\n')



  // // write header
  // fs.appendFileSync('/tmp/merged.sam', samheader, { encoding: 'utf-8' })
  // fs.appendFileSync('/tmp/merged.sam', '\n', { encoding: 'utf-8' })

  // // merge them
  // // append other sam files' contents
  // const localsampaths = Object.values(localfiles)

  // for (let i = 0; i < localsampaths.length; i += 1) {
  //   const localsampath = localsampaths[i]
  //   const contents = fs.readFileSync(localsampath, { encoding: 'utf-8' })
  //     .split('\n')
  //     .filter(l => /^@/.test(l) === false)
  //     .join('\n')
  //   fs.appendFileSync('/tmp/merged.sam', contents, { encoding: 'utf-8' })
  //   // newline only between concats, not at the end
  //   if (i < localsampaths.length - 1) {
  //     fs.appendFileSync('/tmp/merged.sam', '\n', { encoding: 'utf-8' })
  //   }
  // }

  // stash merged sam file


  retnamedfiles = await stashhdd(retnamedfiles, s3bucket, s3prefix)

  context.succeed({
    s3bucket: s3bucket,
    mergedsamkey: retnamedfiles['mergedsam'],
    s3prefix: s3prefix
  })

}