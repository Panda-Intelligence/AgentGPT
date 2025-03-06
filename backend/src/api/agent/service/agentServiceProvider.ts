import { AgentService } from './agentService'; // 假设 AgentService 是一个类

export function getAgentService(validator: Function, streaming: boolean = false, llmModel?: string): AgentService {
  // 根据传入的 validator 创建 AgentService 实例
  const agentService = new AgentService(validator, streaming, llmModel);
  return agentService;
}
