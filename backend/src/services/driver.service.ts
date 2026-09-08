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

export async function getDriverById(id: string) {
    return await Driver.findByPk(id)
}

export interface DriverUpdate {
    driverId: string
    driverName?: string | undefined
    driverNumber?: number | undefined
    shortName?: string | undefined
    teamId?: string | undefined
    active?: boolean | undefined
}

export async function updateDriver(driver: DriverUpdate) {
    const driverInstance = await Driver.findByPk(driver.driverId)
    if (!driverInstance) return null
    driverInstance.set(driver as any)
    return await driverInstance.save()
}