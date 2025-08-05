import {Request, Response} from 'express'
import {getAllTeams} from '../services/team.service'

export const getTeams = async (req: Request, res: Response) => {
    const teams = await getAllTeams()

    res.json(teams)
}