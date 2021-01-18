const aws = require('aws-sdk');
const fsp = require('fs').promises
const path = require('path')
const os = require('os')

const s3 = new aws.S3();

function getS3(bucket, key) {
  const params = {
    Bucket: bucket,
    Key: key,
  };
  return s3.getObject(params)
    .promise()
    .then((s3obj) => s3obj.Body && Buffer.from(s3obj.Body))
    .catch(e => {
      console.log(`Key ${key} does not exist in ${bucket}`)
      throw e
    })
}

function putS3(bucket, key, data) {
  const params = {
    Bucket: bucket,
    Key: key,
    Body: data,
  };
  return s3.putObject(params)
    .promise();
}

const extractBucket = (filearn) => filearn.match(/(?!^(\d{1,3}\.){3}\d{1,3}$)(^[a-z0-9]([a-z0-9-]*(\.[a-z0-9])?)*$)/)

/**
 * 
 * @param {*} bucket 
 * @param {*} files An object of human-readable handles to s3 keys
 * @returns {*} An object of human-readable handles to local paths 
 */
async function fetch(bucket, files) {
  const localdir = '/tmp'
  const fnames = Object.keys(files)
  const fkeys = fnames.map(fn => files[fn])

  let ret = {}

  for(let i = 0; i < fnames.length; i++) {
    const fname = fnames[i]
    const s3key = fkeys[i]
    const filename = s3key.split('/').slice(-1)[0]
    const outpath = path.join('/tmp', filename)
    const content = await getS3(bucket, s3key)
    await  fsp.writeFile(
      outpath,
      content
    )
    console.log(`Fetched ${s3key} to ${outpath}`)
    ret[fname] = outpath
  }

  return ret
}


async function stash(files, bucket, prefix = '') {
  const fnames = Object.keys(files)
  const fpaths = fnames.map(fn => files[fn])

  let ret = {}

  for(let i = 0; i < fnames.length; i++) {
    const fname = fnames[i]
    const localpath = fpaths[i]
    const outs3key = prefix + localpath.split('/').slice(-1)[0] 
    const content = await fsp.readFile(localpath)
    await putS3(bucket, outs3key, content)
    console.log(`Stashed ${localpath} to ${outs3key}`)
    ret[fname] = outs3key
  }

  return ret
}

async function filterUnmapped(infilepath, outfilepath) {
  const samcontent = await fsp.readFile(infilepath, { encoding: 'utf-8' })

  const filteredsamcontent = samcontent
    .split('\n')
    .filter((l, idx) => {
      let els = l.split('\t') // sam columns are tab-delimited
      // Discard lines that have a zero in the fourth column
      // (means that the read could not be mapped, and thus is not interesting to us)
      if (
        els.length >= 4
        && els[3] != null
        && isNaN(parseInt(els[3])) === false
        && parseInt(els[3]) === 0
      ) {
        return false
      }
      return true
    })
    .join('\n')

  console.log(infilepath + " = filtered unmapped reads => " + outfilepath)
  console.log(samcontent.split('\n').length + " lines => " + filteredsamcontent.split('\n').length + " lines")

  await fsp.writeFile(outfilepath, filteredsamcontent, { encoding: 'utf-8' })
}


/**
 * @returns {string[]} paths of generated splits
 * @param {*} infastapath 
 * @param {*} n 
 */
async function split(infastapath, n) {
  let fasta = await fsp.readFile(infastapath, { encoding: 'utf-8' })

  function mask(lines) {
    return lines.map(l => {
      if (/>/.test(l) === true) {
        return l
      }
      else {
        return l.replace(/./g, 'N')
      }
    })
  }

  let ls = fasta
    .split('\n')

  let outpaths = []

  for (let i = 0; i < n; i += 1) {
    // our window that isn't masked with N
    const startl = Math.floor((ls.length * i) / n)
    const endl = Math.floor((ls.length * (i + 1)) / n)

    const maskedExcept = [
      ...mask(ls.slice(0, startl)),
      ...ls.slice(startl, endl),
      ...mask(ls.slice(endl))
    ].join('\n')

    const outpath = path.join(path.dirname(infastapath), `${path.basename(infastapath)}-${i}.fasta`) // place splits alongside with input fasta

    await fsp.writeFile( // place splits alongside with input fasta
      outpath,
      maskedExcept,
      { encoding: 'utf-8' }
    )

    outpaths.push(outpath)
  }

  return outpaths

}

module.exports = {
  getS3,
  putS3,
  fetch,
  stash,
  filterUnmapped,
  split
};

