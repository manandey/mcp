import { describe, it, expect, vi } from 'vitest';
import { importJiraTasks } from '../src/importJiraTasks.js';
import { getConnection } from '../src/shared/auth.js';
import axios from 'axios';

vi.mock('../src/shared/auth');
vi.mock('axios');

describe('importJiraTasks', () => {
  it('should import JIRA tasks successfully', async () => {
    const mockConnection = { accessToken: 'fake-token', instanceUrl: 'https://example.com' };
    (getConnection as vi.Mock).mockResolvedValue(mockConnection);
    (axios.post as vi.Mock).mockResolvedValue({
      data: {
        root: {
          createdWorkItemIds: ['0Hbxx0000004Cdg'],
          failedJiraTasks: [],
          message: 'All JIRA tasks successfully converted to work item…',
          success: true
        }
      }
    });

    const request = {
      projectId: '1Qgxx0000004CU0CAM',
      jiraProject: 'Project_1',
      jiraTasks: ['10000']
    };

    const response = await importJiraTasks('test-user', request);
    expect(response.success).toBe(true);
    expect(response.createdWorkItemIds).toEqual(['0Hbxx0000004Cdg']);
    expect(response.failedJiraTasks).toEqual([]);
  });

  it('should return an error if access token or instance URL is missing', async () => {
    (getConnection as vi.Mock).mockResolvedValue({ accessToken: null, instanceUrl: null });

    const request = {
      projectId: '1Qgxx0000004CU0CAM',
      jiraProject: 'Project_1',
      jiraTasks: ['10000']
    };

    await expect(importJiraTasks('test-user', request)).rejects.toThrow('Missing access token or instance URL.');
  });

  it('should handle axios errors gracefully', async () => {
    const mockConnection = { accessToken: 'fake-token', instanceUrl: 'https://example.com' };
    (getConnection as vi.Mock).mockResolvedValue(mockConnection);
    (axios.post as vi.Mock).mockRejectedValue({ message: 'Network Error' });

    const request = {
      projectId: '1Qgxx0000004CU0CAM',
      jiraProject: 'Project_1',
      jiraTasks: ['10000']
    };

    const response = await importJiraTasks('test-user', request);
    expect(response.error?.message).toBe('Network Error');
  });

  it('should handle response without root object', async () => {
    const mockConnection = { accessToken: 'fake-token', instanceUrl: 'https://example.com' };
    (getConnection as vi.Mock).mockResolvedValue(mockConnection);
    (axios.post as vi.Mock).mockResolvedValue({
      data: {
        createdWorkItemIds: ['0Hbxx0000004Cdg'],
        failedJiraTasks: [],
        message: 'Success',
        success: true
      }
    });

    const request = {
      projectId: '1Qgxx0000004CU0CAM',
      jiraProject: 'Project_1',
      jiraTasks: ['10000']
    };

    const response = await importJiraTasks('test-user', request);
    expect(response.success).toBe(true);
    expect(response.createdWorkItemIds).toEqual(['0Hbxx0000004Cdg']);
  });

  it('should handle multiple JIRA tasks', async () => {
    const mockConnection = { accessToken: 'fake-token', instanceUrl: 'https://example.com' };
    (getConnection as vi.Mock).mockResolvedValue(mockConnection);
    (axios.post as vi.Mock).mockResolvedValue({
      data: {
        root: {
          createdWorkItemIds: ['0Hbxx0000004Cdg', '0Hbxx0000004Cdh'],
          failedJiraTasks: [],
          message: 'All JIRA tasks successfully converted',
          success: true
        }
      }
    });

    const request = {
      projectId: '1Qgxx0000004CU0CAM',
      jiraProject: 'Project_1',
      jiraTasks: ['10000', '10001']
    };

    const response = await importJiraTasks('test-user', request);
    expect(response.success).toBe(true);
    expect(response.createdWorkItemIds?.length).toBe(2);
  });
});


