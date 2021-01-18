
### BWA

#### Get the code

```
git clone https://github.com/ApolloCEC/workflows
cd workflows/BWA
```

#### Get an input dataset

Name | Description |  Number of reads | Bucket | Keys
---|----|-----|----|----
Escherichia Coli | A gram-negative bacterium that can cause food poisoning. The Assembly used is ASM584v2, with a double mutation in gene `hipA`. | | `jak-bwa-bucket` | `input/NC_000913.3-hipA7.fasta`<br>`input/reads/hipa7_reads_R1.fastq`<br>`input/reads/hipa7_reads_R2.fastq` 
Trypanosoma brucei | A single-cell organism that causes sleeping sickness in humans. The Assembly used is ASM244v1. | | `jak-bwa-bucket` | `t-brucei/ASM244v1.fasta`<br>`t-brucei/reads/asm_reads_R1.fastq`<br>`t-brucei/reads/asm_reads_R2.fastq`
Rhizobium jaguaris | A nitrogen-fixing soil bacterium isolated in Mexico. The Assembly used is ASM362775v1.  | | `jak-bwa-bucket` | `rhi-jaguaris/rhizobium-jaguaris.fasta`<br>`rhi-jaguaris/rhi_jaguaris_reads_R1.fastq`<br>`rhi-jaguaris/rhi_jaguaris_reads_R2.fastq`
Bacteroides thetaiotaomicron | An anaerobic bacterium very common in the gut of humans and other mammals. The Assembly used is ASM1413175v1. | | `jak-bwa-bucket` | `bac-thet/bac_thetaiotamicron.fasta`<br>`bac-thet/bac_thetaiotamicron_reads_R1.fastq`<br>`bac-thet/bac_thetaiotamicron_reads_R2.fastq`


Put any three files in a S3 bucket of yours, ideally in the same region as the Lambdas will be in.
Update `input.json` with the bucket and the keys of your DNA samples, and the desired parallelism:

```
{
  "s3bucket": "YOUR_BUCKET",
  "files": {
    "reference": "YOUR_KEY_OF_REFERENCE_GENOME.fasta",
    "r1": "YOUR_KEY_OF_reads_R1.fastq",
    "r2": "YOUR_KEY_OF_reads_R2.fastq"
  },
  "numSplits": 3
}
```


#### Deploy the Lambdas

