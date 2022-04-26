import _ from 'lodash'
import { spawnSync } from 'child_process'

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

function toCoreTemp({ INPUT_FIELDS, MAX_TEMP }) {
    return INPUT_FIELDS.reduce((p, c) => {
        return {
            ...p,
            [c]: Number(MAX_TEMP),
        }
    }, [])
}

function retrieveSensorData() {
    const sensorProcess = spawnSync('sensors', ['-j']);
    const formattedString = sensorProcess.output.slice(1, sensorProcess.output.length - 1).toString();
    return JSON.parse(formattedString);
}

export { BFS, toCoreTemp, retrieveSensorData };