import {Request, Response} from 'express'
import {getActiveDrivers} from '../services/driver.service'

export const getDrivers = async (req: Request, res: Response) => {
    const drivers = await getActiveDrivers()

    res.json(drivers)
}