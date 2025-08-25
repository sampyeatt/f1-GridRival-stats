import {Team} from '../models/Team'


export async function getAllTeams() {
    return await Team.findAll()
}

export async function addTeam(teamId: string, teamName: string) {
    const team = new Team()
    team.set({teamId, teamName})
    return team.save()
}

export async function getTeamById(id: string) {
    return Team.findByPk(id)
}

export async function updateTeam(team: Team) {
    const teamInstance = await Team.findByPk(team.teamId)
    if (teamInstance) {
        teamInstance.set(team)
        return teamInstance.save()
    }
}

export async function deleteTeam(teamId: string) {
    return await Team.destroy({where: {teamId: teamId}})
}