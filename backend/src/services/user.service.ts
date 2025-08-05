import {User} from '../models/User'


export async function getAllUsers() {
    return await User.findAll()
}

export async function addUser(name: string, email: string) {
    const user = new User()
    user.name = name
    user.email = email
    user.password = ''
    console.log('category: ', user)
    await user.save()
    console.log('category saved', user)
    return user
}