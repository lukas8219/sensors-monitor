import dotenv from 'dotenv'
import _ from 'lodash'
import { writePoint } from './src/influx.js'
import { LOGGER } from './src/logger.js'
import { BFS, retrieveSensorData, toCoreTemp } from './src/util.js';
import { retry } from './src/worker.js';

const FAILED_ENTRIES = [];

const INPUT_FIELDS = [
    'Package id 0',
    'Core 0',
    'Core 1',
    'Core 2',
    'Core 3',
];

function getTemperature() {
    return dotenv.config('.env').parsed?.MAX_TEMP;
}

setInterval(() => {
    const MAX_TEMP = getTemperature();
    const CORE_TO_TEMP = toCoreTemp({ INPUT_FIELDS, MAX_TEMP });
    const DATA = BFS(retrieveSensorData(), CORE_TO_TEMP);
    INSERT(DATA);
}, 1000);

function INSERT(objt) {
    LOGGER.debug(`Starting to insert data into Influx for ${JSON.stringify(objt)}`);
    for (const measurementName of Object.keys(objt)) {
        const OBJ = objt[measurementName];
        LOGGER.debug(`Inserting entries for ${JSON.stringify(OBJ)}`);
        for (const [fieldName, fieldValue] of Object.entries(OBJ)) {
            const insertIntoInflux = async () => {
                LOGGER.debug(`Insering into ${measurementName} - ${fieldName} - ${fieldValue}`);
                if (fieldName && fieldValue) {
                    const MEASUREMENT_DATA = { measurementName, fieldName, fieldValue };
                    try {
                        const REQUEST = await writePoint(MEASUREMENT_DATA);
                        await REQUEST.close();
                        LOGGER.info(`${measurementName} -- ${fieldName} -- ${fieldValue}`);

                        if (FAILED_ENTRIES.length) {
                            retry(FAILED_ENTRIES.splice(0));
                        }

                    } catch (err) {
                        FAILED_ENTRIES.push(MEASUREMENT_DATA);
                        LOGGER.error(`An error occurred when trying to write to Influx. Retry on first success ${JSON.stringify(err)}`);
                    }
                }
            }
            insertIntoInflux();
        }
    }
}