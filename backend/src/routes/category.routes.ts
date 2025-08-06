import {Router} from 'express'
import {addCategoriesController, getCategories, removeCategoryController, updateCategoriesController} from '../controllers/category.controller'
import {authenticateJWT} from '../shared/auth.util'

const router = Router()

router.get('/', getCategories)
router.post('/', authenticateJWT, addCategoriesController)
router.put('/', authenticateJWT, updateCategoriesController)
router.delete('/', authenticateJWT, removeCategoryController)

export default router