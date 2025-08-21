import {getRaceByMeetingKey, getRaceLaps, getRacesByYear} from '../shared/f1api.util'
import _ from 'lodash'
import {Request, Response} from 'express'
import {addSeasonRace, getRaceByCircutKey, getRacesBySeasonId, updateRaceBulk} from '../services/race.services'
import z from 'zod'
import {getActiveSeason} from '../services/season.services'

export const getRacesBySeasonIdController = async (req: Request, res: Response) => {
    const currentSeason = await getActiveSeason()
    if (!currentSeason) return res.status(404).json({message: 'Active Season not found'})
    const seasonId = currentSeason!.get('seasonId') as number

    const results = await getRacesBySeasonId(+seasonId!)

    const trimmedResults = _.map(results, result => _.pick(result.toJSON(), ['meeting_key', 'meeting_name']))

    res.json(trimmedResults)
}

export const addRaceBulkController = async (req: Request, res: Response) => {
    const currentSeason = await getActiveSeason()
    if (!currentSeason) return res.status(404).json({message: 'Active Season not found'})
    const seasonId = currentSeason!.get('seasonId') as number
    const raceData = await getRacesByYear(seasonId!)
    const f1DataRaces = await getRaceLaps(seasonId!)
    const sordertRaces = _.orderBy(raceData, ['date_start'], ['asc'])
    if (raceData.length === 0) return res.status(404).json({message: 'Race not found'})
    const data = await Promise.all(_.map(raceData, async (race) => {
        const raceSessionData = await getRaceByMeetingKey(seasonId!, race.meeting_key)
        return await Promise.all(_(raceSessionData)
            .reject({'session_type': 'Practice'})
            .reject({'session_name': 'Sprint Qualifying'})
            .map(async (race) => {
                const meetingName = _.find(raceData, {meeting_key: race.meeting_key})
                const round = _.findIndex(sordertRaces, {meeting_key: race.meeting_key})
                const totalLaps = _.find(f1DataRaces, {round: round})?.laps
                return {
                    circuit_key: race.circuit_key as number,
                    meeting_name: meetingName.meeting_name as string,
                    circuit_short_name: race.circuit_short_name as string,
                    country_code: race.country_code as string,
                    country_name: race.country_name as string,
                    meeting_key: race.meeting_key as number,
                    sprint_key: (race.session_name === 'Sprint') ? race.session_key as number : undefined,
                    quali_key: (race.session_name === 'Qualifying') ? race.session_key  as number : undefined,
                    race_key: (race.session_name === 'Race') ? race.session_key  as number : undefined,
                    seasonId: seasonId  as number,
                    round: round  as number,
                    totalLaps: totalLaps as number
                }
            }).value())
    }))

    const raceAdded = await Promise.all(_(_.groupBy(data.flat(), 'meeting_key')).map(async race => {
        const combinedRaceData = _.merge(race[0], race[1], race[2])
        const raceAlreadyAdded = await getRaceByCircutKey(combinedRaceData!.circuit_key)
        if (raceAlreadyAdded) return {message: 'Race already added'}
        return await addSeasonRace(seasonId!, combinedRaceData!)
    }).value())
    res.json(raceAdded)
}

export const addRaceController = async (req: Request, res: Response) => {
    const schema = z.object({
        meeting_key: z.number()
    })
    const schemaValidator = schema.safeParse(req.body)
    if (!schemaValidator.success) return res.status(400).json({
        message: 'Invalid request body',
        errors: schemaValidator.error
    })
    const meeting_key = req.body
    const currentSeason = await getActiveSeason()
    if (!currentSeason) return res.status(404).json({message: 'Active Season not found'})
    const seasonId = currentSeason!.get('seasonId') as number

    const raceData = await getRacesByYear(seasonId!)
    const f1DataRaces = await getRaceLaps(seasonId!)
    const sordertRaces = _.orderBy(raceData, ['date_start'], ['asc'])
    const raceSessionData = await getRaceByMeetingKey(seasonId!, meeting_key)
    if (raceSessionData.length === 0) return res.status(404).json({message: 'Race not found'})
    const race = await Promise.all(_(raceSessionData)
        .reject({'session_type': 'Practice'})
        .reject({'session_name': 'Sprint Qualifying'})
        .map(async (race) => {
            const meetingName = _.find(raceData, {meeting_key: race.meeting_key})
            const round = _.findIndex(sordertRaces, {meeting_key: race.meeting_key})
            const totalLaps = _.find(f1DataRaces, {round: round})?.laps
            return {
                circuit_key: race.circuit_key as number,
                meeting_name: meetingName.meeting_name as string,
                circuit_short_name: race.circuit_short_name as string,
                country_code: race.country_code as string,
                country_name: race.country_name as string,
                meeting_key: race.meeting_key as number,
                sprint_key: (race.session_name === 'Sprint') ? race.session_key as number : undefined,
                quali_key: (race.session_name === 'Qualifying') ? race.session_key as number: undefined,
                race_key: (race.session_name === 'Race') ? race.session_key as number : undefined,
                seasonId: seasonId as number,
                round: round as number ,
                totalLaps: totalLaps as number
            }
        }).value())
    const combinedRaceData = _.merge(race[0], race[1], race[2])
    const raceAdded = await addSeasonRace(seasonId!, combinedRaceData!)
    res.json(raceAdded)
}

export const updateCurrentSeason = async (req: Request, res: Response) => {

    const currentSeason = await getActiveSeason()
    if (!currentSeason) return res.status(404).json({message: 'Active Season not found'})
    const seasonId = currentSeason!.get('seasonId') as number
    console.log('SeasonId: ', seasonId)
    const raceData = await getRacesByYear(seasonId)
    const f1DataRaces = await getRaceLaps(seasonId)
    const sordertRaces = _.orderBy(raceData, ['date_start'], ['asc'])
    if (raceData.length === 0) return res.status(404).json({message: 'Race not found'})
    const data = await Promise.all(_.map(raceData, async (race) => {
        if (!race.meeting_key) return {message: 'no meeting key found'}
        const raceSessionData = await getRaceByMeetingKey(seasonId, race.meeting_key)
        return await Promise.all(_(raceSessionData)
            .reject({'session_type': 'Practice'})
            .reject({'session_name': 'Sprint Qualifying'})
            .map(async (race) => {
                const meetingName = _.find(raceData, {meeting_key: race.meeting_key})
                const round = _.findIndex(sordertRaces, {meeting_key: race.meeting_key})
                const totalLaps = _.find(f1DataRaces, {round: round})?.laps
                return {
                    circuit_key: race.circuit_key as number,
                    meeting_name: meetingName.meeting_name as string,
                    circuit_short_name: race.circuit_short_name as string,
                    country_code: race.country_code as string,
                    country_name: race.country_name as string,
                    meeting_key: race.meeting_key as number,
                    sprint_key: (race.session_name === 'Sprint') ? race.session_key as number : undefined,
                    quali_key: (race.session_name === 'Qualifying') ? race.session_key as number : undefined,
                    race_key: (race.session_name === 'Race') ? race.session_key as number : undefined,
                    seasonId: seasonId as number,
                    round: round as number,
                    totalLaps: totalLaps as number
                }
            }).value())
    }))

    // @ts-ignore data is an array of arrays so its resulst will have eleeement of array of objects.
    const combinedRaceData = _.map(data, race => _.merge(race[0], race[1], race[2]))
    const racesUpdated = await updateRaceBulk(combinedRaceData)
    res.json(racesUpdated)
}