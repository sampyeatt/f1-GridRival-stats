import { connection } from "./connection"

connection.sync({
    logging: false
})

export { connection }