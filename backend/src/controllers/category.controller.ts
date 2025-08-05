import {Request, Response} from 'express'
import {addCategory, getAllCategories} from '../services/category.service'

export const getCategories = async (req: Request, res: Response) => {
    const categories = await getAllCategories()

    res.json(categories)
}

export const addCategoriesController = async (req: Request, res: Response) => {
    const {name} = req.body
    const userId = 1

    const category = await addCategory(name, userId)

    res.json(category)
}