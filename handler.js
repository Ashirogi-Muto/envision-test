'use strict';

const createResponse = (statusCode, message) => {
	return {
		statusCode: statusCode,
		body: JSON.stringify(message)
	};
};
const { fetchData, calculateRows, calculateAverage, sendEmail } = require('./main')
exports.main = async function(event, context) {
	try {
		await sendEmail('Starting the average calculation Lambda', 'Important Message')
		const fetchedCSV = await fetchData();
		let timestampSortedData = fetchedCSV.sort((first, second) => (first.LastModified > second.LastModified) ? 1 : -1).map(item => {
			const { Key } = item;
			return Key
		})
		const lastElement = timestampSortedData[timestampSortedData.length - 1];
		timestampSortedData.length -= 1;

		const numberOfRows = await calculateRows(timestampSortedData);
		const numberOfRowsForLastElemnet = await calculateRows(lastElement);

		const average = await calculateAverage(numberOfRows, timestampSortedData.length);

		const emailMessage = `
			The average calculation is complete.
			The first ${timestampSortedData.length} files contain ${numberOfRows} rows and their average is ${average}.
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
}
// export const main = async (event, context) => {
// };