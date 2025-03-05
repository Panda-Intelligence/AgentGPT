import { HTTPException } from 'hono'; // 假设 Hono 提供 HTTPException
import { AsyncSession } from 'sqlalchemy'; // 假设这是 SQLAlchemy 的类型
import { AgentRun, AgentTask } from '../models/agent'; // 假设这些是模型
import { UserBase } from '../../schemas/user'; // 假设 UserBase 是一个类型
import { BaseCrud } from './base'; // 假设 BaseCrud 是一个类

export class AgentCRUD extends BaseCrud {
  private user: UserBase;

  constructor(session: AsyncSession, user: UserBase) {
    super(session);
    this.user = user;
  }

  async createRun(goal: string): Promise<AgentRun> {
    const run = new AgentRun({
      user_id: this.user.id,
      goal: goal,
    });
    return await run.save(this.session);
  }

  async createTask(runId: string, type_: string): Promise<AgentTask> {
    await this.validateTaskCount(runId, type_);
    const task = new AgentTask({
      run_id: runId,
      type_: type_,
    });
    return await task.save(this.session);
  }

  async validateTaskCount(runId: string, type_: string): Promise<void> {
    // 这里实现验证逻辑
    // 如果任务数量超过限制，抛出 HTTPException
  }

  // 其他方法...
}
