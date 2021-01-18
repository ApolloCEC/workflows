
### SENTIM

#### Get the code

```
git clone https://github.com/ApolloCEC/workflows
cd workflows/SENTIM
```

#### Get an input dataset

name | fetch command 
----|----
[`input-200-tweets.json`](https://github.com/ApolloCEC/workflows/blob/master/SENTIM/datasets/input-200-tweets.json) | `wget https://github.com/ApolloCEC/workflows/blob/master/SENTIM/datasets/input-200-tweets.json -O input.json`
[`input-20000-tweets.json`](https://github.com/ApolloCEC/workflows/blob/master/SENTIM/datasets/input-20000-tweets.json) | `wget https://github.com/ApolloCEC/workflows/blob/master/SENTIM/datasets/input-20000-tweets.json -O input.json` 

The original authors of the datasets are [Z. Cheng, J. Caverlee, and K. Lee. You Are Where You Tweet: A Content-Based Approach to Geo-locating Twitter Users. In Proceeding of the 19th ACM Conference on Information and Knowledge Management (CIKM), Toronto, Oct 2010](https://archive.org/details/twitter_cikm_2010)

Then, update `input.json` with the desired parallelism. The default is 2 and 200, respectively for the datasets. This yields a 100 tweets per 1 inference function ratio for both datasets.


```
{
  "desired_num_batches": 2, // <--
  "all_tweets": [
    {
      "text": "@jennimichelle yes ma'am. St. Brides, Powell, Caldwell.",
      "tweet_id": 9219243277,
      "user_id": 18604078,
      "state_of_closest_capital": "WI",
      "date": "2010-02-16 22:25:03"
    },
    ......
  ]
```

#### Deploy the serverless functions

The serverless functions are in `py-functions-amazon` or `py-functions-google`. You can deploy a mix of them to Amazon and Google, but `sentim-inference` is only available for Amazon.

Furthermore, ensure that `sentim-inference` has Tensorflow Lite available (you can attach this Lambda Layer: `s3://jak-sentim-bucket/tflite-for-amazon-linux-env.zip`), and runs on Python 3.7.

#### Run the workflow


```

  TODO: Instructions / script on how to update ARNs in workflow.yaml after deployment


```

```
cd SENTIM
java -jar YOUR_PATH_TO_xAFCL.jar ./workflow.yaml ./input.json
```

#### Preliminary Metrics

##### Neural net inference

Measurements were not done in a controlled test environment.
Use for personal reference only.

![Chart showing metrics of input-200-tweets.json](https://github.com/ApolloCEC/workflows/blob/master/SENTIM/metrics/input-200-tweets-metrics.png)
![Chart showing metrics of input-20000-tweets.json](https://github.com/ApolloCEC/workflows/blob/master/SENTIM/metrics/input-20000-tweets-metrics.png)


##### Sample data flow 

```json
{
  "desired_num_batches": 2,
  "all_tweets": [
    {
      "text": "@jennimichelle yes ma'am. St. Brides, Powell, Caldwell.",
      "tweet_id": 9219243277,
      "user_id": 18604078,
      "state_of_closest_capital": "WI",
      "date": "2010-02-16 22:25:03"
    },
    {
      "text": "Yeah....so...I'm going to bed to rid myself of the twitsanity.",
      "tweet_id": 4649772806,
      "user_id": 1441801,
      "state_of_closest_capital": "AZ",
      "date": "2009-10-06 01:41:00"
    }
  ]
}
```

`sentim-batch`

```json
{
  "batches": [
    {
      "tweets": [
        {
          "text": "@jennimichelle yes ma'am. St. Brides, Powell, Caldwell.", ...
        }
      ]
    },
    {
      "tweets": [
        {
          "text": "Yeah....so...I'm going to bed to rid myself of the twitsanity.",
          "tweet_id": 4649772806.0,
          "user_id": 1441801.0,
          "state_of_closest_capital": "AZ",
          "date": "2009-10-06 01:41:00"
        }
      ]
    }
  ],
  "num_batches": 2,
  "num_tweets_total": 2
}
```

```Parallel Start```

```json
{
  "tweets": {
    "tweets": [
      {
        "text": "@jennimichelle yes ma'am. St. Brides, Powell, Caldwell.",
        "tweet_id": 9219243277.0,
        "user_id": 18604078.0,
        "state_of_closest_capital": "WI",
        "date": "2010-02-16 22:25:03"
      }
    ]
  }
}
```


`sentim-preprocess`

```json
{
  "tokenized_tweets": [
    {
      "tweet_id": 9219243277.0,
      "user_id": 18604078.0,
      "state_of_closest_capital": "WI",
      "date": "2010-02-16 22:25:03",
      "sentences": [
        [
          "jennimichelle",
          "yes",
          "maam"
        ],
        [
          "st"
        ],
        [
          "brides",
          "powell",
          "caldwell"
        ]
      ]
    }
  ]
}
```

`sentim-inference` or `sentim-inference-textblob`

```json
{
  "annotated_tweets": [
    {
      "tweet_id": 9219243277.0,
      "user_id": 18604078.0,
      "state_of_closest_capital": "WI",
      "date": "2010-02-16 22:25:03",
      "sentiment": [
        0.0,
        0.0
      ]
    }
  ]
}
```

`Parallel End`

`sentim-reduce`

```json
{
  "analysis_json": "{\"average_sentiment\": {\"AZ\": [0.0, 0.0], \"WI\": [0.0, 0.0]}}",
  "churn": 0.0
}
 ```

 
<!-- 
##### Textblob corpus inference

// 1
7m37,277s

// 2
7m47,582s
7m19,050s

// 128

4m48,631s
4m25,858s

// 256 
6m9,917s -->
