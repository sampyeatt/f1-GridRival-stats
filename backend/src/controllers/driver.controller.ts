import {NextFunction, Request, Response} from 'express'
import {z} from 'zod'
import {getActiveDrivers, getAllDrivers, updateDriver} from '../services/driver.service'
import {getActiveSeason} from '../services/season.services'
import {ingestDriversAndTeams} from '../services/ingest.service'

export const getDriversController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.json(await getActiveDrivers())
    } catch (error) {
        next(error)
    }
}

export const getAllDriversController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.json(await getAllDrivers())
    } catch (error) {
        next(error)
    }
}

/**
 * Syncs drivers and constructors for the active season.
 *
 * The old version passed an async callback to _.forEach, which does not await,
 * so it answered "Drivers added successfully" before a single row was written.
 */
export const syncDriversController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const season = await getActiveSeason()
        if (!season) return res.status(404).json({message: 'Active Season not found'})

        const counts = await ingestDriversAndTeams(season.get('seasonId') as number)
        res.json({message: `Synced ${counts.drivers} drivers and ${counts.teams} teams`, ...counts, success: true})
    } catch (error) {
        next(error)
    }
}

export const updateDriverController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const schema = z.object({
            driverId: z.string(),
            driverName: z.string().optional(),
            driverNumber: z.number().int().optional(),
            shortName: z.string().optional(),
            teamId: z.string().optional(),
            active: z.boolean().optional()
        })
        const parsed = schema.safeParse(req.body.data)
        if (!parsed.success) return res.status(400).json({
            message: 'Invalid request body',
            errors: parsed.error.issues
        })

        const updated = await updateDriver(parsed.data)
        if (!updated) return res.status(404).json({message: 'Driver not found', success: false})
        res.json({message: 'Driver updated', success: true, data: updated.toJSON()})
    } catch (error) {
        next(error)
    }
}