The Lambdas are in `functions`.
You can run [`npx deply`](https://www.npmjs.com/package/deply) if you don't want to deploy them by hand. Just update `deploy.json` beforehand. 
Alternatively, deploy them by hand to Amazon.

#### Run the workflow


```

  TODO: Instructions / script on how to update ARNs in workflow.yaml after deployment


```

```
$ cd BWA
$ java -jar YOUR_PATH_TO_xAFCL.jar ./workflow.yaml ./input.json
```
#### Preliminary Metrics

Measurements were not done in a controlled test environment.
Use for personal reference only.


![Chart showing metrics of Rhizobium jaguaris](https://github.com/ApolloCEC/workflows/blob/master/BWA/metrics/rhizobium-jaguaris-metrics.png)


#### Sample data flow


```json
{
  "s3bucket": "jak-bwa-bucket",
  "files": {
    "reference": "input/NC_000913.3-hipA7.fasta",
    "r1": "input/reads/hipa7_reads_R1.fastq",
    "r2": "input/reads/hipa7_reads_R2.fastq"
  },
  "numSplits": 3
}

```

`bwa-mask`


```json
{
  "s3bucket": "jak-bwa-bucket",
  "s3splitkeys":
    [
      "457166/NC_000913.3-hipA7.fasta-0.fasta",
      "19433/NC_000913.3-hipA7.fasta-1.fasta",
      "572884/NC_000913.3-hipA7.fasta-2.fasta"
    ],
  "files": "{\"reference\":\"input/NC_000913.3-hipA7.fasta\",\"r1\":\"input/reads/hipa7_reads_R1.fastq\",\"r2\":\"input/reads/hipa7_reads_R2.fastq\"}",
  "s3prefixes":
    [
      "457166/",
      "19433/",
      "572884/"
    ] 
}

```

`Start Parallel`

```json
{
  "s3bucket": "jak-bwa-bucket", 
  "files": "{\"reference\":\"input/NC_000913.3-hipA7.fasta\",\"r1\":\"input/reads/hipa7_reads_R1.fastq\",\"r2\":\"input/reads/hipa7_reads_R2.fastq\"}", 
  "s3prefix": "457166/", 
  "s3splitkey": "457166/NC_000913.3-hipA7.fasta-1.fasta"
} 
```

`bwa-index`

```json
 {
   "s3bucket":"jak-bwa-bucket",
   "files":"{\"reference\":\"457166/NC_000913.3-hipA7.fasta-0.fasta\",\"r1\":\"input/reads/hipa7_reads_R1.fastq\",\"r2\":\"input/reads/hipa7_reads_R2.fastq\",\"amb\":\"457166/NC_000913.3-hipA7.fasta-0.fasta.amb\",\"ann\":\"457166/NC_000913.3-hipA7.fasta-0.fasta.ann\",\"bwt\":\"457166/NC_000913.3-hipA7.fasta-0.fasta.bwt\",\"pac\":\"457166/NC_000913.3-hipA7.fasta-0.fasta.pac\",\"sa\":\"457166/NC_000913.3-hipA7.fasta-0.fasta.sa\"}",
   "s3prefix":"457166/"
}

```

`bwa-aln`

```json
{
  "s3bucket":"jak-bwa-bucket", 
  "files":"{reference\":\"457166/NC_000913.3-hipA7.fasta-0.fasta\",\"r1\":\"input/reads/hipa7_reads_R1.fastq\",\"r2\":\"input/reads/hipa7_reads_R2.fastq\",\"amb\":\"457166/NC_000913.3-hipA7.fasta-0.fasta.amb\",\"ann\":\"457166/NC_000913.3-hipA7.fasta-0.fasta.ann\",\"bwt\":\"457166/NC_000913.3-hipA7.fasta-0.fasta.bwt\",\"pac\":\"457166/NC_000913.3-hipA7.fasta-0.fasta.pac\",\"sa\":\"457166/NC_000913.3-hipA7.fasta-0.fasta.sa\"}", 
  "s3prefix":"457166/"
} 
```

`bwa-sampe`

```json
 {
   "s3bucket":"jak-bwa-bucket",
   "files":"{\"reference\":\"457166/NC_000913.3-hipA7.fasta-1.fasta\",\"r1\":\"input/reads/hipa7_reads_R1.fastq\",\"r2\":\"input/reads/hipa7_reads_R2.fastq\",\"amb\":\"457166/NC_000913.3-hipA7.fasta-1.fasta.amb\",\"ann\":\"457166/NC_000913.3-hipA7.fasta-1.fasta.ann\",\"bwt\":\"457166/NC_000913.3-hipA7.fasta-1.fasta.bwt\",\"pac\":\"457166/NC_000913.3-hipA7.fasta-1.fasta.pac\",\"sa\":\"457166/NC_000913.3-hipA7.fasta-1.fasta.sa\",\"sai1\":\"457166/aln_sa1.sai\",\"sai2\":\"457166/aln_sa2.sai\",\"sam\":\"457166/NC_000913.3-hipA7.fasta-1.fasta.sam\"}",
   "s3prefix":"457166/",
   "s3samkey":"457166/NC_000913.3-hipA7.fasta-1.fasta.sam"
} 
 ```

`Parallel End`

```json
{
  "s3bucket":"jak-bwa-bucket", 
  "s3prefix":"457166/", 
  "s3samkeys":
    [
      "572884/NC_000913.3-hipA7.fasta-2.fasta.sam",
      "457166/NC_000913.3-hipA7.fasta-0.fasta.sam",
      "19433/NC_000913.3-hipA7.fasta-1.fasta.sam"
    ]
} 
```

`bwa-merge`

```json
{
  "s3bucket":"jak-bwa-bucket",
  "mergedsamkey":"19433/merged.sam",
  "s3prefix":"19433/"
} 
```
<!-- 
# Rhi jaguaris 100.000 reads

// 1
1m13,471s
1m10,993s
1m10,702s

// 2
1m17,032s
1m12,681s
1m11,889s

// 3
0m55,433s

------


// 10
0m48,420s
0m44,378s
0m48,586s

// 1

1m17,562s
1m11,467s









-----

// 1

1m6,602s
1m10,716s
1m10,962s

// 2

1m5,813s
1m6,889s
1m7,366s 


// 4

0m44,928s
0m47,430s
0m47,809s

// 16 
0m55,818s
1m5,107s -->
