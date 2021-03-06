"use strict";

const nconf = require('nconf'),
      AWS = require('aws-sdk');

AWS.config.update({region: nconf.get('AWS_REGION')});

// S3 functions

const s3 = new AWS.S3();

exports.getPresignedUrlForS3 = (bucket, key, res) => {

    let params = { Bucket: bucket, Key: key, Expires: 600 };
    
    s3.getSignedUrl('putObject', params, (err, url) => {
        
        if (err) {
          console.error(err);
          return res.json({'error' : `[AWS S3 ERROR] ${err}`});
        }
        
        let msg = `RETRIEVED S3 PRESIGNED URL = ${url}`;
        console.log(msg);
        res.json({'message' : msg});
    });
}


// CloudWatch metrics functions

const cloudWatch = new AWS.CloudWatch();

exports.publishMetric = (metricName, latency) => {

    // NOTE:  this does not perform batching, which would be necessary in
    // a production environment with a substantial amount of traffic
    cloudWatch.putMetricData(metricDataHelper(metricName, latency))
              .on('error', (err, res) => console.log(`Error publishing metrics: ${err}`))
              .send();    
}

function metricDataHelper(metricName, latency) {

  let params = {
    MetricData: [ 
     {
      MetricName: `${metricName}_COUNT`, 
      Timestamp: new Date,
      Unit: 'Count',
      Value: 1.0
     },
     {
      MetricName: `${metricName}_LATENCY`, 
      Timestamp: new Date,
      Unit: 'Milliseconds',
      Value: ((latency[0] * 1000.0) + latency[1]/1000000)
     },
    ],
    Namespace: 'STARTUP_KIT/API'  
  }

  return params;
}


