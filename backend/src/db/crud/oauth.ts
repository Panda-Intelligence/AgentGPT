import { AsyncSession } from 'sqlalchemy'; // 假设这是 SQLAlchemy 的类型
import { UserBase } from '../schemas/user'; // 假设 UserBase 是一个类型
import { OauthCredentials } from '../models/auth'; // 假设 OauthCredentials 是一个模型
import { BaseCrud } from './base'; // 假设 BaseCrud 是一个类

export class OAuthCrud extends BaseCrud {
  async createInstallation(user: UserBase, provider: string, redirectUri?: string): Promise<OauthCredentials> {
    const credentials = new OauthCredentials({
      user_id: user.id,
      organization_id: user.organization_id,
      provider: provider,
      state: this.generateState(),
      redirect_uri: redirectUri,
    });
    return await credentials.save(this.session); // 假设 save 是一个方法
  }

  private generateState(): string {
    return Math.random().toString(36).substring(2); // 生成随机状态
  }
}
