import {Team} from '../models/Team'


export async function getAllTeams() {
    return await Team.findAll()
}