import { getConnection } from './shared/auth.js';
import axios from 'axios';

export interface GetJiraTasksRequest {
    projectId: string;
    jiraProject: string;
}

export interface GetJiraTasksResponse {
    tasks?: any[];
    success?: boolean;
    error?: {
        message: string;
        details?: any;
        status?: number;
        statusText?: string;
        url?: string;
    };
}

export async function getJiraTasks(username: string, request: GetJiraTasksRequest): Promise<GetJiraTasksResponse> {
    const { projectId, jiraProject } = request;

    const connection = await getConnection(username);
    const accessToken = connection.accessToken;
    const instanceUrl = connection.instanceUrl;

    if (!accessToken || !instanceUrl) {
        throw new Error('Missing access token or instance URL.');
    }

    const url = `${instanceUrl}/services/data/v65.0/connect/devops/projects/${projectId}/workitems/getFromJIRA/${jiraProject}`;

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        // Extract the data from the response
        const result = response.data?.root || response.data;
        
        return {
            tasks: result.tasks || result,
            success: true
        };
    } catch (error: any) {
        return {
            error: {
                message: error.message,
                ...(error.response && error.response.data ? { details: error.response.data } : {}),
                status: error.response?.status,
                statusText: error.response?.statusText,
                url
            }
        };
    }   
}


