process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT']
const { fetchhdd, stashhdd, cleanTmp } = require('./utils.js')
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

/*

{
  "s3bucket": "jak-bwa-bucket",
  "files": {
    "reference": "224093/NC_000913.3-hipA7.fasta-2.fasta",
    "r1": "input/reads/hipa7_reads_R1.fastq",
    "r2": "input/reads/hipa7_reads_R2.fastq",
    "amb": "224093/NC_000913.3-hipA7.fasta-2.fasta.amb",
    "ann": "224093/NC_000913.3-hipA7.fasta-2.fasta.ann",
    "bwt": "224093/NC_000913.3-hipA7.fasta-2.fasta.bwt",
    "pac": "224093/NC_000913.3-hipA7.fasta-2.fasta.pac",
    "sa": "224093/NC_000913.3-hipA7.fasta-2.fasta.sa"
  },
  "s3prefix": "224093/"
}

*/

exports.handler = async ({ s3bucket, files, s3prefix, r1s3key, r2s3key, s3mainprefix }, context) => {

  // NOTE ensure /tmp drive is clean
  // /tmp may have remnants of previous invocation if Amazon reuses a container
  // ...Amazon being sloppy
  await cleanTmp()

  files = JSON.parse(files)

  // fetch reference genome and bwt, amb, ann ...
  const localfiles = await fetchhdd(s3bucket, files, s3mainprefix)

  // fetch r1 and r2 split
  const r1r2localfiles = await fetchhdd(s3bucket, { r1: r1s3key, r2: r2s3key }, s3prefix)

  const sai1 = '/tmp/aln_sa1.sai'
  const sai2 = '/tmp/aln_sa2.sai'

  execSync(`bwa aln ${localfiles['reference']} ${r1r2localfiles['r1']} > ${sai1}`)
  execSync(`bwa aln ${localfiles['reference']} ${r1r2localfiles['r2']} > ${sai2}`)

  const newfiles = {
    sai1: sai1,
    sai2: sai2
  }

  let retnamedfiles = await stashhdd(newfiles, s3bucket, s3prefix)



  context.succeed({
    s3bucket: s3bucket,
    files: JSON.stringify(files),
    sai1s3key: retnamedfiles['sai1'],
    r1s3key: r1s3key,
    r2s3key: r2s3key,
    sai2s3key: retnamedfiles['sai2'],
    s3prefix: s3prefix
  })
}