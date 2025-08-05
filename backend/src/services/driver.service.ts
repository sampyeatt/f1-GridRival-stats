import {Driver} from '../models/Driver'


export async function getActiveDrivers() {
    return await Driver.findAll({
        where: {
            active: true
        }
    })
}