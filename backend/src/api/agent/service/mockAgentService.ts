import { AgentService } from './agentService';
import { Analysis } from '../analysis'; // 假设 Analysis 是一个类型或类
import { streamString } from '../streamMock'; // 假设 streamString 是一个函数

export class MockAgentService implements AgentService {
  async startGoalAgent(goal: string): Promise<string[]> {
    await this.sleep(1000); // 模拟延迟
    return ["Task X", "Task Y", "Task Z"];
  }

  async createTasksAgent(goal: string, tasks: string[], lastTask: string, result: string, completedTasks?: string[]): Promise<string[]> {
    await this.sleep(1000); // 模拟延迟
    return ["Some random task that doesn't exist"];
  }

  async analyzeTaskAgent(goal: string, task: string, toolNames: string[]): Promise<Analysis> {
    await this.sleep(1500); // 模拟延迟
    return {
      action: "reason",
      arg: "Mock analysis",
      reasoning: "Mock to avoid wasting money calling the OpenAI API.",
    } as Analysis;
  }

  async executeTaskAgent(goal: string, task: string, analysis: Analysis): Promise<Response> {
    await this.sleep(500); // 模拟延迟
    return streamString(
      `This is going to be a longer task result such that
            We make the stream of this string take time and feel long. The reality is... this is a mock!

            Lorem Ipsum is simply dummy text of the printing and typesetting industry.
            Lorem Ipsum has been the industry's standard dummy text ever since the 1500s,
            when an unknown printer took a galley of type and scrambled it to make a type specimen book.
            It has survived not only five centuries, but also the leap into electronic typesetting, remaining unchanged.
            ` + task,
      true
    );
  }

  async summarizeTaskAgent(goal: string, results: string[]): Promise<Response> {
    await this.sleep(500); // 模拟延迟
    return streamString(
      `This is going to be a longer task result such that
            We make the stream of this string take time and feel long. The reality is... this is a mock!

            Lorem Ipsum is simply dummy text of the printing and typesetting industry.
            Lorem Ipsum has been the industry's standard dummy text ever since the 1500s,
            when an unknown printer took a galley of type and scrambled it to make a type specimen book.
            It has survived not only five centuries, but also the leap into electronic typesetting, remaining unchanged.
            `,
      true
    );
  }

  async chat(message: string, results: string[]): Promise<Response> {
    await this.sleep(500); // 模拟延迟
    return streamString("What do you want dude?", true);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
