import { AgentService } from './agentService';
import { Analysis, AnalysisArguments } from '../analysis'; // 假设 Analysis 和 AnalysisArguments 是类型或类

import { WrappedChatOpenAI } from '../modelFactory'; // 假设 WrappedChatOpenAI 是一个类
import { TokenService } from '../tokenService'; // 假设 TokenService 是一个类
import { OAuthCrud } from '../oauth'; // 假设 OAuthCrud 是一个类
import { callModelWithHandling, openaiErrorHandler, parseWithHandling } from '../helpers'; // 假设这些是函数
import { getUserTools, getToolFunction, getDefaultTool, getToolFromName } from '../tools'; // 假设这些是函数
import { ChatPromptTemplate, SystemMessagePromptTemplate } from 'langchain/prompts'; // 假设这些是类
import { LLMChain } from 'langchain'; // 假设 LLMChain 是一个类
import { streamString } from '../streamMock'; // 假设 streamString 是一个函数

export class OpenAIAgentService implements AgentService {
  private model: WrappedChatOpenAI;
  private settings: ModelSettings;
  private tokenService: TokenService;
  private callbacks?: AsyncCallbackHandler[];
  private user: UserBase;
  private oauthCrud: OAuthCrud;

  constructor(
    model: WrappedChatOpenAI,
    settings: ModelSettings,
    tokenService: TokenService,
    callbacks: AsyncCallbackHandler[] | undefined,
    user: UserBase,
    oauthCrud: OAuthCrud
  ) {
    this.model = model;
    this.settings = settings;
    this.tokenService = tokenService;
    this.callbacks = callbacks;
    this.user = user;
    this.oauthCrud = oauthCrud;
  }

  async startGoalAgent(goal: string): Promise<string[]> {
    const prompt = ChatPromptTemplate.fromMessages(
      [SystemMessagePromptTemplate.fromPrompt(start_goal_prompt)]
    );

    this.tokenService.calculateMaxTokens(
      this.model,
      prompt.formatPrompt({ goal, language: this.settings.language }).toString()
    );

    const completion = await callModelWithHandling(
      this.model,
      prompt,
      { goal, language: this.settings.language },
      this.settings,
      this.callbacks
    );

    const taskOutputParser = new TaskOutputParser([]);
    const tasks = parseWithHandling(taskOutputParser, completion);

    return tasks;
  }

  async analyzeTaskAgent(goal: string, task: string, toolNames: string[]): Promise<Analysis> {
    const userTools = await getUserTools(toolNames, this.user, this.oauthCrud);
    const functions = userTools.map(getToolFunction);
    const prompt = analyze_task_prompt.formatPrompt({ goal, task, language: this.settings.language });

    this.tokenService.calculateMaxTokens(this.model, prompt.toString(), JSON.stringify(functions));

    const message = await openaiErrorHandler(
      this.model.apredictMessages,
      prompt.toMessages(),
      functions,
      this.settings,
      this.callbacks
    );

    const functionCall = message.additional_kwargs?.function_call || {};
    const completion = functionCall.arguments || "";

    try {
      const pydanticParser = new PydanticOutputParser(AnalysisArguments);
      const analysisArguments = parseWithHandling(pydanticParser, completion);
      return new Analysis({
        action: functionCall.name || getToolName(getDefaultTool()),
        ...analysisArguments,
      });
    } catch (error) {
      return Analysis.getDefaultAnalysis(task);
    }
  }

  async executeTaskAgent(goal: string, task: string, analysis: Analysis): Promise<Response> {
    if (this.model.maxTokens > 3000) {
      this.model.maxTokens = Math.max(this.model.maxTokens - 1000, 3000);
    }

    const toolClass = getToolFromName(analysis.action);
    return await toolClass(this.model, this.settings.language).call(goal, task, analysis.arg, this.user, this.oauthCrud);
  }

  async createTasksAgent(goal: string, tasks: string[], lastTask: string, result: string, completedTasks?: string[]): Promise<string[]> {
    const prompt = ChatPromptTemplate.fromMessages(
      [SystemMessagePromptTemplate.fromPrompt(create_tasks_prompt)]
    );

    const args = {
      goal,
      language: this.settings.language,
      tasks: tasks.join("\n"),
      lastTask,
      result,
    };

    this.tokenService.calculateMaxTokens(this.model, prompt.formatPrompt(args).toString());

    const completion = await callModelWithHandling(
      this.model,
      prompt,
      args,
      this.settings,
      this.callbacks
    );

    const previousTasks = (completedTasks || []).concat(tasks);
    return completion && !previousTasks.includes(completion) ? [completion] : [];
  }

  async summarizeTaskAgent(goal: string, results: string[]): Promise<Response> {
    this.model.modelName = "gpt-3.5-turbo-16k";
    this.model.maxTokens = 8000; // 总令牌 = 提示令牌 + 完成令牌

    const snippetMaxTokens = 7000; // 留出空间给其余的提示
    const textTokens = this.tokenService.tokenize(results.join(""));
    const text = this.tokenService.detokenize(textTokens.slice(0, snippetMaxTokens));
    console.info(`Summarizing text: ${text}`);

    return streamString(
      await summarize(this.model, this.settings.language, goal, text)
    );
  }

  async chat(message: string, results: string[]): Promise<Response> {
    this.model.modelName = "gpt-3.5-turbo-16k";
    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromPrompt(chat_prompt),
      ...results.map(result => new HumanMessage(result)),
      new HumanMessage(message),
    ]);

    this.tokenService.calculateMaxTokens(this.model, prompt.formatPrompt({ language: this.settings.language }).toString());

    const chain = new LLMChain(this.model, prompt);

    return streamString(
      await StreamingResponse.fromChain(chain, { language: this.settings.language }, "text/event-stream")
    );
  }
}
