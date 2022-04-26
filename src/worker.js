import { writePoint } from './influx.js'
import Emitter from 'events'
import { LOGGER } from './logger.js';

const emitter = new Emitter();

emitter.on('message', async (FAILED_ENTRIES) => {
    LOGGER.info(`A request has been sent successfully. Retrying those with errors. Total ${FAILED_ENTRIES.length}`);
    while (FAILED_ENTRIES.length) {
        try {
            const RETRY_ENTRY = FAILED_ENTRIES.shift();
            const REQUEST = await writePoint({ ...RETRY_ENTRY });
            await REQUEST.close();
            LOGGER.info(`RETRY SUCCEDED -> ${RETRY_ENTRY.measurementName} -- ${RETRY_ENTRY.fieldName} -- ${RETRY_ENTRY.fieldValue}`);
        } catch (err) {
            LOGGER.error(`RETRY FAILED -> An error occurred twice when trying to integrate with InfluxDB for ${JSON.stringify(err)}`);
        }
    }
})


function retry(entries) {
    emitter.emit('message', entries);
}

export {
    retry
}