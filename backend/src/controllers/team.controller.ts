import {Request, Response} from 'express'
import {getAllTeams, addTeam, getTeamById, updateTeam, deleteTeam} from '../services/team.service'
import {getCurrentTeams} from'../shared/f1api.util'
import z from 'zod'
import * as _ from 'lodash'
import {getActiveSeason} from '../services/season.services'

export const getTeams = async (req: Request, res: Response) => {
    const teams = await getAllTeams()

    res.json(teams)
}

export const populateTeamTable = async (req: Request, res: Response) => {
    const currentSeason = await getActiveSeason()
    if (!currentSeason) return res.status(404).json({message: 'Active Season not found'})
    const seasonId = currentSeason.toJSON().seasonId as number

    const teams = await getCurrentTeams(seasonId!)

    const teamAdded = await _.forEach(teams, async (team) => {
        const existingTeam = await getTeamById(team.teamId)
        if (!existingTeam) {
            return await addTeam(team.teamId, team.teamName,)
        }
    })
    res.json(teamAdded)
}

export const updateTeamController = async (req: Request, res: Response) => {
    const schema = z.object({
        teamId: z.string(),
        teamName: z.string()
    })
    const schemaValidator = schema.safeParse(req.body.data)
    if (!schemaValidator.success) return res.status(400).json({
        message: 'Invalid request body',
        errors: schemaValidator.error
    })
    const teamData = req.body.data
    const teamUpdated = await updateTeam(teamData)
    if (!teamUpdated) return res.status(404).json({message: 'Team not found'})
    else return res.json(teamUpdated)
}

export const deleteTeamController = async (req: Request, res: Response) => {
    const teamId = req.params.teamId
    if (_.isNil(teamId)) throw new Error('Meeting key parameter is required')
    const raceDeleted = await deleteTeam(teamId)
    if (!raceDeleted) return res.status(404).json({message: 'Race failed to delete', success: false})
    res.status(200).json({message: 'Race deleted', success: true})
}

