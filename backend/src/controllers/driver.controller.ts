import {Request, Response} from 'express'
import {addDriver, getActiveDrivers, getAllDrivers, getDriverById, updateDriver} from '../services/driver.service'
import {getCurrentDrivers} from'../shared/f1api.util'
import * as _ from 'lodash'
import {getActiveSeason} from '../services/season.services'
import {z} from 'zod'

export const getDriversController = async (req: Request, res: Response) => {
    res.json(await getActiveDrivers())
}

export const getAllDriversController = async (req: Request, res: Response) => {
    res.json(await getAllDrivers())
}

export const populateDriverTable = async (req: Request, res: Response) => {
    const currentSeason = await getActiveSeason()
    if (!currentSeason) return res.status(404).json({message: 'Active Season not found'})
    const seasonId = currentSeason.toJSON().seasonId as number

    const drivers = await getCurrentDrivers(seasonId!)

    await _.forEach(drivers, async (driver) => {
        const driverExists = await getDriverById(driver.driverId)
        if (driverExists) return {message: 'Driver already exists'}
        await addDriver(driver.driverId, driver.name, driver.surname, driver.teamId, driver.shortName, driver.number)
    })

    res.json({message: 'Drivers added successfully'})
}

export const updateDriverController = async (req: Request, res: Response) => {
    const schema = z.object({
        driverId: z.string(),
        driverName: z.string(),
        driverNumber: z.number(),
        shortName: z.string(),
        teamId: z.string(),
        active: z.boolean()
    })
    const schemaValidator = schema.safeParse(req.body.data)
    if (!schemaValidator.success) return res.status(400).json({
        message: 'Invalid request body',
        errors: schemaValidator.error.issues
    })
    const updated = await updateDriver(req.body.data)
    if (!updated) return res.status(404).json({message: 'Driver update failed', success: false})
    res.json({message: 'Driver updated successfully', success: true})
}