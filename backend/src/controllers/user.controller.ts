import {Request, Response} from 'express'
import {getAllUsers} from '../services/user.service'

export const getUsers = async (req: Request, res: Response) => {
    res.json(await getAllUsers())
}
