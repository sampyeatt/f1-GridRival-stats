import {Team} from '../models/Team'


export async function getAllTeams() {
    return await Team.findAll()
}



export async function getTeamById(id: string) {
    return Team.findByPk(id)
}

export async function updateTeam(team: {teamId: string; teamName: string}) {
    const teamInstance = await Team.findByPk(team.teamId)
    if (!teamInstance) return null
    teamInstance.set(team)
    return await teamInstance.save()
}

export async function deleteTeam(teamId: string) {
    return await Team.destroy({where: {teamId: teamId}})
}