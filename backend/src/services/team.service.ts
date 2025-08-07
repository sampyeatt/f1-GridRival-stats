import {Team} from '../models/Team'


export async function getAllTeams() {
    return await Team.findAll()
}

export async function addTeam(teamId: string, teamName: string) {
    const team = new Team()
    team.teamId = teamId
    team.teamName = teamName
    return Team.build(team).save()
}

export async function getTeamById(id: string) {
    return await Team.findByPk(id)
}