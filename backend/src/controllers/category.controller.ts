import {Request, Response} from 'express'
import {addCategory, getAllCategories} from '../services/category.service'

export const getCategories = async (req: Request, res: Response) => {
    const categories = await getAllCategories()

    res.json(categories)
}

export const addCategoriesController = async (req: Request, res: Response) => {
    const {name} = req.body

    const category = await addCategory(name, 1)

    res.json(category)
}