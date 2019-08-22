'use strict';

const createResponse = (statusCode, message) => {
	return {
		statusCode: statusCode,
		body: JSON.stringify(message)
	};
};
const { fetchData, calculateRows, calculateAverage, sendEmail } = require('./main')

export const main = async (event, context) => {
	try {
		await sendEmail('Starting the average calculation Lambda', 'Important Message')
		const fetchedCSV = await fetchData();
		let fileKeys = fetchedCSV.map(file => {
			const { Key } = file;
			return Key
		})
		const lastElement = fileKeys[fileKeys.length - 1];
		fileKeys.length -= 1;

		const numberOfRows = await calculateRows(fileKeys);
		const numberOfRowsForLastElemnet = await calculateRows(lastElement);

		const average = await calculateAverage(numberOfRows, fileKeys.length);

		const emailMessage = `
			The average calculation is complete.
			The first four files contain ${numberOfRows} rows and their average is ${average}.
			The last file contains ${numberOfRowsForLastElemnet} rows.
		`
		await sendEmail(emailMessage, 'Important Message');
		return createResponse(200, {
			message: average
		});
	}
	catch (error) {
		console.error('error', error);
		return createResponse(500, {
			message: `Error ${error}`
		});
	}
};