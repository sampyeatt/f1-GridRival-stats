import {Request, Response} from 'express'
import z from 'zod'
import {deleteSeason, getActiveSeason, getAllSeasons, upsertSeason} from '../services/season.services'

export const getActiveSeasonController = async (req: Request, res: Response) => {
    res.json(await getActiveSeason())
}

export const getAllSeasonsController = async (req: Request, res: Response) => {
    res.json(await getAllSeasons())
}

export const addSeasonController = async (req: Request, res: Response) => {
    const schema = z.object({
        seasonId: z.number()
    })
    const parsedData = schema.safeParse(req.body)
    if (!parsedData.success) return res.status(400).json({
        message: 'Invalid request body',
        errors: JSON.parse(parsedData.error.message)
    })
    const {seasonId} = parsedData.data
    const newSeason = {
        seasonId: seasonId,
        currentSeason: true
    }

    res.json(await upsertSeason(newSeason))
}

export const deleteSeasonController = async (req: Request, res: Response) => {
    const schema = z.object({
        seasonId: z.number()
    })
    const parsedData = schema.safeParse(req.body)
    if (!parsedData.success) return res.status(400).json({
        message: 'Invalid request body',
        errors: JSON.parse(parsedData.error.message)
    })
    const {seasonId} = parsedData.data
    res.json(await deleteSeason(seasonId))

}

export  const inactivateSeasonController = async (req: Request, res: Response) => {
    const schema = z.object({
        seasonId: z.number()
    })
    const parsedData = schema.safeParse(req.body)
    if (!parsedData.success) return res.status(400).json({
        message: 'Invalid request body',
        errors: JSON.parse(parsedData.error.message)
    })
    const {seasonId} = parsedData.data
    const newSeason = {
        seasonId: seasonId,
        currentSeason: false
    }
    res.json(await upsertSeason(newSeason))
}
