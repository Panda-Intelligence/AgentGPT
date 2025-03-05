import { AsyncSession } from 'sqlalchemy'; // 假设这是 SQLAlchemy 的类型
import { UserSession } from '../models/user'; // 假设 UserSession 是一个模型
import { BaseCrud } from './base'; // 假设 BaseCrud 是一个类

export class UserCrud extends BaseCrud {
  async getUserSession(token: string): Promise<UserSession> {
    const query = select(UserSession).filter(UserSession.session_token == token);
    return (await this.session.execute(query)).scalar_one(); // 假设这是 SQLAlchemy 的方法
  }
}
