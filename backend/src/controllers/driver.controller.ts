import {Request, Response} from 'express'
import {addDriver, getActiveDrivers, getDriverById} from '../services/driver.service'
import {getCurrentDrivers} from'../shared/f1api.util'
import z from 'zod'
import * as _ from 'lodash'

export const getDrivers = async (req: Request, res: Response) => {
    const drivers = await getActiveDrivers()

    res.json(drivers)
}

export const populateDriverTable = async (req: Request, res: Response) => {
    const schema = z.object({
        seasonId: z.number()
    })
    const schemaValidator = schema.safeParse(req.body)
    if (!schemaValidator.success) return res.status(400).json({message: 'Invalid request body', errors: schemaValidator.error})

    const {seasonId} = req.body

    const drivers = await getCurrentDrivers(seasonId)

    await _.forEach(drivers, async (driver) => {
        const driverExists = await getDriverById(driver.driverId)
        if (driverExists) return {message: 'Driver already exists'}
        await addDriver(driver.driverId, driver.name, driver.surname, driver.teamId, driver.shortName, driver.number)
    })

    res.json({message: 'Drivers added successfully'})
}