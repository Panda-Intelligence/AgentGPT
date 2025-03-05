import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { streamSSE } from 'hono/streaming';
import { AgentRunRequest, getAgentService } from './dependencies';
import { AgentTask, createTaskOutput } from './analysis';
import { createModel } from './model-factory';
import { TaskOutputParser } from './task-output-parser';
import { createTaskMessage } from './helpers';
import { PlatformaticError } from '../errors';
import {
  getAgentService
} from './service/agentServiceProvider';
import { Analysis } from './analysis';
import {
  agentAnalyzeValidator,
  agentChatValidator,
  agentCreateValidator,
  agentExecuteValidator,
  agentStartValidator,
  agentSummarizeValidator
} from './dependencies';
import { ToolRegistry } from './tools/tools';
import { NewTasksResponse, ToolsResponse } from './types';


export function initAgentRouter(router: Hono) {
  router.post('/agent/run', zValidator('json', AgentRunRequest), async (c) => {
    const { goal, modelSettings, tasks } = c.req.valid('json');
    const agentService = getAgentService(c);

    // Validate environment and API key
    agentService.validateEnvironment();
    const apiKey = agentService.validateAndParseKey(modelSettings.customApiKey);
    const model = agentService.getModel(modelSettings);

    return streamSSE(c, async (stream) => {
      try {
        const languageModel = createModel(modelSettings, apiKey);
        const taskOutput = createTaskOutput(tasks);

        // Send initial state
        await stream.writeSSE({
          data: JSON.stringify(taskOutput),
        });

        // Create completion
        const messages = createTaskMessage(goal, tasks[0].value, model);
        const completion = languageModel.execute(messages);

        let analysisText = '';
        for await (const chunk of completion) {
          analysisText += chunk;

          // Try to parse partial JSON responses
          for await (const analysis of TaskOutputParser.parsePartialJson(analysisText)) {
            if (analysis.reasoning || analysis.action || analysis.arg) {
              const updatedTask: AgentTask = {
                ...tasks[0],
                analysis,
              };

              await stream.writeSSE({
                data: JSON.stringify(createTaskOutput(tasks, updatedTask)),
              });
            }
          }
        }

        // Send final state
        const finalTask: AgentTask = {
          ...tasks[0],
          status: 'completed',
        };

        await stream.writeSSE({
          data: JSON.stringify(createTaskOutput(tasks, finalTask)),
        });
      } catch (error) {
        if (error instanceof PlatformaticError) {
          await stream.writeSSE({
            event: 'error',
            data: JSON.stringify({
              code: error.code,
              message: error.message,
            }),
          });
        } else {
          await stream.writeSSE({
            event: 'error',
            data: JSON.stringify({
              code: 'UNKNOWN_ERROR',
              message: 'An unexpected error occurred',
            }),
          });
        }
      }
    });
  });


  // Start tasks endpoint
  router.post('/start', zValidator('json', agentStartValidator), async (c) => {
    const reqBody = c.req.valid('json');
    const agentService = await getAgentService(agentStartValidator);

    const newTasks = await agentService.startGoalAgent(reqBody.goal);
    return c.json<NewTasksResponse>({
      newTasks,
      run_id: reqBody.run_id,
    });
  });

  // Analyze tasks endpoint
  router.post('/analyze', zValidator('json', agentAnalyzeValidator), async (c) => {
    const reqBody = c.req.valid('json');
    const agentService = await getAgentService(agentAnalyzeValidator);

    const analysis = await agentService.analyzeTaskAgent(
      reqBody.goal,
      reqBody.task || '',
      reqBody.tool_names || []
    );
    return c.json<Analysis>(analysis);
  });

  // Execute tasks endpoint
  router.post('/execute', zValidator('json', agentExecuteValidator), async (c) => {
    const reqBody = c.req.valid('json');
    const agentService = await getAgentService(agentExecuteValidator, true);

    return streamSSE(c, async (stream) => {
      try {
        const executionStream = await agentService.executeTaskAgent(
          reqBody.goal || '',
          reqBody.task || '',
          reqBody.analysis
        );

        for await (const chunk of executionStream) {
          await stream.writeSSE({ data: chunk });
        }
      } catch (error) {
        await stream.writeSSE({
          event: 'error',
          data: JSON.stringify({ error: error.message })
        });
      }
    });
  });

  // Create tasks endpoint
  router.post('/create', zValidator('json', agentCreateValidator), async (c) => {
    const reqBody = c.req.valid('json');
    const agentService = await getAgentService(agentCreateValidator);

    const newTasks = await agentService.createTasksAgent(
      reqBody.goal,
      reqBody.tasks || [],
      reqBody.last_task || '',
      reqBody.result || '',
      reqBody.completed_tasks || []
    );

    return c.json<NewTasksResponse>({
      newTasks,
      run_id: reqBody.run_id,
    });
  });

  // Summarize tasks endpoint
  router.post('/summarize', zValidator('json', agentSummarizeValidator), async (c) => {
    const reqBody = c.req.valid('json');
    const agentService = await getAgentService(
      agentSummarizeValidator,
      true,
      'gpt-3.5-turbo-16k'
    );

    return streamSSE(c, async (stream) => {
      try {
        const summaryStream = await agentService.summarizeTaskAgent(
          reqBody.goal || '',
          reqBody.results
        );

        for await (const chunk of summaryStream) {
          await stream.writeSSE({ data: chunk });
        }
      } catch (error) {
        await stream.writeSSE({
          event: 'error',
          data: JSON.stringify({ error: error.message })
        });
      }
    });
  });

  // Chat endpoint
  router.post('/chat', zValidator('json', agentChatValidator), async (c) => {
    const reqBody = c.req.valid('json');
    const agentService = await getAgentService(
      agentChatValidator,
      true,
      'gpt-3.5-turbo-16k'
    );

    return streamSSE(c, async (stream) => {
      try {
        const chatStream = await agentService.chat(
          reqBody.message,
          reqBody.results
        );

        for await (const chunk of chatStream) {
          await stream.writeSSE({ data: chunk });
        }
      } catch (error) {
        await stream.writeSSE({
          event: 'error',
          data: JSON.stringify({ error: error.message })
        });
      }
    });
  });

  // Get tools endpoint
  router.get('/tools', async (c) => {
    const tools = ToolRegistry.getExternalTools();
    const formattedTools = tools
      .filter(tool => tool.available())
      .map(tool => ({
        name: tool.name,
        description: tool.description,
        color: 'TODO: Change to image of tool',
        image_url: tool.image_url,
      }));

    return c.json<ToolsResponse>({ tools: formattedTools });
  });
}
