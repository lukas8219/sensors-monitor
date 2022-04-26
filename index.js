import { spawnSync } from 'child_process';
import dotenv from 'dotenv'
import _ from 'lodash'
import pino from 'pino';
import PinoPretty from 'pino-pretty';
import { InfluxDB, Point } from '@influxdata/influxdb-client';

const LOGGER = pino(PinoPretty({
    colorize: true,
    customPrettifiers: {
        time: (timestamp) => `[${new Date(timestamp).toISOString()}]`,
    }
}))

// You can generate a Token from the "Tokens Tab" in the UI
const token = 'mytoken' || 'd8oXyuJrgpqpvlYZ2uiU2OsBgzBBjK8yDpWVPqhiWpA_MfvwlW04Onm6YIow3Te332_DPeQJKrE82LYxkNlbUA=='
const org = 'my-org'
const bucket = 'my-bucket'
const client = new InfluxDB({ url: 'http://influx:8086', token: token })

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
    const CORE_TO_TEMP = INPUT_FIELDS.reduce((p, c) => {
        return {
            ...p,
            [c]: Number(MAX_TEMP),
        }
    }, [])

    const sensorProcess = spawnSync('sensors', ['-j']);
    const formattedString = sensorProcess.output.slice(1, sensorProcess.output.length - 1).toString();

    const OBJ = JSON.parse(formattedString);

    INSERT(BFS(OBJ, CORE_TO_TEMP));

}, 1000);


function BFS(root = {}, CORE_TO_TEMP) {
    const queue = [...Object.entries(root)];
    const explored = [];
    const result = [];

    while (queue.length) {
        const entry = queue.shift();
        if (CORE_TO_TEMP[entry[0]]) {
            result.push(entry);
        }
        explored.push(entry);

        if (_.isObject(entry[1])) {
            for (const e of Object.entries(entry[1])) {
                queue.push(e);
            }
        }
    }

    return result.reduce((p, c) => {
        return {
            ...p,
            [c[0]]: c[1]
        }
    }, {});
}

function INSERT(objt) {

    LOGGER.debug(`Starting to insert data into Influx for ${JSON.stringify(objt)}`);

    Object.keys(objt).forEach((k) => {
        const OBJ = objt[k];
        LOGGER.debug(`Inserting entries for ${JSON.stringify(OBJ)}`);
        Object.entries(OBJ).forEach((v) => {

            LOGGER.debug(`Insering into ${k} - ${v[0]} - ${v[1]}`);

            if (v[0] && v[1]) {

                const writeApi = client.getWriteApi(org, bucket)
                writeApi.useDefaultTags({ host: 'host1' });
                const point = new Point(k)
                    .intField(v[0], v[1]);

                writeApi.writePoint(point);

                writeApi
                    .close()
                    .then(() => {
                        LOGGER.info(`${k} -- ${v[0]} -- ${v[1]}`)
                    })
                    .catch(e => {
                        LOGGER.error(`Error when trying to write to influx`);
                    })
            }
        })
    })
}