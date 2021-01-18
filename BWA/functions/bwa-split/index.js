process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT']
const { fetchhdd, stashhdd, splitreads, putS3, cleanTmp } = require('./utils.js')
const { execSync } = require('child_process')
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fsp = require('fs').promises
const path = require('path')

exports.handler = async ({ s3bucket, files, numSplits }, context) => {

  // NOTE ensure /tmp drive is clean
  // /tmp may have remnants of previous invocation if Amazon reuses a container
  // ...Amazon being sloppy
  await cleanTmp()

  // fetch seqkit binary (at the root of the bucket)
  await fetchhdd(s3bucket, { seqkit: 'seqkit' })
  // fetch required files                // notion of prefix does not exist before splitting
  const localfiles = await fetchhdd(s3bucket, files)

  // split r1 and r2
  let splitpaths = await splitreads(localfiles['r1'], localfiles['r2'], numSplits)

  // group splitpaths

  /* Sort to
    /tmp/out/hipa7_reads_R1.part_001.fastq,
    /tmp/out/hipa7_reads_R2.part_001.fastq,
    /tmp/out/hipa7_reads_R1.part_002.fastq,
    /tmp/out/hipa7_reads_R2.part_002.fastq
    or similar (a bit cumbersome)
    */
  splitpaths = splitpaths.sort((a, b) => {
    let apartnum = parseInt(a.match(/[0-9]{3}/)[0])
    let bpartnum = parseInt(b.match(/[0-9]{3}/)[0])
    let arnum = a.toLowerCase().includes('r1') ? 1 : 2
    let brnum = b.toLowerCase().includes('r1') ? 1 : 2

    if (apartnum !== bpartnum) {
      return (apartnum > bpartnum) ? 1 : -1
    } else {
      // on identical parts, compare whether r1, r2
      return (arnum > brnum) ? 1 : -1
    }
  })

  let r1s3keys = []
  let r2s3keys = []

  let prefixes = []
  // For each r1, r2 split
  for (let i = 0; i < splitpaths.length - 1; i += 2) {
    
    // s3 workspace for this split (non-deterministic between runs)
    const prefix = `${Math.ceil(Math.random() * Date.now())}/`

    const r1localpath = splitpaths[i]
    const r2localpath = splitpaths[i+1]

    const { r1s3key } = await stashhdd({ r1s3key: r1localpath }, s3bucket, prefix)
    const { r2s3key } = await stashhdd({ r2s3key: r2localpath }, s3bucket, prefix)

    // let splitlocalfiles = {
    //   r1: splitpaths[i],
    //   r2: splitpaths[i + 1],
    //   reference: localfiles['reference']
    // }

    prefixes.push(prefix)
    r1s3keys.push(r1s3key)
    r2s3keys.push(r2s3key)



  }

 
  context.succeed({
    s3bucket: s3bucket,
    s3prefixes: prefixes,
    s3mainprefix: `${Math.ceil(Math.random() * Date.now())}/`, // where files will be stashed that all parallel workers need
    r1s3keys: r1s3keys, 
    r2s3keys: r2s3keys,
    files: JSON.stringify({
      'reference': files['reference']
    })
  })

}
