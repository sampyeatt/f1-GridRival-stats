import {getRaceByMeetingKey, getRaceLaps, getRacesByYear} from '../shared/f1api.util'
import _ from 'lodash'
import {Request, Response} from 'express'
import {
    addSeasonRace, deleteRace,
    getRaceByCircutKey,
    getRaceDataByMeetingKey,
    getRacesBySeasonId,
    updateRaceBulk
} from '../services/race.services'
import z from 'zod'
import {getActiveSeason} from '../services/season.services'

export const getRacesListController = async (req: Request, res: Response) => {
    const currentSeason = await getActiveSeason()
    if (!currentSeason) return res.status(404).json({message: 'Active Season not found'})
    const seasonId = currentSeason.toJSON().seasonId as number

    const results = await getRacesBySeasonId(+seasonId!)

    const trimmedResults = _.map(results, result => _.pick(result.toJSON(), ['meeting_key', 'meeting_name']))

    res.json(trimmedResults)
}

export const getAllRacesController = async (req: Request, res: Response) => {
    const currentSeason = await getActiveSeason()
    if (!currentSeason) return res.status(404).json({message: 'Active Season not found'})
    const seasonId = currentSeason.toJSON().seasonId as number

    const results = await getRacesBySeasonId(+seasonId!)

    res.json(results)
}

export const getRacesByMeetingKeyController = async (req: Request, res: Response) => {
    const meeting_key = req.params.meeting_key
    if (_.isNil(meeting_key)) throw new Error('Meeting key parameter is required')
    const results = _.map(await getRaceDataByMeetingKey(+meeting_key), rece => rece.toJSON())
    res.json(results)
}

export const addRaceBulkController = async (req: Request, res: Response) => {
    const currentSeason = await getActiveSeason()
    if (!currentSeason) return res.status(404).json({message: 'Active Season not found'})
    const seasonId = currentSeason.toJSON().seasonId as number
    console.log('SeasonId: ', seasonId)
    const raceData = await getRacesByYear(seasonId!)
    console.log('RaceData: ', raceData)
    const f1DataRaces = await getRaceLaps(seasonId!)
    console.log('F1DataRaces: ', f1DataRaces)
    const sordertRaces = _.orderBy(raceData, ['date_start'], ['asc'])
    if (raceData.length === 0) return res.status(404).json({message: 'Race not found'})
    const data = await Promise.all(_.map(raceData, async (race) => {
        const raceSessionData = await getRaceByMeetingKey(seasonId!, race.meeting_key)
        console.log('receSeessionData', raceSessionData)
        return await Promise.all(_(raceSessionData)
            .reject({'session_type': 'Practice'})
            .reject({'session_name': 'Sprint Qualifying'})
            .map(async (race) => {
                const meetingName = _.find(raceData, {meeting_key: race.meeting_key})
                const round = _.findIndex(sordertRaces, {meeting_key: race.meeting_key})
                const dataRace = _.find(f1DataRaces, {round: round})
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
                    totalLaps: dataRace.laps as number,
                    raceId: dataRace.raceId as string
                }
            }).value())
    }))

    console.log('Data', data)
    const raceAdded = await Promise.all(_(_.groupBy(data.flat(), 'meeting_key')).map(async race => {
        const combinedRaceData = _.merge(race[0], race[1], race[2])
        const raceAlreadyAdded = await getRaceByCircutKey(combinedRaceData!.circuit_key)
        if (raceAlreadyAdded) return {message: 'Race already added'}
        console.log('CombinedRaceData', combinedRaceData)
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
    const seasonId = currentSeason.toJSON().seasonId as number

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
            const dataRace = _.find(f1DataRaces, {round: round})
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
                round: round as number,
                totalLaps: dataRace.laps as number,
                raceId: dataRace.raceId as string
            }
        }).value())
    const combinedRaceData = _.merge(race[0], race[1], race[2])
    const raceAdded = await addSeasonRace(seasonId!, combinedRaceData!)
    res.json(raceAdded)
}

export const updateCurrentSeason = async (req: Request, res: Response) => {

    const currentSeason = await getActiveSeason()
    if (!currentSeason) return res.status(404).json({message: 'Active Season not found'})
    const seasonId = currentSeason.toJSON().seasonId as number
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
                const dataRace = _.find(f1DataRaces, {round: round})
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
                    totalLaps: dataRace.laps as number,
                    raceId: dataRace.raceId as string
                }
            }).value())
    }))

    // @ts-ignore data is an array of arrays so its resulst will have eleeement of array of objects.
    const combinedRaceData = _.map(data, race => _.merge(race[0], race[1], race[2]))
    const racesUpdated = await updateRaceBulk(combinedRaceData)
    if (racesUpdated.length !== 0) return res.status(200).json({message: 'Races updated', success: true})
    else return res.status(404).json({message: 'Races failed to update', success: false})

}

export const updateRaceController = async (req: Request, res: Response) => {
    const schema = z.object({
        meeting_key: z.number(),
        circut_key: z.number(),
        meeting_name: z.string(),
        circuit_short_name: z.string(),
        country_code: z.string(),
        country_name: z.string(),
        sprint_key: z.number().nullish(),
        quali_key: z.number(),
        race_key: z.number(),
        round: z.number(),
        totalLaps: z.number(),
        raceId: z.string(),
        seasonId: z.number(),
        createdAt: z.string(),
        updatedAt: z.string(),
    })
    const schemaValidator = schema.safeParse(req.body.data)
    if (!schemaValidator.success) return res.status(400).json({
        message: 'Invalid request body',
        errors: schemaValidator.error.issues
    })
    const raceData =[req.body.data]
    console.log('RaceDatra', raceData)
    const raceUpdated = await updateRaceBulk(raceData)
    if (raceUpdated.length !== 0) return res.status(200).json({message: 'Races updated', success: true})
    else return res.status(404).json({message: 'Races failed to update', success: false})
}

export const deleteRaceController = async (req: Request, res: Response) => {
    const meeting_key = req.params.meeting_key
    if (_.isNil(meeting_key)) throw new Error('Meeting key parameter is required')
    const raceDeleted = await deleteRace(+meeting_key)
    if (!raceDeleted) return res.status(404).json({message: 'Race failed to delete', success: false})
    res.status(200).json({message: 'Race deleted', success: true})
}