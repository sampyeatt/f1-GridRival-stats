import {Request, Response} from 'express'
import {getResutls} from '../services/results.service'
import * as _ from 'lodash'

export const getResults = async (req: Request, res: Response) => {
    if (_.isNil(req.params.seasonId)) throw new Error('SeasonId parameter is required')
    const results = await getResutls(+req.params.seasonId)

    res.json(results)
}