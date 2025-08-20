import {User} from '../models/User'


export async function getAllUsers() {
    return await User.findAll()
}

export async function getAllById(userId: number) {
    return await User.findByPk(userId)
}

export async function addUser(email: string, password: string) {
    const user = new User()
    user.name = email
    user.email = email
    user.password = password
    return User.build(user).save()

}

export async function getUserByEmail(email: string) {
    return await User.findOne({
        where: {
            email: email
        }
    })
}

export const updateUser = async ({name, status, id, password}: {
    name?: string,
    status?: 'active' | 'pending',
    id: number,
    password?: string
}) => {
    console.log('name: ', name, ' status: ', status, ' id: ', id, '')
    const user = await User.findByPk(id)
    if (!user) throw new Error('User not found')

    user.userId = id
    if (name) user.name = name
    if (status) user.status = status
    if (password) user.password = password
    return await User.update(user, {
        where: {userId: id}
    })
}

export const updateToAdmin = async (userId: number) => {
    const user = await User.findByPk(userId)
    if (!user) throw new Error('User not found')
    if (user.role === 'user') user.set({role: 'admin'})
    return await user.save()
}