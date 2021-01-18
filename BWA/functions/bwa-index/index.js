process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT']
const { fetchhdd, stashhdd, cleanTmp } = require('./utils.js')
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

/*
  {
  "s3bucket": "jak-bwa-bucket",
  "s3splitkeys": [
    "344918/NC_000913.3-hipA7.fasta-0.fasta",
    "541209/NC_000913.3-hipA7.fasta-1.fasta",
    "114713/NC_000913.3-hipA7.fasta-2.fasta",
    "25995/NC_000913.3-hipA7.fasta-3.fasta"
  ],
  "files": {
    "reference": "input/NC_000913.3-hipA7.fasta",
    "r1": "input/reads/hipa7_reads_R1.fastq",
    "r2": "input/reads/hipa7_reads_R2.fastq"
  },
  "s3prefixes": [
    "344918/",
    "541209/",
    "114713/",
    "25995/"
  ]
}

*/
exports.handler = async ({ s3bucket, files, s3mainprefix }, context) => {

  // NOTE ensure /tmp drive is clean
  // /tmp may have remnants of previous invocation if Amazon reuses a container
  // ...Amazon being sloppy
  await cleanTmp()


  files = JSON.parse(files)


  // fetch reference genome
  const localfiles = await fetchhdd(s3bucket, files)

  // COMMAND
  execSync(`bwa index ${localfiles['reference']}`)

  // compute created file paths 
  let retnamedfiles = ['amb', 'ann', 'bwt', 'pac', 'sa']
    .map(suffix => ({ [suffix]: `${localfiles['reference']}.${suffix}` }))
    .reduce((acc, curr) => ({
      ...acc,
      ...curr
    }), {})


  retnamedfiles = await stashhdd(retnamedfiles, s3bucket, s3mainprefix)

  retnamedfiles = {
    ...files,
    ...retnamedfiles
  }

  context.succeed({
    s3bucket: s3bucket,
    files: JSON.stringify(retnamedfiles),
    s3mainprefix: s3mainprefix
  })
}