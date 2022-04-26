import dotenv from 'dotenv'
import _ from 'lodash'
import { writePoint } from './src/influx.js'
import { LOGGER } from './src/logger.js'
import { BFS, retrieveSensorData, toCoreTemp } from './src/util.js';

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
    Object.keys(objt).forEach((k) => {
        const OBJ = objt[k];
        LOGGER.debug(`Inserting entries for ${JSON.stringify(OBJ)}`);
        Object.entries(OBJ).forEach(async (v) => {
            LOGGER.debug(`Insering into ${k} - ${v[0]} - ${v[1]}`);
            if (v[0] && v[1]) {
                try {
                    await writePoint({
                        measurementName: k,
                        fieldName: v[0],
                        fieldValue: v[1],
                    }).close();
                    LOGGER.info(`${k} -- ${v[0]} -- ${v[1]}`);
                } catch (err) {
                    FAILED_ENTRIES.push({
                        measurementName: k,
                        fieldName: v[0],
                        filedValue: v[1]
                    });
                    LOGGER.error(`An error occurred when trying to write to Influx. Retry on first success`);
                }

            }
        })
    })
}