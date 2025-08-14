import { connection } from "./connection"

connection.sync({
    logging: false,
    // alter: true
})

export { connection }