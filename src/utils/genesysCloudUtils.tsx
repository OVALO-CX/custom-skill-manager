import { clientConfig } from '../clientConfig';
import platformClient, { Models } from 'purecloud-platform-client-v2';

/* 
 * This presence ID is hardcoded because System presence IDs are hardcoded into Genesys Cloud, can never change, and are not unique to orgs or regions
 * In constrast, Org presences are not hardcoded.
*/
const client = platformClient.ApiClient.instance;
client.setEnvironment('https://api.mypurecloud.de');
client.setPersistSettings(true, 'custom_api');
const { clientId, redirectUri } = clientConfig;

const searchApi = new platformClient.SearchApi();
const usersApi = new platformClient.UsersApi();
const tokensApi = new platformClient.TokensApi();
const routingApi = new platformClient.RoutingApi();
const presenceApi = new platformClient.PresenceApi();
const locationApi = new platformClient.LocationsApi();


const getAllPages = async (request: Function) => {
    let listElements = []
    let pageNumber = 1
    let result: any = {}
    do {
        result = await request({ 
            'pageNumber': pageNumber++, // Number | Page number
            'pageSize': 25, expand: ['locations', 'skills']})
            result.entities?.length > 0 && 
            listElements.push(...result.entities)
    } while(result.pageNumber < result.pageCount)
    return listElements
}

export function authenticate() {
    return client.loginImplicitGrant(clientId, redirectUri, { state: 'state' })
        .then((data: any) => {
            return data;
        })
        .catch((err: any) => {
            console.error(err);
        });
}

export function getUserByEmail(email: string) {
    const body = {
        pageSize: 25,
        pageNumber: 1,
        query: [{
            type: "TERM",
            fields: ["email", "name"],
            value: email
        }]
    };
    return searchApi.postUsersSearch(body);
}

export async function getAllLocations() {
    return await getAllPages((e: any) =>  locationApi.getLocations(e))
}

export async function getAllUsers() {
    return await getAllPages((e: any) => usersApi.getUsers(e));
}

export async function getUserSkills(userId: string) {
    const result = await usersApi.getUserRoutingskills(userId)
    return result.entities || []
}

export async function getUserQueues(userId: string) {
    return usersApi.getUserQueues(userId);
}

export async function updateUserRoutingSkills(userId: string, skills: Models.UserRoutingSkillPost[]) {
    return usersApi.putUserRoutingskillsBulk(userId, skills);
}

export async function getAllQueues() {
    return await getAllPages((e: any) =>  routingApi.getRoutingQueues(e))
}

export async function getQueueMembers(queueId: string)  {
    const result = await routingApi.getRoutingQueueMembers(queueId)
    return result.entities || []
}

export async function getAllSkills() {
    return await getAllPages((e: any) =>  routingApi.getRoutingSkills(e))
}

export function getUserRoutingStatus(userId: string) {
    return usersApi.getUserRoutingstatus(userId);
}

export function logoutUser(userId: string) {
    return Promise.all([
        tokensApi.deleteToken(userId),
        presenceApi.patchUserPresence(userId, 'PURECLOUD', {
            presenceDefinition: { id: clientConfig.offlinePresenceId }
        })
    ])
}

export async function logoutUsersFromQueue(queueId: string) {
    routingApi.getRoutingQueueMembers(queueId)
        .then((data: any) => {
            return Promise.all(data.entities.map((user: any) => logoutUser(user.id)));
        })
        .catch((err: any) => {
            console.error(err);
        })
}

export async function getUserMe() {
    return usersApi.getUsersMe({ 
        expand: ['routingStatus', 'presence', 'locations'],
    });

}
