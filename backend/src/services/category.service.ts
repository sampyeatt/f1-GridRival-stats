import {Category} from '../models/Category'


export async function getAllCategories() {
    return await Category.findAll()
}

export async function addCategory(name: string, userId: number) {
    console.log('name: ', name, ' userId: ', userId, '')
    const cat = new Category()
    cat.name = name
    cat.userId = userId
    cat.slug = 'test'
    console.log('category: ', cat)
    await cat.save()
    console.log('category saved', cat)
    return cat
}