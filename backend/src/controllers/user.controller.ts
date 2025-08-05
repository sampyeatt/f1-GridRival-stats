import {Request, Response} from 'express'
import {getAllUsers, addUser} from '../services/user.service'
import {addCategory} from '../services/category.service'

export const getUsers = async (req: Request, res: Response) => {
    const users = await getAllUsers()

    res.json(users)
}

export const addUserController = async (req: Request, res: Response) => {
    const {name, email} = req.body

    const user = await addUser(name, email)

    res.json(user)
}
