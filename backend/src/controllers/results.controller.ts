import {Request, Response} from 'express'
import {Results} from '../models/Results'
import {getResutls} from '../services/results.service'

export const getResults = async (req: Request, res: Response) => {
    const results = await getResutls(+req.params.seasonId!)

    res.json(results)
}