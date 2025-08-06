import {User} from '../models/User'


export async function getAllUsers() {
    return await User.findAll()
}

export async function addUser(name: string, email: string) {
    const user = new User()
    user.name = name
    user.email = email
    user.password = '1'
    return User.build(user).save()

}