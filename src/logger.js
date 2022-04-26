import pino from "pino"
import PinoPretty from "pino-pretty"

const LOGGER = pino(PinoPretty({
    colorize: true,
    customPrettifiers: {
        time: (timestamp) => `[${new Date(timestamp).toISOString()}]`,
    }
}))


export { LOGGER };