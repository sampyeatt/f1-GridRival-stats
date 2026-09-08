import {User} from '../models/User'


export const PUBLIC_USER_FIELDS = ['userId', 'name', 'email', 'role', 'status'] as const

export async function getAllUsers() {
    return await User.findAll({attributes: [...PUBLIC_USER_FIELDS]})
}

export async function getAllById(userId: number) {
    return await User.findByPk(userId)
}

export async function addUser(email: string, password: string) {
    const user = new User()
    user.set({
        name: email,
        email: email,
        password: password,
        role: 'user',
        status: 'pending'
    })
    return await user.save()

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
    const user = await User.findByPk(id)
    if (!user) throw new Error('User not found')

    user.set({userId: id})
    if (name) user.set({name: name})
    if (status) user.set({status: status})
    if (password) user.set({password: password})
    return await user.save()
}

/** Used to roll a registration back when the confirmation email fails. */
export const deleteUser = async (userId: number) => {
    return await User.destroy({where: {userId}})
}

export const updateToAdmin = async (userId: number) => {
    const user = await User.findByPk(userId)
    if (!user) throw new Error('User not found')
    if (user.get('role') === 'user') user.set({role: 'admin'})
    return await user.save()
}