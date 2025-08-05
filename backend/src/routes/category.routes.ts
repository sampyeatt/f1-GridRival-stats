import {Router} from 'express'
import {addCategoriesController, getCategories, removeCategoryController, updateCategoriesController} from '../controllers/category.controller'

const router = Router()

router.get('/', getCategories)
router.post('/', addCategoriesController)
router.put('/', updateCategoriesController)
router.delete('/', removeCategoryController)

export default router