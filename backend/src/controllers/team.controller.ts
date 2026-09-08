import {NextFunction, Request, Response} from 'express'
import z from 'zod'
import {deleteTeam, getAllTeams, updateTeam} from '../services/team.service'

export const getTeams = async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.json(await getAllTeams())
    } catch (error) {
        next(error)
    }
}

export const updateTeamController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const parsed = z.object({teamId: z.string(), teamName: z.string()}).safeParse(req.body.data)
        if (!parsed.success) return res.status(400).json({
            message: 'Invalid request body',
            errors: parsed.error.issues
        })

        const updated = await updateTeam(parsed.data)
        if (!updated) return res.status(404).json({message: 'Team not found'})
        res.json({message: 'Team updated', success: true, data: updated.toJSON()})
    } catch (error) {
        next(error)
    }
}

export const deleteTeamController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {teamId} = req.params
        if (!teamId) return res.status(400).json({message: 'teamId parameter is required'})

        const deleted = await deleteTeam(teamId)
        if (!deleted) return res.status(404).json({message: 'Team not found', success: false})
        res.status(200).json({message: 'Team deleted', success: true})
    } catch (error) {
        next(error)
    }
}
