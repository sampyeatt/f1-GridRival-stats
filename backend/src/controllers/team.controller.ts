import {Request, Response} from 'express'
import {getAllTeams, addTeam, getTeamById} from '../services/team.service'
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
    const seasonId = currentSeason!.get('seasonId') as number

    const teams = await getCurrentTeams(seasonId!)

    const teamAdded = await _.forEach(teams, async (team) => {
        const existingTeam = await getTeamById(team.teamId)
        if (!existingTeam) {
            return await addTeam(team.teamId, team.teamName,)
        }
    })
    res.json(teamAdded)
}

