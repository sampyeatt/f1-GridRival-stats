import {Request, Response} from 'express'
import {Category} from '../models/Category'
import {getAllCategories} from '../services/category.service'

export const getCategories = async (req: Request, res: Response) => {
    const categories = await getAllCategories()

    res.json(categories)
}