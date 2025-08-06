import {Request, Response} from 'express'
import {getAllUsers, addUser} from '../services/user.service'

export const getUsers = async (req: Request, res: Response) => {
    const users = await getAllUsers()

    res.json(users)
}

export const addUserController = async (req: Request, res: Response) => {
    const {name, email, password} = req.body
    res.json(await addUser(name, email, password))
}
