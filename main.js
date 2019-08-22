const csv = require('fast-csv');
const AWS = require('aws-sdk');
const S3 = new AWS.S3();
const SES = new AWS.SES();

const util = require('util')
const promisify = util.promisify;

const INPUT_BUCKET_NAME = 'envi-input-data';
const inputBucketparams = {
	Bucket: INPUT_BUCKET_NAME
};
const TO_EMAIL_ADDRESS = 'kshitijpandey32@gmail.com';
const SOURCE_EMAIL_ADDRESS = 'mutoashirogi0@gmail.com';

const ListObjectPromise = promisify(S3.listObjects).bind(S3)
const SendEmailPromise = promisify(SES.sendEmail).bind(SES)
export const fetchData = () => {
	return new Promise((resolve, reject) => {
		ListObjectPromise(inputBucketparams)
			.then(async(data) => {
				const { Contents } = data;
				resolve(Contents)
			})
			.catch(error => {
				reject(error.message)
			})
	})
}




export const calculateRows = (keys) => {
	const promiseArrays = createS3ReadPromise(keys, inputBucketparams)
	return new Promise((resolve, reject) => {
		Promise.all(promiseArrays)
		.then(rowData => {
			let numberOfRows = 0;
			rowData.map(value => numberOfRows = numberOfRows + value);
			resolve(numberOfRows);
		})
		.catch(error => {
			reject(error.message);
		})
	})
}

export const calculateAverage = (allRows, numberOfFiles) => {
	const average = allRows / numberOfFiles;
	return average
}

export const sendEmail = (message, subject) => {
	const emailParams = {
		Destination: {
			ToAddresses: [
				TO_EMAIL_ADDRESS
			]
		},
		Message: {
			Body: {
				Html: {
					Charset: "UTF-8",
					Data: message
				},
				Text: {
					Charset: "UTF-8",
					Data: message
				}
			},
			Subject: {
				Charset: "UTF-8",
				Data: subject
			}
		},
		Source: SOURCE_EMAIL_ADDRESS
	}

	return new Promise((resolve, reject) => {
		SendEmailPromise(emailParams)
			.then(data => {
				const { MessageId } = data;
				resolve(MessageId)
			})
			.catch(error => {
				reject(error.message)
			})
	})
}

const createS3ReadPromise = (items, bucketPath) => {
	if(!(items instanceof Array)){
		items = [items];
	}

	const arrayOfPromises = items.map(item => {
		const filePath = {
			...bucketPath,
			Key: item
		}
		return new Promise((resolve, reject) => {
			const readStream = S3.getObject(filePath).createReadStream();
			csv.parseStream(readStream, { headers:true })
			.on('error', error => {
				reject(error.message)
			})
			.on('data', row => {
			})
			.on('end', rowCount => {
				resolve(rowCount);
			});
		})
	})
	return arrayOfPromises
}