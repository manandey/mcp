import { z } from "zod";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { McpTool, McpToolConfig, ReleaseState, Toolset, TelemetryService } from "@salesforce/mcp-provider-api";
import { importJiraTasks } from "../importJiraTasks.js";

const inputSchema = z.object({
  username: z.string().describe("Username of the DevOps Center org"),
  projectId: z.string().describe("DevOps Center Project ID (e.g., 1Qgxx0000004CU0CAM)"),
  jiraProject: z.string().describe("JIRA Project identifier"),
  jiraTasks: z.array(z.string()).nonempty().describe("Array of JIRA task IDs to import")
});

type InputArgs = z.infer<typeof inputSchema>;
type InputArgsShape = typeof inputSchema.shape;
type OutputArgsShape = z.ZodRawShape;

export class SfDevopsImportJiraTasks extends McpTool<InputArgsShape, OutputArgsShape> {
  private readonly telemetryService: TelemetryService;

  constructor(telemetryService: TelemetryService) {
    super();
    this.telemetryService = telemetryService;
  }

  public getReleaseState(): ReleaseState {
    return ReleaseState.NON_GA;
  }

  public getToolsets(): Toolset[] {
    return [Toolset.DEVOPS];
  }

  public getName(): string {
    return "import_jira_tasks_to_devops_center";
  }

  public getConfig(): McpToolConfig<InputArgsShape, OutputArgsShape> {
    return {
      title: "Import JIRA Tasks to DevOps Center",
      description: `Import JIRA tasks as DevOps Center work items. This is STEP 2 of the JIRA import workflow.

      **IMPORTANT WORKFLOW:**
      This tool should be called AFTER getting JIRA tasks with 'get_jira_tasks_from_devops_center'.
      Use the task IDs from that tool's response to import selected tasks.

      **RECOMMENDED WORKFLOW:**
      1. First call 'get_jira_tasks_from_devops_center' to see available JIRA tasks
      2. User selects which task IDs they want to import
      3. Then call this tool with the selected task IDs

      **Use when user asks (examples):**
      - "Import JIRA task 10000 to DevOps Center"
      - "Create work items from JIRA tasks"
      - "Convert JIRA tasks to DevOps work items"
      - "Import the tasks we just retrieved"

      **Prerequisites:**
      - This tool must be used only for the DevOps Center org.
      - The user must provide: username (DevOps Center), projectId, jiraProject, and jiraTasks array.
      - Task IDs should come from the 'get_jira_tasks_from_devops_center' tool response.

      **Input Parameters:**
      - username: DevOps Center org username. If missing, use 'list_all_orgs' and ask user to select the DevOps Center org.
      - projectId: The DevOps Center Project ID where work items will be created.
      - jiraProject: The JIRA project identifier.
      - jiraTasks: Array of JIRA task IDs to import (e.g., ["10000", "10001"]) - these should be task IDs retrieved from 'get_jira_tasks_from_devops_center'.

      **Behavior:**
      1. Takes the provided JIRA task IDs and project information.
      2. Calls the DevOps Connect API to import JIRA tasks as work items.
      3. Returns the created work item IDs and any failed tasks.

      **Safety and guidance for the LLM:**
      - Do not auto-select a non-DevOps Center org; always confirm with the user.
      - If task IDs are not provided, suggest calling 'get_jira_tasks_from_devops_center' first.
      - Validate that all required parameters are provided before calling.
      - Never import without explicit user confirmation of which tasks to import.

      **Output:**
      - JSON with createdWorkItemIds, failedJiraTasks, success status, and message.

      **Next steps:**
      - Display the created work item IDs to the user.
      - If there are failed tasks, inform the user which tasks failed and why.
      - Suggest viewing the work items in DevOps Center or using 'list_devops_center_work_items' to see them.
      `,
      inputSchema: inputSchema.shape,
      outputSchema: undefined,
    };
  }

  public async exec(input: InputArgs): Promise<CallToolResult> {
    try {
      const result = await importJiraTasks(input.username, {
        projectId: input.projectId,
        jiraProject: input.jiraProject,
        jiraTasks: input.jiraTasks
      });

      if (result.error) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              error: result.error.message,
              details: result.error.details,
              status: result.error.status
            }, null, 2)
          }],
          isError: true
        };
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: result.success,
            message: result.message,
            createdWorkItemIds: result.createdWorkItemIds,
            failedJiraTasks: result.failedJiraTasks
          }, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error importing JIRA tasks: ${error?.message || error}`
        }],
        isError: true
      };
    }
  }
}

