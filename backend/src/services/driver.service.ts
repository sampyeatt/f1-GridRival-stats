import {Driver} from '../models/Driver'


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