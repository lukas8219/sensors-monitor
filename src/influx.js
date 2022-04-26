import dotenv from 'dotenv'
import { InfluxDB, Point } from '@influxdata/influxdb-client';

const { DOCKER_INFLUXDB_INIT_ORG: ORG, DOCKER_INFLUXDB_INIT_BUCKET: BUCK, DOCKER_INFLUXDB_INIT_ADMIN_TOKEN: TOKEN } = dotenv.config('../.env').parsed;

const CLIENT = new InfluxDB({ url: 'http://influx:8086', token: TOKEN })

async function writePoint({ measurementName, fieldName, fieldValue }) {
    return new Promise((res, rej) => {
        try {
            const writeApi = CLIENT.getWriteApi(ORG, BUCK);
            writeApi.useDefaultTags({ host: 'host1' });
            const point = new Point(measurementName)
                .intField(fieldName, fieldValue);
            writeApi.writePoint(point);
            res(writeApi);
        } catch (err) {
            rej(err);
        }
    });
}

export {
    CLIENT, writePoint
}