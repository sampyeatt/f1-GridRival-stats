import {getSeasonBySeasonId} from '../shared/f1api.util'
import _ from 'lodash'
import {Request, Response} from 'express'

export const getSeasonBySeasonIdController = async (req: Request, res: Response) => {
    if(_.isNil(req.params.seasonId)) return res.status(400).json({message: 'SeasonId parameter is required'})

    const {seasonId} = req.params

    const results = await getSeasonBySeasonId(+seasonId)

    console.log('Results: ', results)

    const trimmedResults = _.map(results, race => {
        return _.pick(race, ['raceName', 'raceId'])
    })

    res.json(trimmedResults)
}