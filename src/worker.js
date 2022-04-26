import { writePoint } from './influx.js'

process.on('message', async (entries) => {
    LOGGER.info(`A request has been sent successfully. Retrying those with errors`);
    try {
        const RETRY_ENTRY = FAILED_ENTRIES.shift();
        await writePoint({ ...RETRY_ENTRY }).close();
        LOGGER.info(`RETRY SUCCEDED -> ${RETRY_ENTRY.measurementName} -- ${RETRY_ENTRY.fieldName} -- ${RETRY_ENTRY.fieldValue}`);
    } catch (err) {
        LOGGER.error(`An error occurred twice when trying to integrate with InfluxDB for ${JSON.stringify(err)}`);
    }
})