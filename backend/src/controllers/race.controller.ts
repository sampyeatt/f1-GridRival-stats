import {getRaceByMeetingKey, getRaceLaps, getRacesByYear} from '../shared/f1api.util'
import _ from 'lodash'
import {Request, Response} from 'express'
import {addSeasonRace, getRaceByCircutKey, getRacesBySeasonId} from '../services/race.services'
import z from 'zod'

export const getRacesBySeasonIdController = async (req: Request, res: Response) => {
    if (_.isNil(req.params.seasonId)) return res.status(400).json({message: 'SeasonId parameter is required'})

    const {seasonId} = req.params

    const results = await getRacesBySeasonId(+seasonId)

    const trimmedResults = _.map(results, result => _.pick(result.toJSON(), ['meeting_key', 'meeting_name']))

    res.json(trimmedResults)
}

export const addRaceBulkController = async (req: Request, res: Response) => {
    const schema = z.object({
        seasonId: z.number()
    })
    const schemaValidator = schema.safeParse(req.body)
    if (!schemaValidator.success) return res.status(400).json({
        message: 'Invalid request body',
        errors: schemaValidator.error
    })
    const {seasonId} = req.body
    const raceData = await getRacesByYear(seasonId)
    const f1DataRaces = await getRaceLaps(seasonId)
    const sordertRaces = _.orderBy(raceData, ['date_start'], ['asc'])
    if (raceData.length === 0) return res.status(404).json({message: 'Race not found'})
    const data = await Promise.all(_.map(raceData, async (race) => {
        const raceSessionData = await getRaceByMeetingKey(seasonId, race.meeting_key)
        return await Promise.all(_(raceSessionData)
            .reject({'session_type': 'Practice'})
            .reject({'session_name': 'Sprint Qualifying'})
            .map(async (race) => {
                const meetingName = _.find(raceData, {meeting_key: race.meeting_key})
                const round = _.findIndex(sordertRaces, {meeting_key: race.meeting_key})
                const totalLaps = _.find(f1DataRaces, {round: round})?.laps
                return {
                    circuit_key: race.circuit_key,
                    meeting_name: meetingName.meeting_name,
                    circuit_short_name: race.circuit_short_name,
                    country_code: race.country_code,
                    country_name: race.country_name,
                    meeting_key: race.meeting_key,
                    sprint_key: (race.session_name === 'Sprint') ? race.session_key : undefined,
                    quali_key: (race.session_name === 'Qualifying') ? race.session_key : undefined,
                    race_key: (race.session_name === 'Race') ? race.session_key : undefined,
                    seasonId: seasonId,
                    round: round,
                    totalLaps: totalLaps
                }
            }).value())
    }))

    const raceAdded = await Promise.all(_(_.groupBy(data.flat(), 'meeting_key')).map(async race => {
        const combinedRaceData = _.merge(race[0], race[1], race[2])
        const raceAlreadyAdded = await getRaceByCircutKey(combinedRaceData!.circuit_key)
        if (raceAlreadyAdded) return {message: 'Race already added'}
        return await addSeasonRace(seasonId, combinedRaceData!)
    }).value())
    res.json(raceAdded)
}

export const addRaceController = async (req: Request, res: Response) => {
    const schema = z.object({
        seasonId: z.number(),
        meeting_key: z.number()
    })
    const schemaValidator = schema.safeParse(req.body)
    if (!schemaValidator.success) return res.status(400).json({
        message: 'Invalid request body',
        errors: schemaValidator.error
    })
    const {seasonId, meeting_key} = req.body

    const raceData = await getRacesByYear(seasonId)
    const sordertRaces = _.orderBy(raceData, ['date_start'], ['asc'])
    const raceSessionData = await getRaceByMeetingKey(seasonId, meeting_key)
    if (raceSessionData.length === 0) return res.status(404).json({message: 'Race not found'})
    const race = await Promise.all(_(raceSessionData)
        .reject({'session_type': 'Practice'})
        .reject({'session_name': 'Sprint Qualifying'})
        .map(async (race) => {
            const meetingName = _.find(raceData, {meeting_key: race.meeting_key})
            return {
                circuit_key: race.circuit_key,
                meeting_name: meetingName.meeting_name,
                circuit_short_name: race.circuit_short_name,
                country_code: race.country_code,
                country_name: race.country_name,
                meeting_key: race.meeting_key,
                sprint_key: (race.session_name === 'Sprint') ? race.session_key : undefined,
                quali_key: (race.session_name === 'Qualifying') ? race.session_key : undefined,
                race_key: (race.session_name === 'Race') ? race.session_key : undefined,
                seasonId: seasonId,
                round: _.findIndex(sordertRaces, {meeting_key: race.meeting_key})
            }
        }).value())
    const combinedRaceData = _.merge(race[0], race[1], race[2])
    const raceAdded = await addSeasonRace(seasonId, combinedRaceData!)
    res.json(raceAdded)
}