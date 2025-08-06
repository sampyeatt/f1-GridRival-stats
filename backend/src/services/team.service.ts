import {Team} from '../models/Team'
import axios from 'axios'


export async function getAllTeams() {
    return await Team.findAll()
}

export async function addTeam(teamId: string, teamName: string) {
    const team = new Team()
    team.teamId = teamId
    team.teamName = teamName
    return Team.build(team).save()
}

export async function getCurrentTeams(seasonId: number) {
    const response = await axios.get(`https://f1connectapi.vercel.app/api/current/teams?seasonId=${seasonId}`)
    return response.data.teams
}

export async function getTeamById(id: string) {
    return await Team.findByPk(id)
}