import {getSeasonBySeasonId} from '../shared/f1api.util'
import _ from 'lodash'
import {Request, Response} from 'express'
import {getUniqueResutls} from '../services/season.services'

export const getSeasonBySeasonIdController = async (req: Request, res: Response) => {
    if(_.isNil(req.params.seasonId)) return res.status(400).json({message: 'SeasonId parameter is required'})

    const {seasonId} = req.params

    const results = await getSeasonBySeasonId(+seasonId)
    const dataResults = await getUniqueResutls(+seasonId)

    const ourRaces = dataResults.map(result => result.get('raceId'))

    const trimmedResults = _.filter(results, function(o) {return _.includes(ourRaces, o.raceId)}).map(result =>  _.pick(result,['raceId', 'raceName']))

    res.json(trimmedResults)
}