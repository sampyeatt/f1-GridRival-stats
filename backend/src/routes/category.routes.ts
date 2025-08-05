import {Router} from 'express'
import {addCategoriesController, getCategories} from '../controllers/category.controller'

const router = Router()

router.get('/', getCategories)
router.post('/', addCategoriesController)

export default router