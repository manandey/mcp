import { z } from "zod";
import { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { McpTool, McpToolConfig, ReleaseState, Toolset, TelemetryService } from "@salesforce/mcp-provider-api";
import { getJiraTasks } from "../getJiraTasks.js";

const inputSchema = z.object({
  username: z.string().describe("Username of the DevOps Center org"),
  projectId: z.string().describe("DevOps Center Project ID (e.g., 1Qgxx0000004CU0CAM)"),
  jiraProject: z.string().describe("JIRA Project identifier")
});

type InputArgs = z.infer<typeof inputSchema>;
type InputArgsShape = typeof inputSchema.shape;
type OutputArgsShape = z.ZodRawShape;

export class SfDevopsGetJiraTasks extends McpTool<InputArgsShape, OutputArgsShape> {
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
    return "get_jira_tasks_from_devops_center";
  }

  public getConfig(): McpToolConfig<InputArgsShape, OutputArgsShape> {
    return {
      title: "Get JIRA Tasks from DevOps Center",
      description: `Retrieve JIRA tasks for a specific project through DevOps Center. This is STEP 1 of the JIRA import workflow.

      **IMPORTANT WORKFLOW:**
      This tool should be called FIRST to get available JIRA tasks with their IDs and details. 
      Then use the task IDs from this response to import selected tasks with 'import_jira_tasks_to_devops_center'.

      **Use when user asks (examples):**
      - "Get JIRA tasks for Project1"
      - "List all JIRA tasks from my project"
      - "Show me available JIRA tasks"
      - "What JIRA tasks can I import?"

      **Prerequisites:**
      - This tool must be used only for the DevOps Center org.
      - The user must provide: username (DevOps Center), projectId, and jiraProject.

      **Input Parameters:**
      - username: DevOps Center org username. If missing, use 'list_all_orgs' and ask user to select the DevOps Center org.
      - projectId: The DevOps Center Project ID.
      - jiraProject: The JIRA project identifier.

      **Behavior:**
      1. Takes the provided DevOps project ID and JIRA project name.
      2. Calls the DevOps Connect API to retrieve JIRA tasks.
      3. Returns the list of available JIRA tasks with their IDs and detailed information.

      **Safety and guidance for the LLM:**
      - Do not auto-select a non-DevOps Center org; always confirm with the user.
      - Validate that all required parameters are provided before calling.

      **Output:**
      - JSON with tasks array containing task IDs, titles, status, and other JIRA task details.
      - Each task object includes an 'id' or 'key' field that should be used for importing.

      **Next steps (MANDATORY):**
      - Display the JIRA tasks to the user with their IDs clearly shown.
      - Ask the user which task IDs they want to import.
      - Use the selected task IDs with the 'import_jira_tasks_to_devops_center' tool to create DevOps work items.
      - Example: If tasks returned have IDs ["10000", "10001"], user can import both or select specific ones.
      `,
      inputSchema: inputSchema.shape,
      outputSchema: undefined,
    };
  }

  public async exec(input: InputArgs): Promise<CallToolResult> {
    try {
      const result = await getJiraTasks(input.username, {
        projectId: input.projectId,
        jiraProject: input.jiraProject
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
            tasks: result.tasks,
            taskCount: result.tasks?.length || 0
          }, null, 2)
        }]
      };
    } catch (error: any) {
      return {
        content: [{
          type: "text",
          text: `Error getting JIRA tasks: ${error?.message || error}`
        }],
        isError: true
      };
    }
  }
}

