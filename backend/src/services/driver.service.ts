import {Driver} from '../models/Driver'
import axios from 'axios'


export async function getActiveDrivers() {
    return await Driver.findAll({
        where: {
            active: true
        }
    })
}

export async function addDriver(driverId: string, name: string, surname: string, teamId: string, shortName: string) {
    const driver = new Driver()
    driver.driverId = driverId
    driver.driverName = `${name} ${surname}`
    driver.shortName = shortName
    driver.teamId = teamId
    driver.active = true
    return Driver.build(driver).save()
}

export async function getDriverById(id: string) {
    return await Driver.findByPk(id)
}

export async function getCurrentDrivers(seasonId: number) {
    const response = await axios.get(`https://f1connectapi.vercel.app/api/current/drivers?seasonId=${seasonId}`)
    return response.data.drivers
}