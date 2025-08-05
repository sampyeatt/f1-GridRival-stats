import {Request, Response} from 'express'
import {
    addCategory,
    getAllCategories,
    getCategoryBySlug,
    removeCategoryById,
    updateCategory,
    getCategoryById
} from '../services/category.service'
import {generateSlug} from '../shared/general.util'
import {z} from 'zod'

export const getCategories = async (req: Request, res: Response) => {
    const categories = await getAllCategories()

    res.json(categories)
}

export const addCategoriesController = async (req: Request, res: Response) => {
    const schema = z.object({
        name: z.string()
    })
    const schemaValidator = schema.safeParse(req.body)
    if (!schemaValidator.success) return res.status(400).json({message: 'Invalid request body', errors: schemaValidator.error})

    const {name} = req.body
    const userId = 1
    let slug = generateSlug(name)
    const catBySlug = await getCategoryBySlug(slug)
    if (catBySlug) {
        slug = generateSlug(name, true)
    }
    const category = await addCategory(name, userId, slug)

    res.json(category)
}

export const updateCategoriesController = async (req: Request, res: Response) => {
    const schema = z.object({
        name: z.string(),
        id: z.number()
    })
    const schemaValidator = schema.safeParse(req.body)
    if (!schemaValidator.success) return res.status(400).json({message: 'Invalid request body', errors: schemaValidator.error})

    const {name, id} = req.body
    let slug = generateSlug(name)
    const catBySlug = await getCategoryBySlug(slug)
    if (catBySlug) res.status(400).json({message: 'Category already exists'})

    let dbCategory = await getCategoryById(id)
    if(!dbCategory) res.status(404).json({message: 'Category not found'})

    res.json(await updateCategory(id, name, slug))
}

export const removeCategoryController = async (req: Request, res: Response) => {
    const schema = z.object({
        id: z.number()
    })
    const schemaValidator = schema.safeParse(req.body)
    if (!schemaValidator.success) return res.status(400).json({message: 'Invalid request body', errors: schemaValidator.error})

    console.log('removeCategoryController', req.body)
    const {id} = req.body
    const category = await getCategoryById(id)
    if (!category) {
        res.status(404).json({message: 'Category not found'})
    }
    res.json(await removeCategoryById(Number(id)))
}