## Lambda Functions

name | region | runtime | logging
---- | ------ | ------- | -------
advendcalender-rss-to-slack | ap-northeast-1 | nodejs 6.10 | yes

## Build a new version of lambda functions

## CircleCI Artifact

You can get a new copy of artifact from latest build of CircleCI.
Note that you should download it before cache expiring date.

## Using Local machine

Run `dist` script allows you get a new version of zipped lambda functions created under `dist` directory.

```sh
$ npm run dist

> aws-lambda-ac-2018@1.0.0 dist /aws-lambda-ac-2018
> gulp dist

[18:17:09] Using gulpfile /aws-lambda-ac-2018/gulpfile.js
[18:17:09] Starting 'dist'...
...
[18:17:21] Finished 'dist' after 11 s
Build Tag: 12345678-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Even if every build have a unique tag their own,
you may want to clobber all the previous versions before get a new one.
Because `clobber` doesn't have caching, backup is recommended before on you go.

```sh
$ npm run clobber # destroy everything's under dist directory
```

## Upload a new version and publish immediately as atomic version

To upload a new version execute bottom or use AWS console.

```sh
$ aws --region <region> lambda update-function-code --function-name <name> --zip-file fileb://./dist/advendcalender-rss-to-slack-xxxxxxxx.zip --publish
```

## Encryption

Every lambda functions here should encrypt any of thier configuration and initial data with AWS KMS.
Encrypt data then include encrypted-string or file into your lambda function and so on.

```sh
$ aws --region <region> kms encrypt --key-id <key-id> --plaintext file://path/to/your/plain/text/file
```

## Testing

### Executing lambda on your local machine

Via npm

```sh
$ npm run local:<lambda_name>
```

Via aws-cli

```sh
$ aws --region <region> lambda invoke --function-name <name> --payload "{}" output.txt
```

### Executing lambda via AWS console

See more: http://docs.aws.amazon.com/lambda/latest/dg/get-started-invoke-manually.html
