import {Request, Response} from 'express'
import {getAllTeams, addTeam, getTeamById} from '../services/team.service'
import {getCurrentTeams} from'../shared/f1api.util'
import z from 'zod'
import * as _ from 'lodash'

export const getTeams = async (req: Request, res: Response) => {
    const teams = await getAllTeams()

    res.json(teams)
}

export const populateTeamTable = async (req: Request, res: Response) => {
    const schema = z.object({
        seasonId: z.number()
    })
    const schemaValidator = schema.safeParse(req.body)
    if (!schemaValidator.success) return res.status(400).json({message: 'Invalid request body', errors: schemaValidator.error})

    const {seasonId} = req.body

    const teams = await getCurrentTeams(seasonId)

    const teamAdded = await _.forEach(teams, async (team) => {
        const existingTeam = await getTeamById(team.teamId)
        if (!existingTeam) {
            return await addTeam(team.teamId, team.teamName,)
        }
    })
    res.json(teamAdded)
}

