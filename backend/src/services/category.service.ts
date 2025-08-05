import {Category} from '../models/Category'


export async function getAllCategories() {
    return await Category.findAll()
}

export async function addCategory(name: string, userId: number, slug: string) {
    console.log('name: ', name, ' userId: ', userId, '')
    const cat = new Category()
    cat.name = name
    cat.userId = userId
    cat.slug = slug

    console.log('category: ', cat)
    return Category.build(cat).save()
}

export async function getCategoryBySlug(slug: string) {
    return await Category.findOne({
        where: {
            slug: slug
        }
    })
}

export async function removeCategoryById(id: number) {
    return await Category.destroy({
        where: {
            id: id
        }
    })
}

export async function getCategoryById(id: number) {
    return await Category.findByPk(id)
}

export async function updateCategory(id: number, name: string, slug: string) {
    const cat = await Category.findByPk(id)
    if (!cat) {
        throw new Error('Category not found')
    }
    if(name) cat.name = name
    if(slug) cat.slug = slug
    return Category.build(cat).save()

}