import {Token} from '../models/Token'

export const addToken = async (token: string, type: 'activation' | 'reset' | 'access' | 'refresh' | 'admin', userId: number) => {
    const tokenInstance = new Token()
    tokenInstance.token = token
    tokenInstance.type = type
    tokenInstance.userId = userId
    return Token.build(tokenInstance).save()
}

export const deleteTokens = async (userId: number) => {
    return Token.destroy({
        where: {
            userId: userId
        }
    })
}

export const getToken = async (token: string) => {
    return Token.findOne({where: {token: token}})
}