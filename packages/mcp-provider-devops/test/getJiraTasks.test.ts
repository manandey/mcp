import { describe, it, expect, vi } from 'vitest';
import { getJiraTasks } from '../src/getJiraTasks.js';
import { getConnection } from '../src/shared/auth.js';
import axios from 'axios';

vi.mock('../src/shared/auth');
vi.mock('axios');

describe('getJiraTasks', () => {
  it('should get JIRA tasks successfully', async () => {
    const mockConnection = { accessToken: 'fake-token', instanceUrl: 'https://example.com' };
    (getConnection as vi.Mock).mockResolvedValue(mockConnection);
    (axios.get as vi.Mock).mockResolvedValue({
      data: {
        root: {
          tasks: [
            { id: '10000', title: 'Task 1', status: 'Open' },
            { id: '10001', title: 'Task 2', status: 'In Progress' }
          ]
        }
      }
    });

    const request = {
      projectId: '1Qgxx0000004CU0CAM',
      jiraProject: 'Project_1'
    };

    const response = await getJiraTasks('test-user', request);
    expect(response.success).toBe(true);
    expect(response.tasks).toHaveLength(2);
    expect(response.tasks?.[0].id).toBe('10000');
  });

  it('should return an error if access token or instance URL is missing', async () => {
    (getConnection as vi.Mock).mockResolvedValue({ accessToken: null, instanceUrl: null });

    const request = {
      projectId: '1Qgxx0000004CU0CAM',
      jiraProject: 'Project_1'
    };

    await expect(getJiraTasks('test-user', request)).rejects.toThrow('Missing access token or instance URL.');
  });

  it('should handle axios errors gracefully', async () => {
    const mockConnection = { accessToken: 'fake-token', instanceUrl: 'https://example.com' };
    (getConnection as vi.Mock).mockResolvedValue(mockConnection);
    (axios.get as vi.Mock).mockRejectedValue({ message: 'Network Error' });

    const request = {
      projectId: '1Qgxx0000004CU0CAM',
      jiraProject: 'Project_1'
    };

    const response = await getJiraTasks('test-user', request);
    expect(response.error?.message).toBe('Network Error');
  });

  it('should handle response without root object', async () => {
    const mockConnection = { accessToken: 'fake-token', instanceUrl: 'https://example.com' };
    (getConnection as vi.Mock).mockResolvedValue(mockConnection);
    (axios.get as vi.Mock).mockResolvedValue({
      data: [
        { id: '10000', title: 'Task 1' },
        { id: '10001', title: 'Task 2' }
      ]
    });

    const request = {
      projectId: '1Qgxx0000004CU0CAM',
      jiraProject: 'Project_1'
    };

    const response = await getJiraTasks('test-user', request);
    expect(response.success).toBe(true);
    expect(response.tasks).toHaveLength(2);
  });

  it('should handle empty task list', async () => {
    const mockConnection = { accessToken: 'fake-token', instanceUrl: 'https://example.com' };
    (getConnection as vi.Mock).mockResolvedValue(mockConnection);
    (axios.get as vi.Mock).mockResolvedValue({
      data: {
        root: {
          tasks: []
        }
      }
    });

    const request = {
      projectId: '1Qgxx0000004CU0CAM',
      jiraProject: 'Project_1'
    };

    const response = await getJiraTasks('test-user', request);
    expect(response.success).toBe(true);
    expect(response.tasks).toEqual([]);
  });
});


