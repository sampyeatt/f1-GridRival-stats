import {Category} from '../models/Category'


export async function getAllCategories() {
    const categories = await Category.findAll()
    return categories
}