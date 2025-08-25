import {Driver} from '../models/Driver'


export async function getActiveDrivers() {
    return await Driver.findAll({
        where: {
            active: true
        }
    })
}

export async function getAllDrivers() {
    return await Driver.findAll({
        include: ['team']
    })
}

export async function addDriver(driverId: string, name: string, surname: string, teamId: string, shortName: string, driverNumber: number) {
    const driver = new Driver()
    driver.set({driverId: driverId, driverName: `${name} ${surname}`, shortName: shortName, teamId: teamId, active: true, driverNumber: driverNumber})
    return driver.save()
}

export async function getDriverById(id: string) {
    return await Driver.findByPk(id)
}

export async function updateDriver(driver: Partial<Driver>) {
    const driverInstance = await Driver.findByPk(driver.driverId)
    if (!driverInstance) throw new Error('Driver not found')
    driverInstance.set(driver)
    return driverInstance.save()
}