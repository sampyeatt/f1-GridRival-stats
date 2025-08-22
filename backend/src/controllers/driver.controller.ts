import {Request, Response} from 'express'
import {addDriver, getActiveDrivers, getAllDrivers, getDriverById} from '../services/driver.service'
import {getCurrentDrivers} from'../shared/f1api.util'
import * as _ from 'lodash'
import {getActiveSeason} from '../services/season.services'

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