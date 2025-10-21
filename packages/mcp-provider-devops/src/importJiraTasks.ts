import { getConnection } from './shared/auth.js';
import axios from 'axios';

export interface ImportJiraTasksRequest {
    projectId: string;
    jiraProject: string;
    jiraTasks: string[];
}

export interface ImportJiraTasksResponse {
    createdWorkItemIds?: string[];
    failedJiraTasks?: string[];
    message?: string;
    success?: boolean;
    error?: {
        message: string;
        details?: any;
        status?: number;
        statusText?: string;
        url?: string;
        requestBody?: any;
    };
}

export async function importJiraTasks(username: string, request: ImportJiraTasksRequest): Promise<ImportJiraTasksResponse> {
    const { projectId, jiraProject, jiraTasks } = request;

    const connection = await getConnection(username);
    const accessToken = connection.accessToken;
    const instanceUrl = connection.instanceUrl;

    if (!accessToken || !instanceUrl) {
        throw new Error('Missing access token or instance URL.');
    }

    // Hardcoded JIRA credentials as per requirements
    const body = {
        jiraNamedCredential: "JIRA_CREDENTIAL",
        jiraProject: jiraProject,
        jiraTasks: jiraTasks,
        jiraURL: "https://neilmathewm.atlassian.net",
        jiraToken: "bmVpbG1hdGhld21AZ21haWwuY29tOkFUQVRUM3hGZkdGMGpraHlyR0JRSkQ5dFdySHFjdENEZGxmVVM2RTl5d210bUZ5Zk9sMWdJYmJ6M1dOS3N1UjVfS0RheUxTcUkyU2o3YTNYS0gyOHpzMzZ0V1hGYUJ5bzVGQXlPVDl1RElmWDgtbkI1dDZiN1hOUi1Xa2pwaFM1X3VyVUhtQVpjV1paTjgtMEtqNDFlUm5pVF9YcXl1dFFPUXVmdi1VM2JNYkF3OFkxRzFaX2pPYz04RjkwQTg4RQ"
    };

    const url = `${instanceUrl}/services/data/v65.0/connect/devops/projects/${projectId}/workitems/createFromJIRA`;

    try {
        const response = await axios.post(url, body, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        // Extract the root object from the response
        const result = response.data?.root || response.data;
        
        return {
            createdWorkItemIds: result.createdWorkItemIds,
            failedJiraTasks: result.failedJiraTasks,
            message: result.message,
            success: result.success
        };
    } catch (error: any) {
        return {
            error: {
                message: error.message,
                ...(error.response && error.response.data ? { details: error.response.data } : {}),
                status: error.response?.status,
                statusText: error.response?.statusText,
                url,
                requestBody: body
            }
        };
    }   
}


