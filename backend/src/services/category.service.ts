import {Category} from '../models/Category'


export async function getAllCategories() {
    const categories = await Category.findAll()
    return categories
}

export async function addCategory(name: string, userId: number) {
    const category = new Category()
    category.name = name
    category.userId = userId
    await category.save()
    return category
}