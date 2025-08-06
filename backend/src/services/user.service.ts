import {User} from '../models/User'
import {Category} from '../models/Category'


export async function getAllUsers() {
    return await User.findAll()
}

export async function addUser(name: string, email: string, password: string) {
    const user = new User()
    user.name = name
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